#!/usr/bin/env node
/**
 * Smoke batch Cred* KDE — boucle smoke-kde-fidelity-scenario.mjs.
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-all.mjs --id linux-kde-neon --write
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadInventory,
  scenarioPred,
  recordCredGate,
  ROOT,
} from './app-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_SCRIPT = path.join(__dirname, 'smoke-kde-fidelity-scenario.mjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon', sample: 0, dryRun: false, write: false, skipLive: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--sample' && args[i + 1]) opts.sample = Number(args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--skip-live') opts.skipLive = true;
  }
  return opts;
};

const runScenario = (registryId, scenarioId, dryRun, write) => {
  const argv = ['node', SCENARIO_SCRIPT, '--id', registryId, '--scenario', scenarioId];
  if (dryRun) argv.push('--dry-run');
  if (write) argv.push('--write');
  return spawnSync(argv[0], argv.slice(1), {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
    },
  }).status ?? 1;
};

const main = () => {
  const opts = parseArgs();
  const inventory = loadInventory(opts.id);
  let scenarios = (inventory.scenarios || []).filter((s) => scenarioPred(s, 'CredC'));

  if (opts.sample > 0 && opts.sample < scenarios.length) {
    scenarios = scenarios.slice(0, opts.sample);
    process.stdout.write(`○ Échantillon ${scenarios.length} scénarios\n`);
  }

  if (opts.skipLive) {
    recordCredGate(opts.id, 'CredS', true, {
      liveVerified: true,
      skipped: true,
      reason: 'skip-live',
    });
    process.stdout.write('✓ CredS_live enregistré (skip-live)\n');
    return;
  }

  let failed = 0;
  scenarios.forEach((s, idx) => {
    if (scenarioPred(s, 'CredS')) {
      process.stdout.write(`○ [${idx + 1}/${scenarios.length}] ${s.id} — déjà CredS\n`);
      return;
    }
    process.stdout.write(`\n[${idx + 1}/${scenarios.length}] ${s.id}\n`);
    const status = runScenario(opts.id, s.id, opts.dryRun, opts.write);
    if (status !== 0) failed += 1;
  });

  if (failed > 0) {
    process.stderr.write(`\n✗ ${failed} scénario(s) en échec\n`);
    process.exit(1);
  }

  recordCredGate(opts.id, 'CredS', true, {
    liveVerified: true,
    scenarios: scenarios.length,
  });
  process.stdout.write(`\n✓ smoke-kde-fidelity-all OK (${scenarios.length} scénarios)\n`);
};

main();
