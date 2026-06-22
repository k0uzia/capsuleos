#!/usr/bin/env node
/**
 * Initialise linux-kde-neon-parity-index.json (campagne v3).
 *
 * Usage: node usr/lib/capsuleos/tools/lab/seed-kde-neon-parity-index.mjs --write
 */
import {
  computePiApp,
  parityStatus,
  recomputeGlobal,
  saveParityIndex,
} from './parity-index-lib.mjs';

/** Scores initiaux post-v2 — voir linux-kde-neon-roadmap.md §2. */
const NEON_SHELL_BASELINE = {
  panel: { vis: 85, nav: 82, int: 80, ctx: 52, kb: 45, data: 88 },
  mainMenu: { vis: 88, nav: 86, int: 84, ctx: 55, kb: 50, data: 92 },
  tray: { vis: 90, nav: 85, int: 68, ctx: 42, kb: 40, data: 82 },
  clock: { vis: 92, nav: 88, int: 90, ctx: 85, kb: 50, data: 88 },
  desktop: { vis: 88, nav: 78, int: 72, ctx: 58, kb: 45, data: 86 },
  theme: { vis: 90, nav: 86, int: 85, ctx: 72, kb: 50, data: 90 },
};

const NEON_APP_BASELINE = {
  nemo: { vis: 88, nav: 90, int: 82, ctx: 38, kb: 55, data: 88 },
  firefox: { vis: 85, nav: 82, int: 88, ctx: 72, kb: 58, data: 85 },
  terminal: { vis: 78, nav: 72, int: 74, ctx: 45, kb: 70, data: 80 },
  update_manager: { vis: 88, nav: 86, int: 78, ctx: 62, kb: 45, data: 90 },
};

const APP_LABELS = {
  nemo: 'Dolphin',
  firefox: 'Firefox',
  terminal: 'Konsole',
  update_manager: 'Discover',
};

const parseArgs = () => ({ write: process.argv.includes('--write') });

const buildShell = () => {
  const shell = {};
  Object.entries(NEON_SHELL_BASELINE).forEach(([id, dims]) => {
    const pi = computePiApp(dims);
    shell[id] = {
      id,
      pi,
      status: parityStatus(pi),
      dimensions: dims,
      inventory: id === 'tray' || id === 'clock' || id === 'desktop' || id === 'theme'
        ? null
        : `interactions/linux-kde-neon/${id === 'panel' ? 'panel' : id}.json`,
    };
  });
  return shell;
};

const buildApps = () => {
  const apps = {};
  Object.entries(NEON_APP_BASELINE).forEach(([slot, dims]) => {
    const pi = computePiApp(dims);
    apps[slot] = {
      slot,
      label: APP_LABELS[slot] || slot,
      pi,
      status: parityStatus(pi),
      dimensions: dims,
      inventory: `interactions/linux-kde-neon/${slot}.json`,
    };
  });
  return apps;
};

const main = () => {
  const opts = parseArgs();
  const index = recomputeGlobal({
    registryId: 'linux-kde-neon',
    version: 1,
    campaign: 'v3-full-parity',
    description: 'Indice de parité interactionnelle — VM <lab-inventory:linux-kde-neon>
    weights: { shell: 0.25, apps: 0.75 },
    thresholds: { ok: 90, partiel: 60 },
    shell: buildShell(),
    apps: buildApps(),
    catalog: {
      kickoffApps: 30,
      panelPins: 4,
      discoverViews: 5,
    },
    roadmap: 'linux-kde-neon-roadmap.md',
    updatedAt: new Date().toISOString(),
  });

  if (opts.write) {
    const out = saveParityIndex('linux-kde-neon', index);
    console.log(`Écrit : ${out.replace(`${process.cwd()}/`, '')} — Π_global=${index.pi_global} (${index.status_global})`);
  } else {
    console.log(JSON.stringify({
      pi_global: index.pi_global,
      status_global: index.status_global,
      shellCount: Object.keys(index.shell).length,
      appCount: Object.keys(index.apps).length,
    }, null, 2));
  }
};

main();
