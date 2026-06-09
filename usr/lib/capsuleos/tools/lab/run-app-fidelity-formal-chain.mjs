#!/usr/bin/env node
/**
 * Orchestrateur chaîne formelle Cred* — évalue R-CRED* et enchaîne tant qu'autoExecute.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-formal-chain.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-formal-chain.mjs --id linux-mint --max-steps 8
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  evaluateCredRules,
  recordCredGate,
  loadCredFormalState,
} from './app-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', maxSteps: 8, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const runCommand = (command) => {
  process.stdout.write(`\n── ${command} ──\n`);
  return spawnSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
    },
  }).status ?? 1;
};

const main = () => {
  const opts = parseArgs();
  process.stdout.write(`=== run-app-fidelity-formal-chain ${opts.id} (max ${opts.maxSteps}) ===\n`);

  for (let step = 0; step < opts.maxSteps; step += 1) {
    const decision = evaluateCredRules(opts.id);
    const statePath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-credibility-formal-resolve.json`);
    fs.writeFileSync(statePath, `${JSON.stringify({ ...decision, generatedAt: new Date().toISOString() }, null, 2)}\n`);

    const gates = loadCredFormalState(opts.id).gates;
    const preds = decision.predicates || {};
    process.stdout.write(
      `[${step + 1}] ${decision.rule} auto=${decision.autoExecute} `
      + `CredV=${preds.CredV} CredC=${preds.CredC} CredS=${preds.CredS} CredΠ=${preds.CredPi} H2=${gates.H2} — ${decision.message}\n`,
    );

    if (!decision.autoExecute || !decision.command) {
      process.stdout.write(`✓ Chaîne Cred* arrêtée — ${decision.rule}\n`);
      return;
    }

    if (opts.dryRun) {
      process.stdout.write(`(dry-run) ${decision.command}\n`);
      return;
    }

    const status = runCommand(decision.command);
    if (status !== 0) {
      process.stderr.write(`✗ Échec ${decision.rule} (exit ${status})\n`);
      process.exit(status);
    }

    if (decision.gateOnSuccess === 'H2') {
      recordCredGate(opts.id, 'H2', true, { rule: decision.rule });
    } else if (decision.gateOnSuccess) {
      recordCredGate(opts.id, decision.gateOnSuccess, true, { rule: decision.rule });
    }
  }

  process.stderr.write(`⚠ max-steps (${opts.maxSteps}) atteint\n`);
};

main();
