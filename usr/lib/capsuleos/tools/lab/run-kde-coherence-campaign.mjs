#!/usr/bin/env node
/**
 * Orchestrateur campagne G-coherence — linux-kde-neon.
 *
 *   node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --status
 *   node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --dry-run --run-next
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --run-next --write
 *   node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --record-commit abc123 --phase Gc0
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  loadCoherenceContract,
  evaluateCoherenceStatus,
  phaseFromPallier,
  expandGateArgs,
  gateNeedsHttp,
  recordPhaseClosed,
  recordCommit,
} from './kde-coherence-campaign-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-kde-neon',
    dryRun: false,
    runNext: false,
    auto: false,
    status: false,
    write: false,
    maxCycles: 1,
    httpBase: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765',
    recordCommit: null,
    phase: null,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--run-next') opts.runNext = true;
    else if (a === '--auto') opts.auto = true;
    else if (a === '--status') opts.status = true;
    else if (a === '--write') opts.write = true;
    else if (a === '--max-cycles' && args[i + 1]) opts.maxCycles = Number(args[++i]);
    else if (a === '--http' && args[i + 1]) opts.httpBase = args[++i];
    else if (a === '--record-commit' && args[i + 1]) opts.recordCommit = args[++i];
    else if (a === '--phase' && args[i + 1]) opts.phase = args[++i];
  }
  if (opts.auto) opts.runNext = true;
  return opts;
};

const runGate = (gate, registryId, httpBase) => {
  const scriptRel = gate.script;
  const argv = expandGateArgs(gate, registryId);
  const env = { ...process.env };
  if (gateNeedsHttp(gate)) {
    env.CAPSULE_HTTP_BASE = gate.env?.CAPSULE_HTTP_BASE || httpBase;
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

const runClosure = (phase) => {
  let ok = true;
  (phase.closure || []).forEach((step) => {
    if (step === 'commit-push') {
      process.stdout.write(`(closure) commit-push — ${phase.commitMessage}\n`);
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
  process.stdout.write(`\n=== G-coherence ${status.registryId} ===\n`);
  process.stdout.write(`Pallier: ${status.pallier} → prochain ${status.nextPallier}\n`);
  process.stdout.write(`Phase actuelle: ${status.currentPhase || '—'} · prochaine: ${status.nextPhase || '—'}\n`);
  process.stdout.write(`Statut campagne: ${status.campaignGCoherenceStatus}\n`);
  if (status.complete) {
    process.stdout.write('✓ Campagne G-coherence clôturée\n');
  }
};

const main = () => {
  const opts = parseArgs();

  if (opts.recordCommit && opts.phase) {
    recordCommit(opts.id, opts.phase, opts.recordCommit);
    process.stdout.write(`✓ ${opts.phase}Commit = ${opts.recordCommit}\n`);
    return;
  }

  const contract = loadCoherenceContract();
  const status = evaluateCoherenceStatus(opts.id);
  printStatus(status);

  if (opts.status && !opts.runNext) {
    return;
  }

  if (status.complete && opts.runNext) {
    process.stdout.write('Campagne déjà clôturée — rien à exécuter\n');
    return;
  }

  const targetPallier = status.nextPallier;
  let phase = phaseFromPallier(contract, targetPallier);
  if (!phase) {
    process.stdout.write('Aucune phase restante\n');
    return;
  }

  process.stdout.write(`\n→ Phase ${phase.id} (pallier ${phase.pallier}) : ${phase.label}\n`);

  if (opts.dryRun) {
    (phase.gates || []).forEach((g) => {
      process.stdout.write(`  gate: ${g.script} ${expandGateArgs(g, opts.id).join(' ')}\n`);
    });
    (phase.closure || []).forEach((c) => {
      process.stdout.write(`  closure: ${c}\n`);
    });
    process.stdout.write(`  commit: ${phase.commitMessage}\n`);
    return;
  }

  if (!opts.runNext) {
    process.stdout.write('Ajouter --run-next ou --auto pour exécuter les gates\n');
    return;
  }

  let cyclesRun = 0;
  let currentPhase = phase;

  while (currentPhase && cyclesRun < opts.maxCycles) {
    let failed = false;
    for (const gate of currentPhase.gates || []) {
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
    if (!runClosure(currentPhase)) {
      process.exit(1);
    }
    if (opts.write) {
      recordPhaseClosed(opts.id, currentPhase);
    }
    process.stdout.write(`✓ phase ${currentPhase.id} gates OK\n`);
    process.stdout.write(`→ Commit suggéré : ${currentPhase.commitMessage}\n`);
    cyclesRun += 1;
    if (!opts.auto) break;
    const next = phaseFromPallier(contract, currentPhase.pallier + 1);
    if (!next) break;
    currentPhase = next;
  }

  printStatus(evaluateCoherenceStatus(opts.id));
};

main();
