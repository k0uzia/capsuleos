#!/usr/bin/env node
/**
 * Orchestrateur cycles clone VM → CapsuleOS (R-AUTO campagne).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-clone-cycle.mjs --id linux-mint --dry-run
 *   node usr/lib/capsuleos/tools/lab/run-clone-cycle.mjs --id linux-mint --run-next
 *   node usr/lib/capsuleos/tools/lab/run-clone-cycle.mjs --id linux-mint --auto --max-cycles 3
 *   node usr/lib/capsuleos/tools/lab/run-clone-cycle.mjs --id linux-mint --status
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  loadCycleContract,
  evaluateCycleStatus,
  cycleFromPallier,
  expandGateArgs,
  gateNeedsHttp,
  writeReplicationState,
} from './clone-cycle-lib.mjs';
import { loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-mint',
    dryRun: false,
    runNext: false,
    auto: false,
    status: false,
    maxCycles: 1,
    httpBase: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501',
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--run-next') opts.runNext = true;
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--status') opts.status = true;
    else if (args[i] === '--max-cycles' && args[i + 1]) opts.maxCycles = Number(args[++i]);
    else if (args[i] === '--http' && args[i + 1]) opts.httpBase = args[++i];
  }
  if (opts.auto) opts.runNext = true;
  return opts;
};

const toolkitOf = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const t = entry.toolkit;
  if (t && typeof t === 'object' && t.id) return t.id;
  if (typeof t === 'string') return t;
  return 'cinnamon';
};

const runGate = (gate, registryId, httpBase) => {
  let scriptRel = gate.script;
  let argv = expandGateArgs(gate, registryId);
  const env = { ...process.env };
  const tk = toolkitOf(registryId);
  if (gateNeedsHttp(gate)) {
    env.CAPSULE_HTTP_BASE = gate.env && gate.env.CAPSULE_HTTP_BASE
      ? gate.env.CAPSULE_HTTP_BASE
      : httpBase;
  }
  if (gate.toolkit === 'cinnamon' && registryId !== 'linux-mint') {
    process.stdout.write(`(skip) ${gate.script} — toolkit cinnamon / id ${registryId}\n`);
    return true;
  }
  if (tk === 'gnome' && scriptRel.includes('run-app-parity-pass.mjs')) {
    scriptRel = 'usr/lib/capsuleos/tools/lab/smoke-apps-interactions.mjs';
    argv = ['--id', registryId];
  }
  if (tk === 'gnome' && scriptRel.includes('run-ui-state-effects-pass.mjs')) {
    const shellArgIdx = argv.indexOf('--shell');
    if (shellArgIdx >= 0 && argv[shellArgIdx + 1] && argv[shellArgIdx + 1].indexOf('mainMenu') >= 0) {
      process.stdout.write(`(skip) ${gate.script} — mainMenu cinnamon / ${registryId}\n`);
      return true;
    }
  }
  const scriptPath = path.join(ROOT, scriptRel);
  process.stdout.write(`\n── ${gate.label || scriptRel} ──\n`);
  const r = spawnSync(process.execPath, [scriptPath, ...argv], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  return r.status === 0;
};

const runClosure = (cycle, registryId) => {
  let ok = true;
  (cycle.closure || []).forEach((step) => {
    if (step === 'commit-push') {
      process.stdout.write('(closure) commit-push — manuel agent / convention campagne\n');
      return;
    }
    let script = null;
    if (step === 'sync-linux-skin-closure') {
      script = 'usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs';
    } else if (step === 'sync-all-views') {
      script = 'usr/lib/capsuleos/tools/sync-all-views.mjs';
    }
    if (!script) return;
    process.stdout.write(`\n── closure ${step} ──\n`);
    const r = spawnSync(process.execPath, [path.join(ROOT, script)], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (r.status !== 0) ok = false;
  });
  return ok;
};

const printStatus = (status) => {
  process.stdout.write(`\n=== clone-cycle ${status.registryId} ===\n`);
  process.stdout.write(`Pallier: ${status.pallier} → prochain ${status.nextPallier}\n`);
  process.stdout.write(`Cycle actuel: ${status.currentCycle || '—'} · prochain: ${status.nextCycle || '—'}\n`);
  process.stdout.write(`Cycles restants (est.): ${status.cyclesRemaining} / ${status.cyclesTotal}\n`);
  process.stdout.write(`Π_global: ${status.pi.pi_global !== null ? status.pi.pi_global : '—'} / cible ${status.pi.target}\n`);
  if (status.cycleCountToPi100) {
    process.stdout.write(`Modèle: ${status.cycleCountToPi100.minimum}–${status.cycleCountToPi100.typical} cycles pour Π=100\n`);
  }
  if (status.complete) {
    process.stdout.write('✓ Clone clôturé (Π=100, nonConformites vides)\n');
  }
};

const main = () => {
  const opts = parseArgs();
  const contract = loadCycleContract();
  const status = evaluateCycleStatus(opts.id);

  printStatus(status);

  if (opts.status && !opts.runNext) {
    return;
  }

  const targetPallier = status.nextPallier;
  const cycle = cycleFromPallier(contract, targetPallier);
  if (!cycle) {
    process.stdout.write('Aucun cycle restant — vérifier Π_global et nonConformites\n');
    return;
  }

  process.stdout.write(`\n→ Exécution cycle ${cycle.id} (pallier ${cycle.pallier}) : ${cycle.label}\n`);

  if (opts.dryRun) {
    (cycle.gates || []).forEach((g) => {
      process.stdout.write(`  gate: ${g.script} ${expandGateArgs(g, opts.id).join(' ')}\n`);
    });
    (cycle.closure || []).forEach((c) => {
      process.stdout.write(`  closure: ${c}\n`);
    });
    return;
  }

  if (!opts.runNext) {
    process.stdout.write('Ajouter --run-next ou --auto pour exécuter les gates\n');
    return;
  }

  let cyclesRun = 0;
  let currentCycle = cycle;

  while (currentCycle && cyclesRun < opts.maxCycles) {
    let failed = false;
    for (const gate of currentCycle.gates || []) {
      const pass = runGate(gate, opts.id, opts.httpBase);
      if (!pass && !gate.optional) {
        failed = true;
        break;
      }
      if (!pass && gate.optional) {
        process.stdout.write(`(optional skip) ${gate.script}\n`);
      }
    }
    if (failed) {
      process.exit(1);
    }
    runClosure(currentCycle, opts.id);
    writeReplicationState(opts.id, {
      pallier: currentCycle.pallier,
      nextPallier: currentCycle.pallier + 1,
      lastCycle: currentCycle.id,
      lastCycleAt: new Date().toISOString(),
    });
    process.stdout.write(`✓ cycle ${currentCycle.id} gates OK\n`);
    cyclesRun += 1;
    if (!opts.auto) break;
    const next = cycleFromPallier(contract, currentCycle.pallier + 1);
    if (!next) break;
    currentCycle = next;
  }

  const after = evaluateCycleStatus(opts.id);
  printStatus(after);
};

main();
