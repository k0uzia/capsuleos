#!/usr/bin/env node
/**
 * Génère la matrice menu → csPanel (TIER-C-THEMES).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-menu-cs-routing-matrix.mjs --write
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import {
  DESKTOP_CS_PANEL,
  LABEL_FR_CS_PANEL,
  readCinnamonPanelIds,
  resolveCsPanel,
  panelExists,
} from './mint-desktop-cs-panel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_DATA = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');
const OUT = path.join(ROOT, 'root/docs/inventaires/interactions/linux-mint/menu-cs-routing.json');

const readMenuApps = () => {
  const src = fs.readFileSync(MENU_DATA, 'utf8');
  const sandbox = {};
  vm.runInNewContext(`${src}; this.MENU_APPS = MENU_APPS;`, sandbox);
  return sandbox.MENU_APPS;
};

const buildMatrix = () => {
  const panelIds = readCinnamonPanelIds();
  const apps = readMenuApps();
  const themesApps = apps.filter((a) => a.dataLink === 'themes');

  const entries = themesApps.map((app) => {
    const csPanel = app.csPanel || resolveCsPanel({ name: app.name });
    const panelOk = csPanel ? panelExists(csPanel) : false;
    return {
      id: app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      labelFr: app.name,
      catId: app.catId,
      dataLink: app.dataLink,
      csPanel: csPanel || null,
      panelRegistered: panelOk,
      priority: 'P1',
      smoke: {
        trigger: 'main-menu-click',
        searchHint: app.name.split(' ')[0],
      },
      status: csPanel && panelOk ? 'ok' : (csPanel ? 'panel-missing' : 'no-routing'),
    };
  });

  const ok = entries.filter((e) => e.status === 'ok').length;
  const parityPct = themesApps.length ? Math.round((ok / themesApps.length) * 100) : 0;

  return {
    registryId: 'linux-mint',
    tier: 'TIER-C-THEMES',
    collectedAt: new Date().toISOString(),
    source: 'generate-menu-cs-routing-matrix.mjs',
    workflow: {
      cycle: 'VM manifest → generate-mint-menu-data.mjs → menu-cs-routing.json → smoke-mint-menu-cs-routing.mjs',
      smokeGate: 'usr/lib/capsuleos/tools/lab/smoke-mint-menu-cs-routing.mjs',
      desktopMap: 'usr/lib/capsuleos/tools/lab/mint-desktop-cs-panel.mjs',
    },
    vm: {
      host: '<lab-inventory:linux-mint>',
      manifest: 'proc/linux-mint/distribution-manifest.json',
    },
    summary: {
      themesMenuEntries: themesApps.length,
      routedOk: ok,
      parityPct,
      cinnamonPanelCount: panelIds.length,
      desktopMapSize: Object.keys(DESKTOP_CS_PANEL).length,
      labelMapSize: Object.keys(LABEL_FR_CS_PANEL).length,
    },
    entries,
  };
};

const main = () => {
  const write = process.argv.includes('--write');
  const matrix = buildMatrix();
  const json = `${JSON.stringify(matrix, null, 2)}\n`;
  if (write) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, json);
    console.log(`✓ ${OUT.replace(`${ROOT}/`, '')} — ${matrix.summary.routedOk}/${matrix.summary.themesMenuEntries} (${matrix.summary.parityPct}%)`);
  } else {
    process.stdout.write(json);
  }
};

main();
