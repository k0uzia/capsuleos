#!/usr/bin/env node
/**
 * Orchestrateur pipeline unifié — une entrée par registryId (§5.2 plan maître).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id linux-ubuntu --max-steps 8
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordFormalGate } from './formal-rules-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const RESOLVE = path.join(__dirname, 'resolve-agent-action.mjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', maxSteps: 12, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const resolve = (registryId) => {
  const res = spawnSync(process.execPath, [RESOLVE, '--id', registryId, '--scope', 'pipeline'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(`resolve pipeline échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return JSON.parse(res.stdout);
};

const runCommand = (command) => {
  process.stdout.write(`\n── ${command} ──\n`);
  const res = spawnSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
    },
  });
  return res.status ?? 1;
};

const main = () => {
  const opts = parseArgs();
  process.stdout.write(`=== run-capsule-pipeline ${opts.id} (max ${opts.maxSteps}) ===\n`);

  let steps = 0;
  while (steps < opts.maxSteps) {
    const out = resolve(opts.id);
    process.stdout.write(
      `[${out.layer}] ${out.rule} auto=${out.autoExecute} — ${out.message || '-'}\n`,
    );

    if (!out.command || out.rule === 'R-PIPELINE-DONE') {
      process.stdout.write(`✓ Pipeline terminé — ${out.message}\n`);
      return;
    }

    if (!out.autoExecute || opts.dryRun) {
      process.stdout.write(`⏸ Action manuelle : ${out.command}\n`);
      return;
    }

    const status = runCommand(out.command);
    if (status !== 0) process.exit(status);

    if (out.gateOnSuccess === 'H2' && out.rule === 'R-H1') {
      recordFormalGate(opts.id, 'H2', true, { via: 'run-capsule-pipeline' });
    }

    steps += 1;
  }

  process.stdout.write(`⏸ max-steps (${opts.maxSteps}) atteint\n`);
};

main();
