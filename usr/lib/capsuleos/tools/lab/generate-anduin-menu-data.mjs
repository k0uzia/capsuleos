#!/usr/bin/env node
/**
 * Régénère ANDUIN_MENU_FAVORITES depuis le manifeste VM + inventaire menu.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-anduin-menu-data.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAppsContract } from './apps-catalog-lib.mjs';
import { resolveAppIconCapsuleRelative } from './manifest-playbook-lib.mjs';
import { loadManifest } from './vm-manifest-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_ID = 'linux-anduinos';
const VM_MENU_PATH = path.join(ROOT, 'root/docs/inventaires/linux-anduinos-menu-entries-vm.json');
const OUT = path.join(ROOT, 'home/Debian/AnduinOS/content/mainMenu-data.js');
const ASSET_PREFIX = './assets/';

const assetRef = (capsuleRelative) => `${ASSET_PREFIX}${capsuleRelative}`;
const DASH_APPS = new Set([
  'firefox',
  'org.gnome.Nautilus',
  'org.gnome.Software',
  'org.gnome.Calendar',
  'org.gnome.Yelp',
]);

/** Slots GNOME communs (repli catalogue Rocky). */
const ROCKY_SLOT_FALLBACK = {
  'org.gnome.clocks': 'clocks',
  'org.gnome.Papers': 'visionneur_pdf',
  'org.gnome.Loupe': 'visionneur_images',
  'org.gnome.Snapshot': 'snapshot',
  'org.gnome.baobab': 'baobab',
  'org.gnome.SystemMonitor': 'system_monitor',
  'net.nokyan.Resources': 'system_monitor',
  'org.gnome.Showtime': 'lecteur_multimedia',
  'org.gnome.Music': 'rhythmbox',
  'org.gnome.seahorse.Application': 'themes',
};

const buildIconLookup = () => {
  const manifest = loadManifest(REGISTRY_ID);
  if (!manifest) throw new Error(`Manifeste absent: ${REGISTRY_ID}`);

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

const assetExists = (rel) => fs.existsSync(path.join(ROOT, 'usr/share/capsuleos/assets', rel));

const resolveIconPath = (vmId, lookup) => {
  const { byDesktopId, byAppId } = lookup;
  if (byAppId.has(vmId)) return byAppId.get(vmId);
  if (byDesktopId.has(vmId)) return byDesktopId.get(vmId);

  const subdirs = DASH_APPS.has(vmId)
    ? ['dash', 'overview']
    : ['overview', 'dash'];
  const exts = ['.svg', '.png', '.webp'];
  for (const sub of subdirs) {
    for (const ext of exts) {
      const rel = `images/toolkits/gnome/apps/${sub}/${vmId}${ext}`;
      if (assetExists(rel)) {
        return assetRef(rel);
      }
    }
  }
  if (vmId === 'firefox') {
    const rel = 'images/toolkits/gnome/apps/firefox.svg';
    if (assetExists(rel)) return assetRef(rel);
  }
  return null;
};

const slotFromCatalog = (vmId) => {
  const contract = loadAppsContract();
  const anduin = contract.registryOverrides?.[REGISTRY_ID]?.apps?.[vmId];
  if (anduin?.slot) return anduin.slot;
  const rocky = contract.registryOverrides?.['linux-rocky']?.apps?.[vmId];
  if (rocky?.slot) return rocky.slot;
  return ROCKY_SLOT_FALLBACK[vmId] || null;
};

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const buildFavorites = () => {
  if (!fs.existsSync(VM_MENU_PATH)) {
    throw new Error(`Inventaire menu absent: ${VM_MENU_PATH}`);
  }
  const menu = JSON.parse(fs.readFileSync(VM_MENU_PATH, 'utf8'));
  const lookup = buildIconLookup();
  const missingIcons = [];

  return (menu.favorites || []).map((entry) => {
    const vmId = entry.vmId || entry.desktop.replace(/\.desktop$/, '');
    const slot = entry.slot || slotFromCatalog(vmId);
    const icon = resolveIconPath(vmId, lookup);
    if (!icon) missingIcons.push(vmId);

    return {
      id: vmId.replace(/^org\.gnome\./, '').replace(/\./g, '-').toLowerCase(),
      name: entry.name,
      icon,
      dataLink: slot,
      vmId,
      desktop: entry.desktop,
    };
  }).map((row) => {
    const { vmId, desktop, ...rest } = row;
    return rest;
  });
};

const renderFile = (favorites) => {
  const lines = [];
  lines.push('/* Généré par generate-anduin-menu-data.mjs — ne pas éditer à la main */');
  lines.push('/**');
  lines.push(' * AnduinOS — favoris menu Démarrer (grille 6×4, ordre VM).');
  lines.push(` * Source : ${VM_MENU_PATH.replace(`${ROOT}/`, '')}`);
  lines.push(' */');
  lines.push('const ANDUIN_MENU_FAVORITES = [');
  favorites.forEach((app) => {
    const link = app.dataLink ? `'${esc(app.dataLink)}'` : 'null';
    const icon = app.icon ? `'${esc(app.icon)}'` : 'null';
    lines.push(`    { id: '${esc(app.id)}', name: '${esc(app.name)}', icon: ${icon}, dataLink: ${link} },`);
  });
  lines.push('];');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const main = () => {
  const write = process.argv.includes('--write');
  const favorites = buildFavorites();
  const content = renderFile(favorites);
  if (write) {
    fs.writeFileSync(OUT, content);
    console.log(`✓ ${OUT.replace(`${ROOT}/`, '')} (${favorites.length} favoris)`);
    const launchable = favorites.filter((f) => f.dataLink).length;
    console.log(`  ${launchable}/${favorites.length} lançables`);
  } else {
    process.stdout.write(content);
  }
};

main();
