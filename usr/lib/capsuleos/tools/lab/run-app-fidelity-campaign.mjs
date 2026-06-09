#!/usr/bin/env node
/**
 * Orchestrateur campagne crédibilité pédagogique — scénarios VM → clone.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase status
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase next
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase list
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase map-gaps
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase run --app nemo --dry-run
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase formal
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase formal-write
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase resolve --max-steps 8
 */
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  evaluateCredPredicates,
  evaluateCredRules,
  writeCredFormalStatus,
  recordCredGate,
  ROOT as CRED_ROOT,
} from './app-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/app-fidelity-scenarios.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-mint',
    phase: 'status',
    app: null,
    dryRun: false,
    maxSteps: 8,
    json: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--phase' && args[i + 1]) opts.phase = args[++i];
    else if (args[i] === '--app' && args[i + 1]) opts.app = args[++i];
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const inventoryPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);

const gapsPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-gaps.json`);

const replicationStatePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`);

const loadGaps = (registryId) => {
  const p = gapsPath(registryId);
  if (!fs.existsSync(p)) {
    return null;
  }
  return loadJson(p);
};

const loadInventory = (registryId) => {
  const p = inventoryPath(registryId);
  if (!fs.existsSync(p)) {
    throw new Error(`Inventaire manquant: ${p}`);
  }
  return loadJson(p);
};

