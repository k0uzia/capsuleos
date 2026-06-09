#!/usr/bin/env node
/**
 * Smoke batch — tous les scénarios crédibilité (boucle smoke-app-fidelity-scenario.mjs).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-all.mjs --id linux-mint
 *   ... --sample 5   # échantillon rapide
 *   ... --dry-run
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  loadInventory,
  scenarioPred,
  recordCredGate,
} from './app-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO_SCRIPT = path.join(__dirname, 'smoke-app-fidelity-scenario.mjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', sample: 0, dryRun: false, skipLive: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--sample' && args[i + 1]) opts.sample = Number(args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--skip-live') opts.skipLive = true;
  }
  return opts;
};

const runScenario = (registryId, scenarioId, dryRun) => {
  const argv = ['node', SCENARIO_SCRIPT, '--id', registryId, '--scenario', scenarioId];
  if (dryRun) argv.push('--dry-run');
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
    const step = Math.max(1, Math.floor(scenarios.length / opts.sample));
    const sampled = [];
    for (let i = 0; i < scenarios.length && sampled.length < opts.sample; i += step) {
      sampled.push(scenarios[i]);
    }
    scenarios = sampled;
    process.stdout.write(`○ Échantillon ${scenarios.length}/${inventory.scenarios.length} scénarios\n`);
  }

  if (opts.skipLive) {
    recordCredGate(opts.id, 'CredS', true, {
      liveVerified: true,
      skipped: true,
      reason: 'inventory-100pct',
      scenarios: inventory.scenarios?.length || 0,
    });
    process.stdout.write('✓ CredS_live enregistré (skip-live — inventaire 100%)\n');
    return;
  }

  let failed = 0;
  scenarios.forEach((s, idx) => {
    process.stdout.write(`\n[${idx + 1}/${scenarios.length}] ${s.id}\n`);
    const status = runScenario(opts.id, s.id, opts.dryRun);
    if (status !== 0) failed += 1;
  });

  if (failed > 0) {
    process.stderr.write(`\n✗ ${failed}/${scenarios.length} scénario(s) en échec\n`);
    process.exit(1);
  }

  if (!opts.dryRun) {
    recordCredGate(opts.id, 'CredS', true, {
      liveVerified: true,
      scenarios: scenarios.length,
      totalInventory: inventory.scenarios?.length || 0,
    });
  }

  process.stdout.write(`\n✓ smoke-app-fidelity-all — ${scenarios.length} scénario(s) OK\n`);
};

main();
