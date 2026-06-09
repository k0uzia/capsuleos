#!/usr/bin/env node
/**
 * Orchestrateur chaîne de réplication — exécute la prochaine étape admissible (R-AUTO).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-replication-chain.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/run-replication-chain.mjs --id linux-rocky --dry-run
 *   node usr/lib/capsuleos/tools/lab/run-replication-chain.mjs --id linux-rocky --domain gnome-settings-playbook
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  ROOT,
  evaluatePredicates,
  loadContract,
  pathsForRegistry,
} from './replication-chain-lib.mjs';
import { resolveChainNextAction } from './lab-recipe-resolver.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', dryRun: false, auto: false, maxSteps: 12, domain: 'gnome-settings-playbook' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
    else if (args[i] === '--domain' && args[i + 1]) opts.domain = args[++i];
  }
  return opts;
};

const writeState = (evalResult) => {
  const out = {
    registryId: evalResult.registryId,
    domain: evalResult.domain,
    generatedAt: new Date().toISOString(),
    predicates: evalResult.state,
    nextPredicate: evalResult.nextPredicate,
    nextStep: null,
    rule: null,
  };
  const contract = loadContract();
  for (const step of contract.steps || []) {
    const neg = (step.negates || []).some((sym) => !evalResult.state[sym]);
    const req = (step.requires || []).every((sym) => evalResult.state[sym]);
    if (neg && req) {
      out.nextStep = step.id;
      out.rule = `R-PRI chain → ${step.id}`;
      break;
    }
  }
  const statePath = pathsForRegistry(evalResult.registryId).replicationState;
  fs.writeFileSync(statePath, `${JSON.stringify(out, null, 2)}\n`);
  return out;
};

const runStep = (step, registryId) => {
  const script = path.join(ROOT, step.script);
  const argv = [];
  for (const a of step.args || []) {
    if (a === '--id') argv.push('--id', registryId);
    else if (a === '--registry') argv.push('--registry', registryId);
    else argv.push(a);
  }
  return spawnSync(process.execPath, [script, ...argv], { cwd: ROOT, stdio: 'inherit', encoding: 'utf8' });
};

const main = () => {
  const opts = parseArgs();
  const contract = loadContract();
  let stepsRun = 0;

  process.stdout.write(`=== replication-chain ${opts.id} (${opts.domain})${opts.auto ? ' [auto]' : ''} ===\n`);

  while (stepsRun < opts.maxSteps) {
    const evalResult = evaluatePredicates(opts.id, opts.domain);
    const state = writeState(evalResult);
    process.stdout.write(
      `Prédicats: V=${evalResult.state.V} G=${evalResult.state.G} Vc=${evalResult.state.Vc} Vp=${evalResult.state.Vp}\n`,
    );
    process.stdout.write(`Prochain: ${state.nextPredicate || 'H6'} → step ${state.nextStep || 'done'}\n`);

    if (!state.nextStep) {
      const fallback = resolveChainNextAction(opts.id, opts.domain);
      if (fallback.complete || !fallback.command) {
        process.stdout.write('✓ Chaîne complète pour ce domaine\n');
        return;
      }
      process.stdout.write(`Prochain (gate ${fallback.nextPredicate}): ${fallback.command}\n`);
      if (opts.dryRun) return;
      const runRes = spawnSync(fallback.command, { cwd: ROOT, shell: true, stdio: 'inherit', encoding: 'utf8' });
      if (runRes.status !== 0) process.exit(runRes.status || 1);
      stepsRun += 1;
      process.stdout.write(`✓ gate ${fallback.nextPredicate} terminé (${stepsRun})\n`);
      if (!opts.auto) break;
      continue;
    }
    if (opts.dryRun) {
      process.stdout.write(`(dry-run) ${state.nextStep}\n`);
      return;
    }

    const step = contract.steps.find((s) => s.id === state.nextStep);
    if (!step) throw new Error(`Step inconnu: ${state.nextStep}`);
    const res = runStep(step, opts.id);
    if (res.status !== 0) process.exit(res.status || 1);
    stepsRun += 1;
    process.stdout.write(`✓ étape ${state.nextStep} terminée (${stepsRun})\n`);
    if (!opts.auto) break;
  }

  if (opts.auto && stepsRun >= opts.maxSteps) {
    process.stderr.write(`⚠ max-steps (${opts.maxSteps}) atteint\n`);
  }
};

main();
