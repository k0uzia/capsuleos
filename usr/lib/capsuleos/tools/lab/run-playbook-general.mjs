#!/usr/bin/env node
/**
 * Orchestrateur playbook général multiplateforme (G-PB).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-playbook-general.mjs --id linux-rocky --dry-run
 *   node usr/lib/capsuleos/tools/lab/run-playbook-general.mjs --id linux-rocky --auto
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  ROOT,
  evaluatePredicates,
} from './replication-chain-lib.mjs';
import {
  evaluateUniversal,
  findNextLayer,
  loadPlaybookGeneral,
} from './playbook-general-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', dryRun: false, auto: false, maxSteps: 16 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
  }
  return opts;
};

const fillArgs = (args, registryId) => {
  const out = [];
  for (const a of args || []) {
    if (a === '{id}') out.push(registryId);
    else out.push(a);
  }
  return out;
};

const runScript = (relScript, argv) => {
  const script = path.join(ROOT, relScript);
  return spawnSync(process.execPath, [script, ...argv], { cwd: ROOT, stdio: 'inherit', encoding: 'utf8' });
};

const runToolkitOrchestrator = (registryId, relPath, auto) => {
  const extra = auto ? ['--auto'] : [];
  return runScript(relPath, ['--id', registryId, ...extra]);
};

const writeState = (registryId, payload) => {
  const out = path.join(ROOT, 'root/docs/inventaires', `${registryId}-playbook-general-state.json`);
  fs.writeFileSync(out, `${JSON.stringify({ ...payload, generatedAt: new Date().toISOString() }, null, 2)}\n`);
  return out;
};

const executeLayer = (registryId, next, opts) => {
  if (next.layer === 'universal' && next.step?.script) {
    const argv = fillArgs(next.step.args, registryId);
    if (opts.dryRun) {
      process.stdout.write(`(dry-run) universal ${next.step.id}: node ${next.step.script} ${argv.join(' ')}\n`);
      return 0;
    }
    return runScript(next.step.script, argv).status || 0;
  }
  if (next.layer === 'universal' && next.step?.manualGate) {
    process.stderr.write(`⚠ Étape manuelle requise : ${next.step.id} — ${next.reason || next.step.note}\n`);
    return 2;
  }
  if (next.layer === 'toolkit' && next.orchestrator) {
    if (opts.dryRun) {
      process.stdout.write(`(dry-run) toolkit: node ${next.orchestrator} --id ${registryId}${opts.auto ? ' --auto' : ''}\n`);
      return 0;
    }
    return runToolkitOrchestrator(registryId, next.orchestrator, opts.auto).status || 0;
  }
  if (next.layer === 'toolkit' && next.stub) {
    process.stderr.write(`⚠ ${next.message}\n`);
    return 2;
  }
  if (next.layer === 'tail' && next.step?.script) {
    const argv = fillArgs(next.step.args, registryId);
    if (opts.dryRun) {
      process.stdout.write(`(dry-run) tail ${next.step.id}: node ${next.step.script} ${argv.join(' ')}\n`);
      return 0;
    }
    return runScript(next.step.script, argv).status || 0;
  }
  if (next.layer === 'complete') {
    process.stdout.write(`✓ ${next.message}\n`);
    return 0;
  }
  process.stderr.write(`⚠ Couche inconnue : ${JSON.stringify(next)}\n`);
  return 2;
};

const main = () => {
  const opts = parseArgs();
  const contract = loadPlaybookGeneral();

  if (!contract.validated || !contract.autoExecution?.enabled) {
    process.stderr.write('⚠ playbook-general non validé — mode auto désactivé\n');
    if (opts.auto) process.exit(2);
  }

  process.stdout.write(`=== playbook-general ${opts.id}${opts.auto ? ' [auto]' : ''} ===\n`);

  let stepsRun = 0;
  while (stepsRun < opts.maxSteps) {
    const evalResult = evaluateUniversal(opts.id);
    const next = findNextLayer(evalResult);

    process.stdout.write(
      `PbU=${evalResult.state.PbU} PbT=${evalResult.state.PbT} Pbτ=${evalResult.state.Pbτ} PbΣ=${evalResult.state.PbΣ} `
      + `layer=${next.layer} rule=${next.rule || '-'}\n`,
    );

    writeState(opts.id, { registryId: opts.id, predicates: evalResult.state, next, stepsRun });

    if (next.layer === 'complete') {
      executeLayer(opts.id, next, opts);
      break;
    }

    const status = executeLayer(opts.id, next, opts);
    if (status === 2) {
      if (!opts.auto) process.exit(2);
      break;
    }
    if (status !== 0) process.exit(status);

    stepsRun += 1;
    if (!opts.auto) break;
  }

  if (opts.auto && stepsRun >= opts.maxSteps) {
    process.stderr.write(`⚠ max-steps (${opts.maxSteps})\n`);
  }
};

main();
