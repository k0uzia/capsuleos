#!/usr/bin/env node
/**
 * P-F1 KDE Cred* — cartographie kickoff VM → slots scénarios Cred*.
 *
 *   node usr/lib/capsuleos/tools/lab/map-kde-fidelity-gaps.mjs --id linux-kde-neon --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const SCENARIOS_TARGET = 3;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon', json: false, write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const buildGapMap = (registryId) => {
  const kickoffPath = path.join(ROOT, 'root/docs/inventaires', 'linux-kde-neon-kickoff-apps.json');
  const fidelityPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);
  const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/kde-fidelity-scenarios.json');

  if (!fs.existsSync(fidelityPath)) {
    throw new Error(`Inventaire Cred* manquant: ${fidelityPath}`);
  }

  const kickoff = fs.existsSync(kickoffPath) ? loadJson(kickoffPath) : { favorites: [], categories: {} };
  const fidelity = loadJson(fidelityPath);
  const contract = fs.existsSync(contractPath) ? loadJson(contractPath) : { scopedApps: [] };

  const scenariosByApp = {};
  (fidelity.scenarios || []).forEach((s) => {
    if (!scenariosByApp[s.app]) scenariosByApp[s.app] = [];
    scenariosByApp[s.app].push(s);
  });

  const appsById = {};
  (fidelity.apps || []).forEach((a) => {
    appsById[a.id] = a;
  });

  const scopedApps = contract.scopedApps || fidelity.appQueue || [];
  const gapSlots = [];
  const coveredSlots = [];

  scopedApps.forEach((slot) => {
    const count = (scenariosByApp[slot] || []).length;
    const pi = appsById[slot]?.pi_credibility;
    const entry = {
      slot,
      label: appsById[slot]?.label || slot,
      scenarioCount: count,
      target: SCENARIOS_TARGET,
      pi_credibility: pi ?? null,
      tier: ['panel', 'kickoff', 'tray', 'nemo', 'firefox', 'terminal', 'update_manager'].includes(slot)
        ? 'P0'
        : 'P1',
    };
    if (count < SCENARIOS_TARGET || pi !== 100) {
      gapSlots.push(entry);
    } else {
      coveredSlots.push(entry);
    }
  });

  let kickoffAppCount = (kickoff.favorites || []).length;
  Object.values(kickoff.categories || {}).forEach((arr) => {
    kickoffAppCount += arr.length;
  });

  const scenariosToAdd = gapSlots.reduce(
    (sum, g) => sum + Math.max(0, SCENARIOS_TARGET - g.scenarioCount),
    0,
  );

  return {
    registryId,
    campaign: fidelity.campaign || 'v5-credibility-pass',
    generatedAt: new Date().toISOString(),
    sources: {
      kickoff: 'root/docs/inventaires/linux-kde-neon-kickoff-apps.json',
      fidelity: `root/docs/inventaires/${registryId}-app-fidelity-scenarios.json`,
      contract: 'etc/capsuleos/contracts/kde-fidelity-scenarios.json',
    },
    summary: {
      kickoffAppsVm: kickoffAppCount,
      scopedSlots: scopedApps.length,
      gapSlotsTotal: gapSlots.length,
      coveredSlots: coveredSlots.length,
      scenariosToAdd,
      scenariosTotal: (fidelity.scenarios || []).length,
    },
    waveQueue: {
      wave1P0: ['panel', 'kickoff', 'tray', 'nemo', 'firefox', 'terminal', 'update_manager', 'kdeconnect'],
      wave2P1: ['spectacle', 'kinfocenter', 'system_monitor'],
    },
    gapSlots,
    coveredSlots,
    notes: [
      'Périmètre Cred* KDE = 11 surfaces/slots (pas 30 apps kickoff linéaires)',
      'Kickoff apps sans slot dédié = tier C (ouverture stub via dataLink — hors CredΠ)',
    ],
  };
};

const main = () => {
  const opts = parseArgs();
  const map = buildGapMap(opts.id);

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(map, null, 2)}\n`);
    return;
  }

  process.stdout.write(`\n=== map-kde-fidelity-gaps ${map.registryId} ===\n`);
  process.stdout.write(
    `Kickoff VM: ${map.summary.kickoffAppsVm} apps · scoped: ${map.summary.scopedSlots} · ` +
      `gaps: ${map.summary.gapSlotsTotal} · couverts: ${map.summary.coveredSlots}\n`,
  );
  map.gapSlots.forEach((g) => {
    process.stdout.write(`  gap ${g.slot}: ${g.scenarioCount}/${g.target} scénarios · π=${g.pi_credibility ?? '—'}\n`);
  });

  if (opts.write) {
    const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-app-fidelity-gaps.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
    process.stdout.write(`\n✓ Écrit ${outPath}\n`);
  } else {
    process.stdout.write('\nAstuce: --write pour persister *-app-fidelity-gaps.json\n');
  }
};

main();
