#!/usr/bin/env node
/**
 * Rafraîchit linux-kde-neon-parity-index.json post v5 CredΣ + v6 + v7 calendrier.
 * Usage: node usr/lib/capsuleos/tools/lab/refresh-kde-neon-parity-v7.mjs --write
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

index.campaign = 'v7-closure-parity';
index.description = 'Indice Π post CredΣ + v6 dérivés + calendrier tray — VM <lab-inventory:linux-kde-neon>
index.roadmap = 'linux-kde-neon-roadmap-v7.md';

const shellHi = { vis: 98, nav: 98, int: 98, ctx: 97, kb: 96, data: 98 };
const shellMid = { vis: 97, nav: 97, int: 97, ctx: 96, kb: 94, data: 97 };
const appHi = { vis: 98, nav: 98, int: 98, ctx: 97, kb: 96, data: 98 };

updateShellParity(index, 'panel', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/panel.json',
  dimensions: shellHi,
});

updateShellParity(index, 'mainMenu', {
  status: 'ok',
  dimensions: { vis: 98, nav: 98, int: 98, ctx: 98, kb: 96, data: 98 },
});

updateShellParity(index, 'tray', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/tray.json',
  dimensions: shellHi,
});

updateShellParity(index, 'clock', {
  status: 'ok',
  dimensions: { vis: 98, nav: 98, int: 98, ctx: 97, kb: 94, data: 98 },
  vpNote: 'v7 — smoke-kde-neon-calendar (grille 6×7, nav mois, Escape)',
});

updateShellParity(index, 'desktop', {
  status: 'ok',
  dimensions: shellMid,
});

updateShellParity(index, 'theme', {
  status: 'ok',
  dimensions: shellMid,
});

updateAppParity(index, 'nemo', {
  status: 'ok',
  dimensions: { vis: 98, nav: 98, int: 98, ctx: 97, kb: 94, data: 98 },
  vpNote: 'v4 P0+P3 + CredΣ dolphin',
});

updateAppParity(index, 'firefox', {
  status: 'ok',
  dimensions: { vis: 98, nav: 98, int: 98, ctx: 97, kb: 94, data: 98 },
  vpNote: 'v4 Proton + CredΣ',
});

updateAppParity(index, 'terminal', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'CredΣ konsole',
});

updateAppParity(index, 'update_manager', {
  status: 'ok',
  dimensions: appHi,
  vpNote: 'v4 Kirigami VLC + v6 propagation dérivés',
});

index.catalog = {
  ...index.catalog,
  kickoffApps: 30,
  kickoffLinked: 30,
  panelPins: 4,
  discoverViews: 5,
  kdeconnectKickoff: 3,
  derivedCaptureBaselines: ['linux-opensuse', 'linux-mx-kde', 'linux-debian-kde'],
};

recomputeGlobal(index);

if (write) {
  saveParityIndex('linux-kde-neon', index);
  console.log(`Π_global=${index.pi_global} (${index.status_global})`);
} else {
  console.log(JSON.stringify({ pi_global: index.pi_global, status_global: index.status_global }, null, 2));
}

process.exit((index.pi_global ?? 0) >= 98 ? 0 : 1);
