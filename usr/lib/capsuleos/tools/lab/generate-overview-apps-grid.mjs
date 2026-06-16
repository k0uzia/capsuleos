#!/usr/bin/env node
/**
 * Génère la grille « Afficher les applications » depuis le manifeste VM (appIcons).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-overview-apps-grid.mjs --id linux-ubuntu --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog, skinIndexPath } from './apps-catalog-lib.mjs';
import { resolveAppIconCapsuleRelative } from './manifest-playbook-lib.mjs';
import { loadManifest } from './vm-manifest-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSET_PREFIX = '../../../usr/share/capsuleos/assets/';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const assetRef = (capsuleRelative) => `${ASSET_PREFIX}${capsuleRelative}`;

const buildIconLookup = (registryId) => {
  const manifest = loadManifest(registryId);
  if (!manifest) throw new Error(`Manifeste absent: ${registryId}`);

  const byDesktopId = new Map();
  const byAppId = new Map();
  for (const icon of manifest.media?.appIcons || []) {
    const rel = resolveAppIconCapsuleRelative(icon, manifest);
    if (!rel) continue;
    const ref = assetRef(rel);
    if (icon.desktopId) byDesktopId.set(icon.desktopId, ref);
    if (icon.appId) byAppId.set(icon.appId, ref);
  }
  return { byDesktopId, byAppId, manifest };
};

const iconForRow = (row, lookup) => {
  const { byDesktopId, byAppId } = lookup;
  if (row.vmId && byDesktopId.has(row.vmId)) return byDesktopId.get(row.vmId);
  if (row.vmId && byAppId.has(row.vmId)) return byAppId.get(row.vmId);
  if (row.slotCapsule === 'update_manager') {
    return byAppId.get('snap-store') || byDesktopId.get('snap-store') || null;
  }
  if (row.vmId) {
    const candidates = [
      `images/toolkits/gnome/apps/overview/${row.vmId}.svg`,
      `images/toolkits/gnome/apps/overview/${row.vmId}.png`,
      `images/toolkits/gnome/apps/${row.vmId}`,
    ];
    for (const rel of candidates) {
      if (fs.existsSync(path.join(ROOT, 'usr/share/capsuleos/assets', rel))) {
        return assetRef(rel);
      }
    }
  }
  return null;
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
  const lookup = buildIconLookup(registryId);
  const rows = catalog.rows
    .filter((r) => {
      if (!r.placement?.overview) return false;
      if (r.onVm !== false) return true;
      return Boolean(r.slotCapsule && r.statut === 'ok' && r.requiresSlot);
    })
    .sort((a, b) => {
      const pr = prioriteRank(a.priorite) - prioriteRank(b.priorite);
      if (pr !== 0) return pr;
      return String(a.labelFr).localeCompare(String(b.labelFr), 'fr');
    });

  const missing = [];
  const apps = rows.map((row) => {
    const icon = iconForRow(row, lookup);
    if (!icon) missing.push(row.vmId || row.slotCapsule);
    const launchable = Boolean(row.slotCapsule);
    return {
      vmId: row.vmId,
      labelFr: row.labelFr,
      labelShort: truncateLabel(row.labelFr),
      slotCapsule: row.slotCapsule,
      icon,
      dataLink: row.slotCapsule || null,
      launchable,
      decorative: !launchable,
      priorite: row.priorite,
    };
  });

  if (missing.length) {
    console.warn(`⚠ ${missing.length} app(s) overview sans icône manifeste: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
  }

  return {
    version: 2,
    registryId,
    generatedAt: new Date().toISOString(),
    source: `proc/${registryId}/distribution-manifest.json`,
    apps,
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
  const decorativeAttr = app.decorative ? ' data-overview-decorative="true"' : '';
  const className = app.decorative
    ? 'fedora-overview__app fedora-overview__app--decorative'
    : 'fedora-overview__app';
  const iconSrc = app.icon || `${ASSET_PREFIX}images/toolkits/gnome/apps/overview/settings.png`;
  return `                <button type="button" class="${className}"${linkAttr}${decorativeAttr} aria-label="${app.labelFr}">
                    <img src="${iconSrc}" alt="">
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