const saveInventory = (registryId, data) => {
  const p = inventoryPath(registryId);
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const scenarioPred = (scenario, key) => {
  const preds = scenario.predicates || {};
  return preds[key] === true;
};

const computeSummary = (inventory) => {
  const scenarios = inventory.scenarios || [];
  let documented = 0;
  let implemented = 0;
  let smokeOk = 0;
  let measured = 0;
  let piSum = 0;
  let piCount = 0;

  scenarios.forEach((s) => {
    if (scenarioPred(s, 'CredV') || (s.steps && s.steps.length > 0)) documented += 1;
    if (scenarioPred(s, 'CredC')) implemented += 1;
    if (scenarioPred(s, 'CredS')) smokeOk += 1;
    if (s.pi_credibility !== null && s.pi_credibility !== undefined) {
      measured += 1;
      piSum += s.pi_credibility;
      piCount += 1;
    }
  });

  const apps = inventory.apps || [];
  let appsAtPi100 = 0;
  apps.forEach((a) => {
    if (a.pi_credibility === 100) appsAtPi100 += 1;
  });

  return {
    totalScenarios: scenarios.length,
    documented,
    implemented,
    smokeOk,
    measured,
    avgPi: piCount > 0 ? Math.round(piSum / piCount) : null,
    appsTotal: apps.length,
    appsAtPi100,
    documentedPct: scenarios.length > 0 ? Math.round((documented / scenarios.length) * 100) : 0,
    implementedPct: scenarios.length > 0 ? Math.round((implemented / scenarios.length) * 100) : 0,
    smokePct: scenarios.length > 0 ? Math.round((smokeOk / scenarios.length) * 100) : 0,
  };
};

const refreshSummary = (inventory) => {
  inventory.summary = computeSummary(inventory);
  return inventory;
};

const nextScenario = (inventory, appFilter) => {
  const scenarios = inventory.scenarios || [];
  const queue = inventory.appQueue || [];

  const ordered = [];
  queue.forEach((appId) => {
    scenarios
      .filter((s) => s.app === appId && (!appFilter || s.app === appFilter))
      .forEach((s) => ordered.push(s));
  });
  if (appFilter) {
    scenarios
      .filter((s) => s.app === appFilter && ordered.indexOf(s) < 0)
      .forEach((s) => ordered.push(s));
  } else {
    scenarios.forEach((s) => {
      if (ordered.indexOf(s) < 0) ordered.push(s);
    });
  }

  for (let i = 0; i < ordered.length; i += 1) {
    const s = ordered[i];
    if (!scenarioPred(s, 'CredV') && (!s.steps || s.steps.length === 0)) {
      return { scenario: s, reason: 'CredV — documenter steps VM', phase: 'P-A' };
    }
    if (!scenarioPred(s, 'CredC')) {
      return { scenario: s, reason: 'CredC — implémenter interactions clone', phase: 'P-C' };
    }
    if (!scenarioPred(s, 'CredS')) {
      return { scenario: s, reason: 'CredS — exécuter smoke scénario', phase: 'P-D' };
    }
    if (s.pi_credibility === null || s.pi_credibility === undefined || s.pi_credibility < 100) {
      return { scenario: s, reason: 'CredΠ — mesurer parité classée', phase: 'P-E' };
    }
  }
  return null;
};

const nextApp = (inventory, gaps) => {
  const queue = inventory.appQueue || [];
  const apps = inventory.apps || [];
  for (let i = 0; i < queue.length; i += 1) {
    const appId = queue[i];
    const appMeta = apps.find((a) => a.id === appId);
    if (!appMeta || appMeta.pi_credibility === null || appMeta.pi_credibility < 100) {
      return appId;
    }
  }
  if (gaps && gaps.waveQueue) {
    const wave1 = gaps.waveQueue.wave1P0P1 || [];
    for (let i = 0; i < wave1.length; i += 1) {
      const slot = wave1[i];
      const appMeta = apps.find((a) => a.id === slot);
      if (!appMeta || appMeta.pi_credibility === null || appMeta.pi_credibility < 100) {
        return slot;
      }
    }
    const wave2 = gaps.waveQueue.wave2P2 || [];
    for (let j = 0; j < wave2.length; j += 1) {
      const slot2 = wave2[j];
      const appMeta2 = apps.find((a) => a.id === slot2);
      if (!appMeta2 || appMeta2.pi_credibility === null || appMeta2.pi_credibility < 100) {
        return slot2;
      }
    }
  }
  return null;
};

const buildRunCommands = (contract, registryId, scenario, app) => {
  const cmds = [];
  const steps = contract.steps || [];
  const slot = app || (scenario ? scenario.app : null);

  steps.forEach((step) => {
    const argv = [];
    (step.args || []).forEach((a) => {
      if (a === '--id') argv.push('--id', registryId);
      else if (a === '--app' && slot) argv.push('--app', slot);
      else if (a === '--scenario' && scenario) argv.push('--scenario', scenario.id);
      else argv.push(a);
    });
    cmds.push({
      step: step.id,
      command: `node ${step.script} ${argv.join(' ')}`,
    });
  });

  cmds.push({
    step: 'validate-all',
    command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
  });

  return cmds;
};

const printStatus = (registryId, inventory, contract, gaps) => {
  const summary = inventory.summary || computeSummary(inventory);
  const next = nextScenario(inventory, null);
  const nextAppId = nextApp(inventory, gaps);

  process.stdout.write(`\n=== app-fidelity-campaign ${registryId} ===\n`);
  process.stdout.write(`Campagne: ${inventory.campaign || contract.campaignId}\n`);
  process.stdout.write(`Apps: ${summary.appsTotal} · scénarios: ${summary.totalScenarios}\n`);
  process.stdout.write(
    `CredV ${summary.documented}/${summary.totalScenarios} (${summary.documentedPct}%) · ` +
      `CredC ${summary.implemented}/${summary.totalScenarios} (${summary.implementedPct}%) · ` +
      `CredS ${summary.smokeOk}/${summary.totalScenarios} (${summary.smokePct}%)\n`,
  );
  process.stdout.write(`Apps π=100: ${summary.appsAtPi100}/${summary.appsTotal}\n`);
  if (gaps && gaps.summary) {
    const gs = gaps.summary;
    process.stdout.write(
      `P-F gaps: ${gs.gapSlotsTotal} slots · vague1 P0+P1: ${gs.gapSlotsP0 + gs.gapSlotsP1} · ` +
        `scénarios à ajouter: ${gs.scenariosToAdd}\n`,
    );
  }
  if (nextAppId) {
    process.stdout.write(`Prochaine app file: ${nextAppId}\n`);
  }
  if (next) {
    process.stdout.write(
      `Prochain scénario: ${next.scenario.id} (${next.scenario.app}) — ${next.reason} [${next.phase}]\n`,
    );
  } else if (gaps && gaps.summary && gaps.summary.gapSlotsTotal > 0) {
    const wave1 = gaps.waveQueue && gaps.waveQueue.wave1P0P1 ? gaps.waveQueue.wave1P0P1.length : 0;
    if (wave1 > 0) {
      process.stdout.write('→ P-F3 vague 1 : documenter CredV pour le prochain slot P0/P1\n');
    } else {
      process.stdout.write('→ P-F3 vague 2 : documenter CredV pour le prochain slot P2\n');
    }
  } else {
    process.stdout.write('✓ Campagne crédibilité clôturée sur le périmètre cartographié\n');
  }
};

const printList = (inventory) => {
  const apps = inventory.apps || [];
  process.stdout.write(`\n=== apps (${apps.length}) ===\n`);
  apps.forEach((a) => {
    const pi = a.pi_credibility !== null && a.pi_credibility !== undefined ? a.pi_credibility : '—';
    const count = (inventory.scenarios || []).filter((s) => s.app === a.id).length;
    process.stdout.write(`  ${a.id}: ${count} scénarios · π_credibility=${pi}\n`);
  });
  process.stdout.write(`\n=== scénarios (${(inventory.scenarios || []).length}) ===\n`);
  (inventory.scenarios || []).forEach((s) => {
    const v = scenarioPred(s, 'CredV') ? 'V' : '·';
    const c = scenarioPred(s, 'CredC') ? 'C' : '·';
    const sm = scenarioPred(s, 'CredS') ? 'S' : '·';
    const pi = s.pi_credibility !== null && s.pi_credibility !== undefined ? s.pi_credibility : '—';
    process.stdout.write(`  ${s.id} [${v}${c}${sm}] π=${pi} — ${s.persona}\n`);
  });
};

const runMapGaps = (registryId) => {
  const mapScript = registryId === 'linux-kde-neon'
    ? 'map-kde-fidelity-gaps.mjs'
    : 'map-app-fidelity-gaps.mjs';
  const script = path.join(ROOT, 'usr/lib/capsuleos/tools/lab', mapScript);
  execSync(`node "${script}" --id ${registryId} --write`, { stdio: 'inherit', cwd: ROOT });
};

const printFormal = (registryId, asJson) => {
  const evalResult = evaluateCredPredicates(registryId);
  const out = {
    registryId,
    phase: 'formal',
    predicates: evalResult.state,
    nextPredicate: evalResult.nextPredicate,
    summary: evalResult.summary,
    gaps: evalResult.gaps?.summary || null,
  };
  if (asJson) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }
  const s = evalResult.state;
  process.stdout.write(`\n=== Cred* formel ${registryId} ===\n`);
  process.stdout.write(`CredV=${s.CredV} CredC=${s.CredC} CredS=${s.CredS} CredΠ=${s.CredPi} CredΣ=${s.CredSigma}\n`);
  process.stdout.write(
    `Scénarios: ${evalResult.summary.documented}/${evalResult.summary.totalScenarios} doc · `
      + `${evalResult.summary.implemented} impl · ${evalResult.summary.smokeOk} smoke\n`,
  );
  process.stdout.write(`Apps π=100: ${evalResult.summary.appsAtPi100}/${evalResult.summary.appsTotal}\n`);
  if (evalResult.gaps?.summary) {
    process.stdout.write(`Gap slots: ${evalResult.gaps.summary.gapSlotsTotal}\n`);
  }
  if (evalResult.nextPredicate) {
    process.stdout.write(`Prochain prédicat: ${evalResult.nextPredicate}\n`);
  } else {
    process.stdout.write('✓ Chaîne Cred* satisfaite sur inventaire\n');
  }
};

