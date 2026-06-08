#!/usr/bin/env node
/**
 * Orchestrateur campagne crédibilité pédagogique — scénarios VM → clone.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase status
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase next
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase list
 *   node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase run --app nemo --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--phase' && args[i + 1]) opts.phase = args[++i];
    else if (args[i] === '--app' && args[i + 1]) opts.app = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const inventoryPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);

const replicationStatePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`);

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

const nextApp = (inventory) => {
  const queue = inventory.appQueue || [];
  const apps = inventory.apps || [];
  for (let i = 0; i < queue.length; i += 1) {
    const appId = queue[i];
    const appMeta = apps.find((a) => a.id === appId);
    if (!appMeta || appMeta.pi_credibility === null || appMeta.pi_credibility < 100) {
      return appId;
    }
  }
  return queue.length > 0 ? queue[0] : null;
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

const printStatus = (registryId, inventory, contract) => {
  const summary = inventory.summary || computeSummary(inventory);
  const next = nextScenario(inventory, null);
  const nextAppId = nextApp(inventory);

  process.stdout.write(`\n=== app-fidelity-campaign ${registryId} ===\n`);
  process.stdout.write(`Campagne: ${inventory.campaign || contract.campaignId}\n`);
  process.stdout.write(`Apps: ${summary.appsTotal} · scénarios: ${summary.totalScenarios}\n`);
  process.stdout.write(
    `CredV ${summary.documented}/${summary.totalScenarios} (${summary.documentedPct}%) · ` +
      `CredC ${summary.implemented}/${summary.totalScenarios} (${summary.implementedPct}%) · ` +
      `CredS ${summary.smokeOk}/${summary.totalScenarios} (${summary.smokePct}%)\n`,
  );
  process.stdout.write(`Apps π=100: ${summary.appsAtPi100}/${summary.appsTotal}\n`);
  if (nextAppId) {
    process.stdout.write(`Prochaine app file: ${nextAppId}\n`);
  }
  if (next) {
    process.stdout.write(
      `Prochain scénario: ${next.scenario.id} (${next.scenario.app}) — ${next.reason} [${next.phase}]\n`,
    );
  } else {
    process.stdout.write('✓ Tous les scénarios documentés ont CredS et π mesuré — extension P-F\n');
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

const main = () => {
  const opts = parseArgs();
  const contract = loadJson(CONTRACT_PATH);
  let inventory = loadInventory(opts.id);
  inventory = refreshSummary(inventory);

  if (opts.phase === 'list') {
    printList(inventory);
    saveInventory(opts.id, inventory);
    return;
  }

  if (opts.phase === 'status') {
    printStatus(opts.id, inventory, contract);
    saveInventory(opts.id, inventory);
    return;
  }

  if (opts.phase === 'next') {
    const appFilter = opts.app || nextApp(inventory);
    const next = nextScenario(inventory, appFilter);
    printStatus(opts.id, inventory, contract);
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

  if (opts.phase === 'run') {
    const appFilter = opts.app || nextApp(inventory);
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

  process.stderr.write(`Phase inconnue: ${opts.phase} (list|status|next|run)\n`);
  process.exit(1);
};

main();
