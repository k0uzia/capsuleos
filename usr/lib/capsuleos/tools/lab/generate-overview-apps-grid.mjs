#!/usr/bin/env node
/**
 * Génère la grille « Afficher les applications » (Ubuntu dock) depuis le catalogue AppC.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-overview-apps-grid.mjs --id linux-ubuntu --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog, skinIndexPath } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = '../../../usr/share/capsuleos/assets/images/toolkits/gnome';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const ICON_BY_VM = {
  'org.gnome.Nautilus': `${ASSETS}/apps/dash/org.gnome.Nautilus.svg`,
  firefox: `${ASSETS}/apps/firefox.webp`,
  'org.mozilla.Firefox': `${ASSETS}/apps/firefox.webp`,
  'org.gnome.Rhythmbox3': `${ASSETS}/apps/dash/org.gnome.Rhythmbox3.webp`,
  'libreoffice-writer': `${ASSETS}/apps/dash/libreoffice-writer.webp`,
  'snap-store': `${ASSETS}/dock/software-store.png`,
  'org.gnome.Ptyxis': `${ASSETS}/apps/overview/terminal.png`,
  'org.gnome.TextEditor': `${ASSETS}/apps/overview/text-editor.png`,
  'org.gnome.Calculator': `${ASSETS}/apps/overview/calculator.png`,
  'org.gnome.Settings': `${ASSETS}/apps/overview/settings.png`,
  'org.gnome.clocks': `${ASSETS}/apps/overview/clocks.png`,
  'org.gnome.Characters': `${ASSETS}/apps/overview/characters.png`,
  'org.gnome.Loupe': `${ASSETS}/apps/overview/org.gnome.Loupe.svg`,
  'org.gnome.Papers': `${ASSETS}/apps/overview/org.gnome.Papers.svg`,
  'org.gnome.Yelp': `${ASSETS}/apps/overview/org.gnome.Yelp.svg`,
  'org.gnome.baobab': `${ASSETS}/apps/overview/baobab.png`,
  'org.gnome.DiskUtility': `${ASSETS}/apps/overview/disks.png`,
  'org.gnome.Logs': `${ASSETS}/apps/overview/logs.png`,
  'org.gnome.Sysprof': `${ASSETS}/apps/overview/sysprof.png`,
  'org.gnome.Tecla': `${ASSETS}/apps/overview/tecla.png`,
  'org.gnome.font-viewer': `${ASSETS}/apps/overview/fonts.png`,
  'org.gnome.seahorse.Application': `${ASSETS}/apps/overview/seahorse.png`,
};

const iconForRow = (row) => {
  if (row.vmId && ICON_BY_VM[row.vmId]) return ICON_BY_VM[row.vmId];
  if (row.slotCapsule === 'update_manager') return `${ASSETS}/dock/software-store.png`;
  if (row.slotCapsule === 'nemo') return `${ASSETS}/dock/files.png`;
  if (row.vmId) {
    const dash = `${ASSETS}/apps/dash/${row.vmId}.svg`;
    const overview = `${ASSETS}/apps/overview/${row.vmId}.svg`;
    const overviewPng = `${ASSETS}/apps/overview/${row.vmId.replace(/^org\.gnome\./, '').toLowerCase()}.png`;
    return overview;
  }
  return `${ASSETS}/apps/overview/settings.png`;
};

const truncateLabel = (label) => {
  const t = String(label || '').trim();
  if (t.length <= 11) return t;
  return `${t.slice(0, 9)}...`;
};

const prioriteRank = (p) => {
  if (p === 'P0') return 0;
  if (p === 'P1') return 1;
  if (p === 'P2') return 2;
  if (p === 'P3') return 3;
  return 4;
};

const buildGrid = (registryId) => {
  const catalog = buildCatalog(registryId);
  const rows = catalog.rows
    .filter((r) => r.placement?.overview && r.onVm !== false)
    .sort((a, b) => {
      const pr = prioriteRank(a.priorite) - prioriteRank(b.priorite);
      if (pr !== 0) return pr;
      return String(a.labelFr).localeCompare(String(b.labelFr), 'fr');
    });

  return {
    version: 1,
    registryId,
    generatedAt: new Date().toISOString(),
    source: `root/docs/inventaires/${registryId}-apps-catalog.json`,
    apps: rows.map((row) => ({
      vmId: row.vmId,
      labelFr: row.labelFr,
      labelShort: truncateLabel(row.labelFr),
      slotCapsule: row.slotCapsule,
      icon: iconForRow(row),
      dataLink: row.slotCapsule || null,
      launchable: Boolean(row.slotCapsule),
      priorite: row.priorite,
    })),
  };
};

const gridOutputPath = (registryId) => {
  const skin = skinIndexPath(registryId);
  const skinDir = path.dirname(skin);
  return path.join(skinDir, 'data/overview-apps-grid.js');
};

const renderGridJs = (grid) => `/* Généré par generate-overview-apps-grid.mjs — ne pas éditer à la main */
window.CAPSULE_OVERVIEW_APPS_GRID = ${JSON.stringify(grid, null, 2)};
`;

const renderGridHtml = (grid) => grid.apps.map((app) => {
  const linkAttr = app.dataLink ? ` data-overview-link="${app.dataLink}"` : '';
  const disabledClass = app.launchable ? '' : '';
  return `                <button type="button" class="fedora-overview__app${disabledClass}"${linkAttr} aria-label="${app.labelFr}">
                    <img src="${app.icon}" alt="">
                    <span>${app.labelShort}</span>
                </button>`;
}).join('\n');

const patchIndexGrid = (registryId, grid) => {
  const indexPath = skinIndexPath(registryId);
  let html = fs.readFileSync(indexPath, 'utf8');
  const start = '            <!-- CAPSULE-OVERVIEW-APPS-GRID:START -->';
  const end = '            <!-- CAPSULE-OVERVIEW-APPS-GRID:END -->';
  if (!html.includes(start) || !html.includes(end)) {
    throw new Error(`${indexPath}: marqueurs CAPSULE-OVERVIEW-APPS-GRID manquants`);
  }
  const block = `${start}\n${renderGridHtml(grid)}\n            ${end}`;
  html = html.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    block,
  );
  fs.writeFileSync(indexPath, html, 'utf8');
};

const main = () => {
  const opts = parseArgs();
  const grid = buildGrid(opts.id);
  const outJs = gridOutputPath(opts.id);

  if (opts.write) {
    fs.mkdirSync(path.dirname(outJs), { recursive: true });
    fs.writeFileSync(outJs, renderGridJs(grid), 'utf8');
    patchIndexGrid(opts.id, grid);
    console.log(`✓ ${outJs.replace(`${ROOT}/`, '')} (${grid.apps.length} apps)`);
    console.log(`✓ grille injectée dans ${skinIndexPath(opts.id).replace(`${ROOT}/`, '')}`);
  } else {
    process.stdout.write(`${JSON.stringify(grid, null, 2)}\n`);
  }
};

main();