const runFormalWrite = (registryId) => {
  const result = writeCredFormalStatus(registryId);
  const s = result.evalResult.state;
  process.stdout.write(`\n✓ État formel Cred* écrit — CredΣ=${s.CredSigma}\n`);
  process.stdout.write(`  ${registryId}-credibility-formal-state.json\n`);
  process.stdout.write(`  replication-state.credibilityCampaign.credSigma=${s.CredSigma}\n`);
};

const runResolve = (registryId, maxSteps, dryRun) => {
  for (let step = 0; step < maxSteps; step += 1) {
    const decision = evaluateCredRules(registryId);
    const statePath = path.join(CRED_ROOT, 'root/docs/inventaires', `${registryId}-credibility-formal-resolve.json`);
    fs.writeFileSync(statePath, `${JSON.stringify({ ...decision, generatedAt: new Date().toISOString() }, null, 2)}\n`);

    const preds = decision.predicates || {};
    process.stdout.write(
      `[${step + 1}] ${decision.rule} auto=${decision.autoExecute} `
        + `CredΣ=${preds.CredSigma} — ${decision.message}\n`,
    );

    if (!decision.autoExecute || !decision.command) {
      process.stdout.write(`✓ Résolution Cred* arrêtée — ${decision.rule}\n`);
      return;
    }

    if (dryRun) {
      process.stdout.write(`(dry-run) ${decision.command}\n`);
      return;
    }

    process.stdout.write(`\n── ${decision.command} ──\n`);
    const status = spawnSync(decision.command, {
      cwd: CRED_ROOT,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
      },
    }).status ?? 1;

    if (status !== 0) {
      process.stderr.write(`✗ Échec ${decision.rule} (exit ${status})\n`);
      process.exit(status);
    }

    if (decision.gateOnSuccess === 'H2') {
      recordCredGate(registryId, 'H2', true, { rule: decision.rule });
    } else if (decision.gateOnSuccess) {
      recordCredGate(registryId, decision.gateOnSuccess, true, { rule: decision.rule });
    }
  }
  process.stderr.write(`⚠ max-steps (${maxSteps}) atteint\n`);
};

