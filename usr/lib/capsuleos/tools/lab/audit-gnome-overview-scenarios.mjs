#!/usr/bin/env node
/**
 * Audit overview GNOME : croise grille Aperçu + dash + dock avec contrats scénarios.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-alma
 *   node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-rocky --json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog, skinIndexPath } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.join(ROOT, 'etc/capsuleos/contracts/gnome-user-scenarios-index.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-alma', json: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--json') opts.json = true;
  }
  return opts;
};

const loadIndex = () => {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const bySlot = new Map();
  (index.contracts || []).forEach((c) => bySlot.set(c.slot, c));
  return { index, bySlot };
};

const parseOverview = (html) => {
  const grid = [];
  const gridBlock = html.match(/CAPSULE-OVERVIEW-APPS-GRID:START[\s\S]*?CAPSULE-OVERVIEW-APPS-GRID:END/);
  if (gridBlock) {
    for (const m of gridBlock[0].matchAll(/<button[^>]*class="fedora-overview__app"([^>]*)>/g)) {
      const attrs = m[1];
      const link = attrs.match(/data-overview-link="([^"]+)"/);
      const label = attrs.match(/aria-label="([^"]+)"/);
      const isFolder = attrs.includes('fedora-overview__app--folder');
      grid.push({
        slot: link ? link[1] : null,
        label: label ? label[1] : '?',
        wired: Boolean(link),
        decorative: isFolder || !link,
        zone: 'overviewGrid',
      });
    }
  }
  const dash = [];
  for (const m of html.matchAll(/fedora-overview__dash-item[^>]*data-overview-link="([^"]+)"[^>]*aria-label="([^"]+)"/g)) {
    dash.push({ slot: m[1], label: m[2], wired: true, decorative: false, zone: 'overviewDash' });
  }
  const dock = [];
  const dockBlock = html.match(/class="fedora-dock"[\s\S]*?<\/aside>/);
  if (dockBlock) {
    for (const m of dockBlock[0].matchAll(/data-link="([^"]+)"[^>]*title="([^"]+)"/g)) {
      dock.push({ slot: m[1], label: m[2], wired: true, decorative: false, zone: 'dock' });
    }
  }
  return { grid, dash, dock };
};

const prioriteRank = (p) => ({ P0: 0, P1: 1, P2: 2, P3: 3 }[p] ?? 4);

const run = () => {
  const { id, json: asJson } = parseArgs();
  const skinPath = skinIndexPath(id);
  const html = fs.readFileSync(skinPath, 'utf8');
  const catalog = buildCatalog(id);
  const bySlotCatalog = Object.fromEntries(catalog.rows.map((r) => [r.slotCapsule, r]));
  const { bySlot } = loadIndex();
  const { grid, dash, dock } = parseOverview(html);

  const seen = new Set();
  const rows = [];

  const pushRow = (item) => {
    if (!item.slot || seen.has(`${item.zone}:${item.slot}`)) return;
    seen.add(`${item.zone}:${item.slot}`);
    const cat = bySlotCatalog[item.slot];
    const contract = bySlot.get(item.slot);
    rows.push({
      zone: item.zone,
      slot: item.slot,
      label: item.label || cat?.labelFr || item.slot,
      priorite: cat?.priorite || (item.decorative ? 'decorative' : 'P2'),
      wired: item.wired,
      scenariosAvant: 'non',
      scenariosApres: contract ? 'oui' : 'non',
      contract: contract?.contract || null,
      smoke: contract?.smoke || cat?.smokeStructurel || null,
      pi: null,
    });
  };

  [...dock, ...dash, ...grid].forEach(pushRow);

  rows.sort((a, b) => {
    const pr = prioriteRank(a.priorite) - prioriteRank(b.priorite);
    if (pr !== 0) return pr;
    return a.zone.localeCompare(b.zone);
  });

  const gapsP0 = rows.filter((r) => r.priorite === 'P0' && r.scenariosApres === 'non' && r.wired);
  const report = {
    registryId: id,
    skin: skinPath.replace(`${ROOT}/`, ''),
    generatedAt: new Date().toISOString(),
    summary: {
      totalWired: rows.filter((r) => r.wired).length,
      withScenarios: rows.filter((r) => r.scenariosApres === 'oui').length,
      gapsP0: gapsP0.length,
      decorativeOverview: grid.filter((g) => g.decorative).length,
    },
    gapsP0: gapsP0.map((r) => ({ slot: r.slot, label: r.label, zone: r.zone })),
    rows,
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Audit overview scénarios — ${id}`);
  console.log(`  Grille : ${grid.length} boutons · Dash : ${dash.length} · Dock : ${dock.length}`);
  console.log(`  Scénarios : ${report.summary.withScenarios}/${report.summary.totalWired} slots câblés`);
  console.log(`  Gaps P0 sans scénarios : ${report.summary.gapsP0}`);
  if (gapsP0.length) {
    console.log('\nGaps P0 (backlog C26+) :');
    gapsP0.forEach((g) => console.log(`  - ${g.slot} (${g.label}) [${g.zone}]`));
  }
  console.log('\n| Zone | Slot | Priorité | Scénarios |');
  console.log('|------|------|----------|-----------|');
  rows.forEach((r) => {
    console.log(`| ${r.zone} | ${r.slot} | ${r.priorite} | ${r.scenariosApres} |`);
  });
};

run();
