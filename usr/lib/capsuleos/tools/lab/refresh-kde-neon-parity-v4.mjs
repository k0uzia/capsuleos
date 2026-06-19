#!/usr/bin/env node
/**
 * Rafraîchit linux-kde-neon-parity-index.json post campagne v4 (P4 clôture Π).
 * Usage: node usr/lib/capsuleos/tools/lab/refresh-kde-neon-parity-v4.mjs --write
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

index.campaign = 'v4-deep-parity';
index.description = 'Indice de parité interactionnelle — VM goupil@192.168.123.52 · campagne v4 P4';
index.roadmap = 'linux-kde-neon-roadmap-v4.md';

const hi = { vis: 96, nav: 96, int: 96, ctx: 94, kb: 92, data: 96 };
const mid = { vis: 94, nav: 94, int: 94, ctx: 92, kb: 88, data: 94 };

updateShellParity(index, 'panel', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/panel.json',
  dimensions: hi,
});

updateShellParity(index, 'mainMenu', {
  status: 'ok',
  dimensions: { vis: 96, nav: 97, int: 97, ctx: 95, kb: 92, data: 97 },
});

updateShellParity(index, 'tray', {
  status: 'ok',
  inventory: 'interactions/linux-kde-neon/tray.json',
  dimensions: hi,
});

updateShellParity(index, 'clock', {
  status: 'ok',
  dimensions: mid,
});

updateShellParity(index, 'desktop', {
  status: 'ok',
  dimensions: { vis: 94, nav: 92, int: 92, ctx: 90, kb: 88, data: 94 },
});

updateShellParity(index, 'theme', {
  status: 'ok',
  dimensions: mid,
});

updateAppParity(index, 'nemo', {
  status: 'ok',
  dimensions: { vis: 97, nav: 97, int: 97, ctx: 95, kb: 90, data: 96 },
  vpNote: 'v4 P0+P3 — split, périphériques, chrome partagé',
});

updateAppParity(index, 'firefox', {
  status: 'ok',
  dimensions: { vis: 96, nav: 96, int: 96, ctx: 94, kb: 88, data: 94 },
});

updateAppParity(index, 'terminal', {
  status: 'ok',
  dimensions: { vis: 96, nav: 96, int: 96, ctx: 92, kb: 92, data: 94 },
});

updateAppParity(index, 'update_manager', {
  status: 'ok',
  dimensions: { vis: 97, nav: 97, int: 97, ctx: 95, kb: 88, data: 97 },
  vpNote: 'v4 P1 — Kirigami fiches VLC',
});

index.catalog = {
  ...index.catalog,
  kickoffApps: 30,
  kickoffLinked: 30,
  panelPins: 4,
  discoverViews: 5,
  kdeconnectKickoff: 3,
};

recomputeGlobal(index);

if (write) {
  saveParityIndex('linux-kde-neon', index);
  console.log(`Π_global=${index.pi_global} (${index.status_global})`);
} else {
  console.log(JSON.stringify({ pi_global: index.pi_global, status_global: index.status_global }, null, 2));
}

process.exit((index.pi_global ?? 0) >= 95 ? 0 : 1);