const main = () => {
  const opts = parseArgs();
  const contract = loadJson(CONTRACT_PATH);
  let inventory = loadInventory(opts.id);
  inventory = refreshSummary(inventory);
  let gaps = loadGaps(opts.id);

  if (opts.phase === 'map-gaps') {
    runMapGaps(opts.id);
    gaps = loadGaps(opts.id);
    if (gaps) {
      const gs = gaps.summary;
      process.stdout.write(
        `\n✓ Cartographie P-F1 — ${gs.gapSlotsTotal} slots gap · ` +
          `${gs.scenariosToAdd} scénarios à produire\n`,
      );
    }
    return;
  }

  if (opts.phase === 'list') {
    printList(inventory);
    saveInventory(opts.id, inventory);
    return;
  }

  if (opts.phase === 'status') {
    printStatus(opts.id, inventory, contract, gaps);
    saveInventory(opts.id, inventory);
    return;
  }

  if (opts.phase === 'next') {
    const appFilter = opts.app || nextApp(inventory, gaps);
    const next = nextScenario(inventory, appFilter);
    printStatus(opts.id, inventory, contract, gaps);
    if (next) {
      process.stdout.write(`\n→ Action: ${next.reason}\n`);
      process.stdout.write(`  App: ${next.scenario.app}\n`);
      process.stdout.write(`  Scénario: ${next.scenario.id}\n`);
      process.stdout.write(`  Phase: ${next.phase}\n`);
      if (next.scenario.steps && next.scenario.steps.length > 0) {
        process.stdout.write('  Steps:\n');
        next.scenario.steps.forEach((st, idx) => {
          process.stdout.write(`    ${idx + 1}. ${st}\n`);
        });
      }
    }
    saveInventory(opts.id, inventory);
    return;
  }

  if (opts.phase === 'formal') {
    printFormal(opts.id, opts.json);
    return;
  }

  if (opts.phase === 'formal-write') {
    runFormalWrite(opts.id);
    return;
  }

  if (opts.phase === 'resolve') {
    runResolve(opts.id, opts.maxSteps, opts.dryRun);
    return;
  }

  if (opts.phase === 'run') {
    const appFilter = opts.app || nextApp(inventory, gaps);
    const next = nextScenario(inventory, appFilter);
    if (!next) {
      process.stdout.write('Aucun scénario en attente — campagne P-F ou extension file\n');
      saveInventory(opts.id, inventory);
      return;
    }
    const cmds = buildRunCommands(contract, opts.id, next.scenario, appFilter);
    process.stdout.write(`\n→ Run ${next.scenario.id} (${next.phase})\n`);
    cmds.forEach((c) => {
      process.stdout.write(`  [${c.step}] ${c.command}\n`);
    });
    if (opts.dryRun) {
      process.stdout.write('(dry-run — commandes non exécutées)\n');
    } else {
      process.stdout.write('Exécution manuelle ou via agent — utiliser --dry-run pour planifier\n');
    }
    saveInventory(opts.id, inventory);
    return;
  }

  process.stderr.write(`Phase inconnue: ${opts.phase} (list|status|next|run|map-gaps|formal|formal-write|resolve)\n`);
  process.exit(1);
};

main();
