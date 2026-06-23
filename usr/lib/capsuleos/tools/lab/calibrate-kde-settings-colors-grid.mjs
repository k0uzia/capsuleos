#!/usr/bin/env node
/**
 * Voie B — alignement per-tuile colors-grid (scan position Capsule ↔ VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-colors-grid.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { letterboxCapsuleToVm, scaleNearest } from './kde-settings-visual-align.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const VM_PATH = path.join(
  ROOT,
  'root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes/colors-panel-vm.png',
);
const CAP_PATH = path.join(
  ROOT,
  'root/docs/inventaires/captures/linux-kde-neon/apps-visual-capsule/themes/colors-panel-capsule.png',
);
const SCHEME_DIR = path.join(
  ROOT,
  'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/scheme-previews',
);

const TILES = [
  { id: 'breeze-light', asset: 'scheme-breeze-light-vm.png', vmX: 174, row: 0 },
  { id: 'breeze-dark', asset: 'scheme-breeze-dark-vm.png', vmX: 390, row: 0 },
  { id: 'breeze-classic', asset: 'scheme-breeze-classic-vm.png', vmX: 606, row: 0 },
  { id: 'oxygen', asset: 'scheme-oxygen-vm.png', vmX: 822, row: 0 },
  { id: 'oxygen-cold', asset: 'scheme-oxygen-cold-vm.png', vmX: 174, row: 1 },
  { id: 'oxygen-dark', asset: 'scheme-oxygen-dark-vm.png', vmX: 390, row: 1 },
];

const ROW_Y = [267, 419];
const SCAN_X0 = 140;
const SCAN_X1 = 880;

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

const findBestX = (asset, cap, y) => {
  let best = { x: 0, phi: 0 };
  for (let x = SCAN_X0; x <= SCAN_X1; x += 1) {
    if (x + asset.width > cap.width) break;
    const phi = phiNorm(asset, crop(cap, { x, y, width: asset.width, height: asset.height }));
    if (phi > best.phi) best = { x, phi };
  }
  return best;
};

const main = () => {
  const vm = readPng(VM_PATH);
  const cap = letterboxCapsuleToVm(vm, readPng(CAP_PATH));
  const region = { x: 174, y: 267, width: 848, height: 120 };
  const regionPhi = phiNorm(crop(vm, region), crop(cap, region));

  console.log(`colors-grid region Φ_norm=${regionPhi}\n`);
  console.log('id\tvmX\tcapX\tΔx\tΦ@vm\tΦ@cap\tΦ@best');
  const rows = [];
  for (const tile of TILES) {
    const y = ROW_Y[tile.row];
    const asset = readPng(path.join(SCHEME_DIR, tile.asset));
    const atVm = phiNorm(asset, crop(cap, { x: tile.vmX, y, width: asset.width, height: asset.height }));
    const best = findBestX(asset, cap, y);
    const delta = best.x - tile.vmX;
    rows.push({ ...tile, y, capX: best.x, delta, phiVm: atVm, phiBest: best.phi });
    console.log(
      `${tile.id}\t${tile.vmX}\t${best.x}\t${delta >= 0 ? '+' : ''}${delta}\t${atVm}\t${atVm}\t${best.phi}`,
    );
  }

  const avgBest = rows.slice(0, 4).reduce((s, r) => s + r.phiBest, 0) / 4;
  console.log(`\nRow1 avg Φ@best=${avgBest.toFixed(1)}`);
  console.log('Suggested nth-child translateX (px):');
  rows.slice(0, 4).forEach((r, i) => {
    console.log(`  nth-child(${i + 1}): translateX(${r.delta}px)`);
  });
};

main();
