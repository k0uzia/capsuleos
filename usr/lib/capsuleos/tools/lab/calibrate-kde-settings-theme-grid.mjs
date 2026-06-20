#!/usr/bin/env node
/**
 * Voie B — alignement tuiles theme-grid LnF + hub previews (scan position Capsule ↔ VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-theme-grid.mjs
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-theme-grid.mjs --shot appearance-panel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { letterboxCapsuleToVm, scaleNearest } from './kde-settings-visual-align.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const THEME_DIR = path.join(
  ROOT,
  'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/theme-previews',
);
const VM_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes');
const CAP_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual-capsule/themes');

const SHOTS = {
  'appearance-panel': {
    vmFile: 'appearance-panel-vm.png',
    capFile: 'appearance-panel-capsule.png',
    tiles: [
      { id: 'breeze', asset: 'appearance-breeze-vm.png', vmX: 171, y: 228 },
      { id: 'twilight', asset: 'appearance-twilight-vm.png', vmX: 387, y: 228 },
      { id: 'dark', asset: 'appearance-dark-vm.png', vmX: 603, y: 228 },
      { id: 'oxygen', asset: 'appearance-oxygen-vm.png', vmX: 819, y: 228 },
    ],
    region: { x: 163, y: 228, width: 864, height: 130 },
  },
  'hub-sidebar': {
    vmFile: 'hub-sidebar-vm.png',
    capFile: 'hub-sidebar-capsule.png',
    tiles: [
      { id: 'hub-breeze', asset: 'hub-breeze-vm.png', vmX: 210, y: 110 },
      { id: 'hub-dark', asset: 'hub-dark-vm.png', vmX: 490, y: 110 },
      { id: 'hub-auto', asset: 'hub-auto-vm.png', vmX: 770, y: 110 },
    ],
    region: { x: 210, y: 110, width: 820, height: 140 },
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  let shot = null;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--shot' && args[i + 1]) shot = args[++i];
  }
  return { shot };
};

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));

const crop = (png, { x, y, width, height }) => {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
};

const phiNorm = (a, b) => {
  const vn = scaleNearest(a, 400, 300);
  const cn = scaleNearest(b, 400, 300);
  const diff = new PNG({ width: 400, height: 300 });
  const mm = pixelmatch(vn.data, cn.data, diff.data, 400, 300, { threshold: 0.2 });
  return Math.round((1 - mm / (400 * 300)) * 1000) / 10;
};

const findBestX = (asset, cap, y, x0 = 140, x1 = 880) => {
  let best = { x: 0, phi: 0 };
  for (let x = x0; x <= x1; x += 1) {
    if (x + asset.width > cap.width) break;
    const phi = phiNorm(asset, crop(cap, { x, y, width: asset.width, height: asset.height }));
    if (phi > best.phi) best = { x, phi };
  }
  return best;
};

const runShot = (shotId, cfg) => {
  const vm = readPng(path.join(VM_DIR, cfg.vmFile));
  const cap = letterboxCapsuleToVm(vm, readPng(path.join(CAP_DIR, cfg.capFile)));
  const regionPhi = phiNorm(crop(vm, cfg.region), crop(cap, cfg.region));
  console.log(`\n## ${shotId} region Φ_norm=${regionPhi}\n`);
  console.log('id\tvmX\tcapX\tΔx\tΦ@vm\tΦ@best');
  for (const tile of cfg.tiles) {
    const asset = readPng(path.join(THEME_DIR, tile.asset));
    const atVm = phiNorm(
      asset,
      crop(cap, { x: tile.vmX, y: tile.y, width: asset.width, height: asset.height }),
    );
    const best = findBestX(asset, cap, tile.y);
    const delta = best.x - tile.vmX;
    console.log(
      `${tile.id}\t${tile.vmX}\t${best.x}\t${delta >= 0 ? '+' : ''}${delta}\t${atVm}\t${best.phi}`,
    );
  }
};

const main = () => {
  const { shot } = parseArgs();
  const ids = shot ? [shot] : Object.keys(SHOTS);
  console.log(`calibrate-kde-settings-theme-grid — ${ids.join(', ')}`);
  ids.forEach((id) => runShot(id, SHOTS[id]));
};

main();
