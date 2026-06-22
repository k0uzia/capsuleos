#!/usr/bin/env node
/**
 * Initialise linux-mint-parity-index.json depuis catalogue + baselines.
 *
 * Usage: node usr/lib/capsuleos/tools/lab/seed-mint-parity-index.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASELINE_DIMENSIONS, SHELL_BASELINE } from './app-interaction-templates.mjs';
import {
  computePiApp,
  parityStatus,
  recomputeGlobal,
  saveParityIndex,
  ROOT,
} from './parity-index-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write') };
};

const main = () => {
  const opts = parseArgs();
  const catalogPath = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const slots = catalog.capsuleSlots || [];

  const apps = {};
  slots.forEach((slot) => {
    if (slot === 'mainMenu' || slot === 'profile' || slot === 'checklist') return;
    const dims = BASELINE_DIMENSIONS[slot] || BASELINE_DIMENSIONS.default;
    const pi = computePiApp(dims);
    apps[slot] = {
      slot,
      label: slot,
      pi,
      status: parityStatus(pi),
      dimensions: dims,
      inventory: `interactions/linux-mint/${slot}.json`,
      vmDoc: fs.existsSync(path.join(ROOT, `root/docs/inventaires/linux-mint-${slot}-vm.md`))
        ? `linux-mint-${slot}-vm.md`
        : null,
    };
  });

  const shell = {};
  Object.entries(SHELL_BASELINE).forEach(([id, dims]) => {
    const pi = computePiApp(dims);
    shell[id] = { id, pi, status: parityStatus(pi), dimensions: dims };
  });

  const index = recomputeGlobal({
    registryId: 'linux-mint',
    version: 1,
    campaign: 'v2-deep-pass',
    description: 'Indice de parité interactionnelle — VM <lab-inventory:linux-mint>
    weights: { shell: 0.25, apps: 0.75 },
    thresholds: { ok: 90, partiel: 60 },
    shell,
    apps,
    catalog: {
      vmMenuEntries: catalog.vmAppCount || 101,
      capsuleSlots: slots.length,
    },
    updatedAt: new Date().toISOString(),
  });

  if (opts.write) {
    const out = saveParityIndex('linux-mint', index);
    console.log(`Écrit : ${out.replace(`${ROOT}/`, '')} — Π_global=${index.pi_global}`);
  } else {
    console.log(JSON.stringify({ pi_global: index.pi_global, appCount: Object.keys(apps).length }, null, 2));
  }
};

main();
