#!/usr/bin/env node
/**
 * P-F1 — Cartographie menu VM → slots catalogue → crédibilité existante.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/map-app-fidelity-gaps.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/map-app-fidelity-gaps.mjs --id linux-mint --json
 *   node usr/lib/capsuleos/tools/lab/map-app-fidelity-gaps.mjs --id linux-mint --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const PI100_APPS = new Set([
  'nemo',
  'firefox',
  'text_editor',
  'calculator',
  'file_roller',
  'update_manager',
  'mintinstall',
  'themes',
  'terminal',
  'pix',
  'sticky',
]);

const SCENARIOS_TARGET = 3;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', json: false, write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const prioriteRank = (p) => {
  if (p === 'P0') return 0;
  if (p === 'P1') return 1;
  return 2;
};

const buildGapMap = (registryId) => {
  const catalogPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-catalog.json`);
  const fidelityPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);

  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalogue manquant: ${catalogPath}`);
  }

  const catalog = loadJson(catalogPath);
  const fidelity = fs.existsSync(fidelityPath) ? loadJson(fidelityPath) : { apps: [], scenarios: [] };

  const appsById = {};
  (fidelity.apps || []).forEach((a) => {
    appsById[a.id] = a;
  });

  const scenariosByApp = {};
  (fidelity.scenarios || []).forEach((s) => {
    if (!scenariosByApp[s.app]) scenariosByApp[s.app] = [];
    scenariosByApp[s.app].push(s);
  });

  const slotMap = {};
  (catalog.rows || []).forEach((row) => {
    const slot = row.slotCapsule || 'unknown';
    if (!slotMap[slot]) {
      slotMap[slot] = {
        slot,
        menuEntries: [],
        prioriteMax: 'P2',
        structuralOk: true,
        statutCounts: { ok: 0, gap: 0 },
      };
    }
    const entry = {
      labelFr: row.labelFr,
      nomVm: row.nomVm,
      priorite: row.priorite,
      desktop: row.desktop,
      statut: row.statut,
    };
    slotMap[slot].menuEntries.push(entry);
    if (prioriteRank(row.priorite) < prioriteRank(slotMap[slot].prioriteMax)) {
      slotMap[slot].prioriteMax = row.priorite;
    }
    if (row.statut === 'ok') slotMap[slot].statutCounts.ok += 1;
    else slotMap[slot].statutCounts.gap += 1;
    if (row.statut !== 'ok') slotMap[slot].structuralOk = false;
  });

  const slots = Object.keys(slotMap).sort().map((slotId) => {
    const meta = slotMap[slotId];
    const appMeta = appsById[slotId] || null;
    const scenarios = scenariosByApp[slotId] || [];
    const pi = appMeta && appMeta.pi_credibility !== null && appMeta.pi_credibility !== undefined
      ? appMeta.pi_credibility
      : null;
    const scenarioCount = scenarios.length;
    const scenariosComplete = scenarioCount >= SCENARIOS_TARGET && pi === 100;
    const credibilityGap = pi !== 100;

    const slotRecord = {
      slot: slotId,
      label: appMeta ? appMeta.label : slotId,
      tier: null,
      prioriteMax: meta.prioriteMax,
      menuEntryCount: meta.menuEntries.length,
      menuEntries: meta.menuEntries,
      structuralOk: meta.structuralOk,
      pi_credibility: pi,
      scenarioCount,
      scenariosTarget: SCENARIOS_TARGET,
      scenariosComplete,
      credibilityGap,
      scenariosNeeded: credibilityGap ? Math.max(0, SCENARIOS_TARGET - scenarioCount) : 0,
    };

    if (PI100_APPS.has(slotId) || pi === 100) {
      slotRecord.tier = 'A';
      slotRecord.credibilityGap = false;
      slotRecord.scenariosNeeded = 0;
    } else if (slotId === 'themes') {
      slotRecord.tier = 'C';
    } else if (!meta.structuralOk) {
      slotRecord.tier = 'B';
    } else if (meta.prioriteMax === 'P0' || meta.prioriteMax === 'P1') {
      slotRecord.tier = 'B';
    } else {
      slotRecord.tier = 'B';
    }

    return slotRecord;
  });

  const menuRows = catalog.rows || [];
  const menuCoveredByPi100 = menuRows.filter((r) => PI100_APPS.has(r.slotCapsule)).length;
  const menuViaThemes = menuRows.filter((r) => r.slotCapsule === 'themes').length;
  const menuGapRows = menuRows.filter((r) => {
    return r.slotCapsule && !PI100_APPS.has(r.slotCapsule) && r.slotCapsule !== 'themes';
  }).length;

  const gapSlots = slots.filter((s) => s.credibilityGap);
  const gapSlotsP0 = gapSlots.filter((s) => s.prioriteMax === 'P0');
  const gapSlotsP1 = gapSlots.filter((s) => s.prioriteMax === 'P1');
  const gapSlotsP2 = gapSlots.filter((s) => s.prioriteMax === 'P2');
  const scenariosToDocument = gapSlots.reduce((sum, s) => sum + s.scenariosNeeded, 0);

  const wave1 = gapSlots
    .filter((s) => s.prioriteMax === 'P0' || s.prioriteMax === 'P1')
    .sort((a, b) => prioriteRank(a.prioriteMax) - prioriteRank(b.prioriteMax))
    .map((s) => s.slot);

  const wave2 = gapSlots
    .filter((s) => s.prioriteMax === 'P2')
    .map((s) => s.slot);

  return {
    registryId,
    campaign: 'v3-credibility-pass',
    phase: 'P-F1',
    generatedAt: new Date().toISOString(),
    sources: {
      catalog: `root/docs/inventaires/${registryId}-apps-catalog.json`,
      fidelity: `root/docs/inventaires/${registryId}-app-fidelity-scenarios.json`,
    },
    summary: {
      menuEntriesVm: menuRows.length,
      catalogSlots: (catalog.capsuleSlots || []).length,
      uniqueSlotsInMenu: slots.length,
      menuCoveredByPi100Slots: menuCoveredByPi100,
      menuViaThemesSlot: menuViaThemes,
      menuRowsNeedingCredibility: menuGapRows,
      appsPi100: PI100_APPS.size,
      gapSlotsTotal: gapSlots.length,
      gapSlotsP0: gapSlotsP0.length,
      gapSlotsP1: gapSlotsP1.length,
      gapSlotsP2: gapSlotsP2.length,
      scenariosExisting: (fidelity.scenarios || []).length,
      scenariosToAdd: scenariosToDocument,
      estimatedScenariosAtTarget: gapSlots.length * SCENARIOS_TARGET,
    },
    tiers: {
      A: {
        label: 'Crédibilité acquise (π=100) ou structure seule suffisante',
        slotCount: slots.filter((s) => s.tier === 'A').length,
      },
      B: {
        label: 'Slot catalogue — ≥3 scénarios CredC/S à produire',
        slotCount: slots.filter((s) => s.tier === 'B' && s.credibilityGap).length,
      },
      C: {
        label: 'Entrées menu → Paramètres (themes) — couvert par panneaux cs-*',
        slotCount: slots.filter((s) => s.tier === 'C').length,
        menuEntries: menuViaThemes,
      },
    },
    waveQueue: {
      wave1P0P1: wave1,
      wave2P2: wave2,
    },
    slots,
    gapSlots: gapSlots.map((s) => ({
      slot: s.slot,
      prioriteMax: s.prioriteMax,
      menuEntryCount: s.menuEntryCount,
      scenarioCount: s.scenarioCount,
      scenariosNeeded: s.scenariosNeeded,
      structuralOk: s.structuralOk,
    })),
  };
};

const printHuman = (map) => {
  const s = map.summary;
  process.stdout.write(`\n=== map-app-fidelity-gaps ${map.registryId} ===\n`);
  process.stdout.write(`Phase: ${map.phase}\n\n`);
  process.stdout.write(`Menu VM: ${s.menuEntriesVm} entrées\n`);
  process.stdout.write(`  → ${s.menuCoveredByPi100Slots} via slots π=100\n`);
  process.stdout.write(`  → ${s.menuViaThemesSlot} via Paramètres (themes)\n`);
  process.stdout.write(`  → ${s.menuRowsNeedingCredibility} vers slots sans π=100\n\n`);
  process.stdout.write(`Slots catalogue: ${s.catalogSlots} · gaps crédibilité: ${s.gapSlotsTotal}\n`);
  process.stdout.write(`  P0: ${s.gapSlotsP0} · P1: ${s.gapSlotsP1} · P2: ${s.gapSlotsP2}\n`);
  process.stdout.write(`Scénarios existants: ${s.scenariosExisting} · à ajouter (cible 3/slot): ${s.scenariosToAdd}\n\n`);
  process.stdout.write(`Vague 1 (P0+P1): ${map.waveQueue.wave1P0P1.join(', ')}\n`);
  process.stdout.write(`Vague 2 (P2): ${map.waveQueue.wave2P2.length} slots\n`);
};

const main = () => {
  const opts = parseArgs();
  const map = buildGapMap(opts.id);

  if (opts.write) {
    const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-app-fidelity-gaps.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
    process.stdout.write(`Écrit ${outPath}\n`);
  }

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(map, null, 2)}\n`);
    return;
  }

  printHuman(map);
  if (!opts.write) {
    process.stdout.write('\nAstuce: --write pour persister linux-mint-app-fidelity-gaps.json\n');
  }
};

main();
