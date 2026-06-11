#!/usr/bin/env node
/**
 * Orchestrateur chaîne magasin GNOME Software — steps filtrés par campaignPhases.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-store-replication-chain.mjs --id linux-fedora
 *   node usr/lib/capsuleos/tools/lab/run-store-replication-chain.mjs --id linux-fedora --auto
 *   node usr/lib/capsuleos/tools/lab/run-store-replication-chain.mjs --id linux-fedora --dry-run
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import {
  evaluateStorePredicates,
  resolveStoreNextAction,
  storeAppliesToRegistry,
  writeStoreReplicationState,
} from './store-replication-lib.mjs';
import { loadCampaignPhases } from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-fedora', dryRun: false, auto: false, maxSteps: 8 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
  }
  return opts;
};

const runShell = (command) => {
  const res = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8',
    env: { ...process.env },
  });
  return res.status ?? 1;
};

const main = () => {
  const opts = parseArgs();
  if (!storeAppliesToRegistry(opts.id)) {
    process.stdout.write(`=== store-replication-chain ${opts.id} — N/A (toolkit sans storeCampaign) ===\n`);
    process.exit(0);
  }

  const phases = loadCampaignPhases(opts.id);
  process.stdout.write(
    `=== store-replication-chain ${opts.id}${opts.auto ? ' [auto]' : ''} — phases: ${phases.join(', ')} ===\n`,
  );
  process.stdout.write(
    '  (préalable recommandé : resolve-slot-gap-delta.mjs --id '
    + `${opts.id} --write)\n`,
  );

  let stepsRun = 0;
  while (stepsRun < opts.maxSteps) {
    const evalResult = evaluateStorePredicates(opts.id);
    writeStoreReplicationState(evalResult);
    const action = resolveStoreNextAction(opts.id);

    process.stdout.write(
      `predicates: StoreG=${evalResult.state.StoreG} StoreΣ=${evalResult.state.StoreΣ} `
      + `StoreVc=${evalResult.state.StoreVc} StoreVp=${evalResult.state.StoreVp}\n`,
    );

    if (action.complete) {
      process.stdout.write('=== store chain complete ===\n');
      process.exit(0);
    }

    process.stdout.write(`${action.rule}: ${action.message}\n`);
    if (action.command) process.stdout.write(`→ ${action.command}\n`);

    if (opts.dryRun) process.exit(0);

    if (!action.command) {
      process.stderr.write('Aucune commande — arrêt\n');
      process.exit(1);
    }

    if (!opts.auto && stepsRun === 0) process.exit(0);

    const before = JSON.stringify(evalResult.state);
    const code = runShell(action.command);
    if (code !== 0) process.exit(code);
    const afterState = evaluateStorePredicates(opts.id).state;
    if (JSON.stringify(afterState) === before) {
      process.stderr.write(
        '=== store chain bloquée — prédicat inchangé après étape '
        + `(StoreVp=${afterState.StoreVp} requiert visualMatch ok) ===\n`,
      );
      process.exit(0);
    }
    stepsRun += 1;
  }

  process.stderr.write(`max-steps (${opts.maxSteps}) atteint\n`);
  process.exit(1);
};

main();
