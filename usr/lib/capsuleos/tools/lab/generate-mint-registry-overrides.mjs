#!/usr/bin/env node
/**
 * Génère registryOverrides.linux-mint dans apps-catalog.json depuis l'inventaire Mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs --write
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs --write --p0-only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const CATALOG_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');
const MINT_CATALOG = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-catalog.json');

const P0_MINIMAL = new Set(['nemo', 'firefox', 'terminal', 'update_manager', 'themes']);

const DESKTOP_BY_SLOT = {
  nemo: 'nemo',
  firefox: 'firefox',
  terminal: 'org.gnome.Terminal',
  update_manager: 'mintupdate',
  themes: 'cinnamon-settings',
  text_editor: 'org.x.editor',
  calculator: 'org.gnome.Calculator',
  mintinstall: 'mintinstall',
  mainMenu: 'cinnamon-launcher',
};

const placementFor = (row) => ({
  dash: !!(row.favoriBureau || row.panel),
  overview: !!(row.menuMint || row.favoriBureau),
  quickSettings: !!row.tray,
  desktop: !!row.favoriBureau,
});

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    write: args.includes('--write'),
    p0Only: args.includes('--p0-only'),
  };
};

const buildOverride = (opts) => {
  const mint = JSON.parse(fs.readFileSync(MINT_CATALOG, 'utf8'));
  const rows = mint.rows || [];
  const seenSlots = new Set();
  const apps = {};

  const slotRows = new Map();
  for (const row of rows) {
    const slot = row.slotCapsule;
    if (!slot || row.statut !== 'ok') continue;
    if (opts.p0Only && !P0_MINIMAL.has(slot)) continue;
    const prev = slotRows.get(slot);
    if (!prev || (row.priorite === 'P0' && prev.priorite !== 'P0')) {
      slotRows.set(slot, row);
    }
  }

  for (const [slot, row] of slotRows) {
    const desktopId = DESKTOP_BY_SLOT[slot] || row.desktop?.replace(/\.desktop$/, '') || slot;
    seenSlots.add(slot);
    apps[desktopId] = {
      labelFr: row.labelFr,
      priorite: row.priorite || 'P2',
      slot,
      statut: 'ok',
      requiresSlot: row.priorite === 'P0' || row.priorite === 'P1',
      placement: placementFor(row),
    };
  }

  for (const slot of P0_MINIMAL) {
    if (seenSlots.has(slot)) continue;
    const desktopId = DESKTOP_BY_SLOT[slot] || slot;
    apps[desktopId] = {
      labelFr: {
        nemo: 'Fichiers',
        firefox: 'Firefox',
        terminal: 'Terminal',
        update_manager: 'Gestionnaire de mises à jour',
        themes: 'Paramètres du système',
      }[slot],
      priorite: 'P0',
      slot,
      statut: 'ok',
      requiresSlot: true,
      placement: {
        nemo: { dash: true, overview: true },
        firefox: { dash: true, overview: true },
        terminal: { dash: true, overview: true },
        update_manager: { dash: true, overview: true },
        themes: { overview: true, quickSettings: true },
      }[slot],
    };
  }

  return {
    toolkit: 'cinnamon',
    vmAppsSource: 'root/docs/inventaires/linux-mint-vm-apps-installed.json',
    apps,
    capsuleOnly: [
      { slot: 'checklist', labelFr: 'Missions CapsuleOS', statut: 'capsuleOnly' },
      { slot: 'profile', labelFr: 'À propos Linux Mint', statut: 'ok', placement: { desktop: true } },
      { slot: 'screenshot', labelFr: "Capture d'écran", statut: 'ok', placement: { quickSettings: true } },
    ],
  };
};

const main = () => {
  const opts = parseArgs();
  const override = buildOverride(opts);
  const appCount = Object.keys(override.apps).length;

  if (!opts.write) {
    console.log(JSON.stringify({ registryId: 'linux-mint', appCount, apps: override.apps }, null, 2));
    console.log(`\n○ Prévisualisation — ${appCount} apps (dry-run, --write pour patcher apps-catalog.json)`);
    return;
  }

  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(raw);
  catalog.registryOverrides = catalog.registryOverrides || {};
  catalog.registryOverrides['linux-mint'] = override;
  const block = JSON.stringify(override, null, 2).split('\n').map((line, i) => (i === 0 ? line : '    ' + line)).join('\n');
  const marker = '"linux-mint":';
  if (raw.includes(marker)) {
    const re = /"linux-mint":\s*\{[\s\S]*?\n    \}(?=\s*\n  \})/;
    if (!re.test(raw)) {
      console.error('✗ apps-catalog.json : bloc linux-mint non repérable — patch manuel requis');
      process.exit(1);
    }
    const next = raw.replace(re, `"linux-mint": ${block.slice(1)}`);
    fs.writeFileSync(CATALOG_PATH, next.endsWith('\n') ? next : `${next}\n`);
  } else {
    const insertRe = /(\n    "linux-fedora": \{[\s\S]*?\n    \})\n(  \}\n\})/;
    if (!insertRe.test(raw)) {
      console.error('✗ apps-catalog.json : point d\'insertion linux-mint introuvable');
      process.exit(1);
    }
    const next = raw.replace(insertRe, `$1,\n    "linux-mint": ${block.slice(1)}\n$2`);
    fs.writeFileSync(CATALOG_PATH, next.endsWith('\n') ? next : `${next}\n`);
  }
  console.log(`✓ apps-catalog.json — registryOverrides.linux-mint (${appCount} apps, patch ciblé)`);
};

main();
