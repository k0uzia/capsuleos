#!/usr/bin/env node
/**
 * Passe VΣ — burst Capsule (smokes shell) + mise à jour matrice linux-mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const SMOKES = [
  { surface: 'shell.tray.network', script: null, manual: 'mint-tray popover network' },
  { surface: 'shell.tray.volume', script: 'smoke-mint-tray.mjs', key: 'volume' },
  { surface: 'shell.panel.menu', script: 'smoke-mint-nemo.mjs', key: 'menu' },
];

const parseArgs = () => {
  const opts = { id: 'linux-mint', write: false };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const runSmoke = (name) => {
  const script = path.join(__dirname, name);
  if (!fs.existsSync(script)) {
    return { ok: false, note: 'script absent' };
  }
  const res = spawnSync('node', [script], { encoding: 'utf8', timeout: 120000 });
  return { ok: res.status === 0, note: res.status === 0 ? 'smoke OK' : (res.stderr || res.stdout || '').slice(0, 120) };
};

const main = () => {
  const opts = parseArgs();
  const matrixPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-ui-state-effects-matrix.json`);
  if (!fs.existsSync(matrixPath)) {
    console.error(`Matrice absente : ${matrixPath}`);
    process.exit(1);
  }
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const traySmoke = runSmoke('smoke-mint-tray.mjs');
  const menuOk = runSmoke('smoke-mint-interaction.mjs');

  const results = [];
  (matrix.surfaces || []).forEach((surface) => {
    let capsuleMatch = 'unknown';
    if (surface.id.indexOf('tray') !== -1 && traySmoke.ok) {
      capsuleMatch = 'partial';
    }
    if (surface.id === 'shell.panel.menu' && menuOk.ok) {
      capsuleMatch = 'partial';
    }
    if (surface.id === 'shell.panel.grouped-window-list') {
      capsuleMatch = menuOk.ok ? 'partial' : 'unknown';
    }
    if (surface.id === 'shell.window.muffin' || surface.id === 'shell.alt-tab') {
      capsuleMatch = menuOk.ok ? 'partial' : 'unknown';
    }
    results.push({ id: surface.id, capsuleMatch });
    surface.capsuleMatch = capsuleMatch;
    surface.vmBurstAt = new Date().toISOString();
  });

  matrix.predicates.Ve = traySmoke.ok;
  matrix.predicates.Vmu = traySmoke.ok && menuOk.ok;
  matrix.predicates.VSigma = traySmoke.ok && menuOk.ok;
  matrix.generatedAt = new Date().toISOString();
  matrix.burst = { tray: traySmoke, interaction: menuOk, results };

  if (opts.write) {
    fs.writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
    process.stdout.write(`OK ${matrixPath}\n`);
  }

  process.stdout.write(`${JSON.stringify({ id: opts.id, traySmoke, menuOk, results }, null, 2)}\n`);
  process.exit(traySmoke.ok && menuOk.ok ? 0 : 1);
};

main();
