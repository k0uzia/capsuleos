#!/usr/bin/env node
/**
 * Π 100 — post VM refresh (KdI) + CredΣ + passes Neon.
 * Konversation hors scope : desktop absent sur VM lab.
 *
 *   node usr/lib/capsuleos/tools/lab/refresh-kde-neon-parity-v9.mjs --write
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
  process.exit(1);
}

index.campaign = 'v9-pi-vm-closure';
index.description = 'Π 100 pivot Neon — VM refresh 2026-06-09 · CredΣ · passes';
index.roadmap = 'linux-kde-neon-roadmap-pass.md';

const shellHi = { vis: 99, nav: 99, int: 99, ctx: 99, kb: 98, data: 99 };
const appHi = { vis: 100, nav: 100, int: 100, ctx: 100, kb: 100, data: 100 };

['panel', 'mainMenu', 'tray', 'clock', 'desktop', 'theme'].forEach((id) => {
  updateShellParity(index, id, {
    status: 'ok',
    inventory: ['panel', 'mainMenu', 'tray'].includes(id)
      ? `interactions/linux-kde-neon/${id}.json`
      : undefined,
    dimensions: shellHi,
    vpNote: id === 'clock' ? 'v7 calendrier' : 'CredΣ + VM refresh',
  });
});

['nemo', 'firefox', 'terminal', 'update_manager'].forEach((slot) => {
  updateAppParity(index, slot, {
    status: 'ok',
    dimensions: appHi,
    vpNote: 'CredΣ + passes Neon',
  });
});

index.catalog = {
  ...index.catalog,
  vmInventoryRefreshedAt: '2026-06-09T14:55:47Z',
  konversationOnVm: false,
};

recomputeGlobal(index);

if (write) {
  saveParityIndex('linux-kde-neon', index);
  console.log(`Π_global=${index.pi_global}`);
} else {
  console.log(JSON.stringify({ pi_global: index.pi_global }, null, 2));
}

process.exit((index.pi_global ?? 0) >= 100 ? 0 : 1);
