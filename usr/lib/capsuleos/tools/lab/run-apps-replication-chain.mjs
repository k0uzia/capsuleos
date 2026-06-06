#!/usr/bin/env node
/**
 * Orchestrateur chaîne apps — AppVv → AppVc → AppVp (miroir run-replication-chain).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs --id linux-rocky --dry-run
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  evaluateAppsReplicationPredicates,
  loadAppsReplicationContract,
  writeAppsReplicationState,
} from './apps-replication-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', dryRun: false, auto: false, maxSteps: 8 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
  }
  return opts;
};

const buildStepArgv = (step, registryId) => {
  const argv = [];
  for (const a of step.args || []) {
    if (a === '--id') argv.push('--id', registryId);
    else argv.push(a);
  }
  return argv;
};

const runStep = (step, registryId) => {
  const script = path.join(ROOT, step.script);
  return spawnSync(process.execPath, [script, ...buildStepArgv(step, registryId)], {
    cwd: ROOT,
    stdio: 'inherit',
    encoding: 'utf8',
  });
};

const main = () => {
  const opts = parseArgs();
  const contract = loadAppsReplicationContract();
  let stepsRun = 0;

  process.stdout.write(`=== apps-replication-chain ${opts.id}${opts.auto ? ' [auto]' : ''} ===\n`);

  while (stepsRun < opts.maxSteps) {
    const evalResult = evaluateAppsReplicationPredicates(opts.id);
    const state = writeAppsReplicationState(evalResult);
    const s = evalResult.state;
    process.stdout.write(
      `Prédicats: AppL=${s.AppL} AppVv=${s.AppVv} AppVc=${s.AppVc} AppVp=${s.AppVp} AppΣ=${s.AppΣ} → next=${evalResult.nextPredicate || '—'}\n`,
    );

    if (!evalResult.nextPredicate && !state.nextStep) {
      process.stdout.write('✓ Chaîne apps complète pour le périmètre actuel\n');
      break;
    }

    const step = contract.steps.find((st) => st.id === state.nextStep);
    if (!step) {
      process.stdout.write(`Prochain prédicat manuel: ${evalResult.nextPredicate}\n`);
      break;
    }

    if (opts.dryRun) {
      const argv = buildStepArgv(step, opts.id);
      process.stdout.write(`[dry-run] ${step.script} ${argv.join(' ')}\n`);
      break;
    }

    if (!opts.auto) break;

    const res = runStep(step, opts.id);
    if (res.status !== 0) process.exit(res.status || 1);
    stepsRun += 1;
  }
};

main();
