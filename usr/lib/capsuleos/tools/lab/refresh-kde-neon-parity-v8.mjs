#!/usr/bin/env node
/**
 * Π pivot post pass Dolphin ctx (icônes KDE + flyouts) — cible 99.
 * Π=100 réservé post VM refresh (Konversation, compare live).
 *
 *   node usr/lib/capsuleos/tools/lab/refresh-kde-neon-parity-v8.mjs --write
 */
import {
  loadParityIndex,
  recomputeGlobal,
  saveParityIndex,
  updateAppParity,
  updateShellParity,
} from './parity-index-lib.mjs';

const write = process.argv.includes('--write');
let index = loadParityIndex('linux-kde-neon');

if (!index) {
  console.error('linux-kde-neon-parity-index.json introuvable');
  process.exit(1);
}

index.campaign = 'v8-pi-neon-pass';
index.description = 'Π pivot Neon — post ctx Dolphin · CredΣ · calendrier';
index.roadmap = 'linux-kde-neon-roadmap-pass.md';

const shellHi = { vis: 98, nav: 98, int: 98, ctx: 98, kb: 96, data: 98 };
const shellMid = { vis: 97, nav: 97, int: 97, ctx: 97, kb: 95, data: 97 };

updateShellParity(index, 'panel', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/panel.json',
  dimensions: shellHi,
});

updateShellParity(index, 'mainMenu', {
  status: 'ok',
  dimensions: { ...shellHi, ctx: 98 },
});

updateShellParity(index, 'tray', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/tray.json',
  dimensions: shellHi,
});

updateShellParity(index, 'clock', {
  status: 'ok',
  dimensions: { vis: 98, nav: 98, int: 98, ctx: 98, kb: 95, data: 98 },
  vpNote: 'v7 calendrier + smoke-kde-neon-calendar',
});

updateShellParity(index, 'desktop', {
  status: 'ok',
  dimensions: { vis: 98, nav: 97, int: 97, ctx: 97, kb: 95, data: 98 },
});

updateShellParity(index, 'theme', {
  status: 'ok',
  dimensions: { vis: 98, nav: 97, int: 97, ctx: 97, kb: 95, data: 98 },
});

const appHi = { vis: 99, nav: 99, int: 99, ctx: 99, kb: 96, data: 99 };

updateAppParity(index, 'nemo', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'CredΣ + pass ctx flyouts/icônes KDE (smoke 22 icônes)',
});

updateAppParity(index, 'firefox', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'CredΣ firefox (3 scénarios)',
});

updateAppParity(index, 'terminal', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'CredΣ konsole',
});

updateAppParity(index, 'update_manager', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'CredΣ discover',
});

recomputeGlobal(index);

if (write) {
  saveParityIndex('linux-kde-neon', index);
  console.log(`Π_global=${index.pi_global} (${index.status_global})`);
} else {
  console.log(JSON.stringify({ pi_global: index.pi_global, status_global: index.status_global }, null, 2));
}

process.exit((index.pi_global ?? 0) >= 99 ? 0 : 1);
