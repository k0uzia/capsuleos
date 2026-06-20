#!/usr/bin/env node
/**
 * Mesure Δy optimal Capsule↔VM par région focus (scan vertical ±N px).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-focus-offset.mjs
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-focus-offset.mjs --shot appearance-panel --region theme-grid
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { letterboxCapsuleToVm, scaleNearest } from './kde-settings-visual-align.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REGIONS_PATH = path.join(ROOT, 'root/tools/lab/kde-settings-visual-focus-regions.json');
const VM_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes');
const CAP_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual-capsule/themes');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { shot: null, region: null, range: 48 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--shot' && args[i + 1]) opts.shot = args[++i];
    else if (args[i] === '--region' && args[i + 1]) opts.region = args[++i];
    else if (args[i] === '--range' && args[i + 1]) opts.range = Number(args[++i]);
  }
  return opts;
};

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));

const flattenAlpha = (png) => {
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    if (a >= 0.999) continue;
    png.data[i] = Math.round(png.data[i] * a + 255 * (1 - a));
    png.data[i + 1] = Math.round(png.data[i + 1] * a + 255 * (1 - a));
    png.data[i + 2] = Math.round(png.data[i + 2] * a + 255 * (1 - a));
    png.data[i + 3] = 255;
  }
  return png;
};

const rectCrop = (png, { x, y, width, height }) => {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
};

const shiftCapVertically = (capPng, dy) => {
  const out = new PNG({ width: capPng.width, height: capPng.height });
  out.data.fill(0);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255;
  const sy0 = Math.max(0, dy);
  const sy1 = Math.min(capPng.height, capPng.height + dy);
  const dy0 = Math.max(0, -dy);
  const h = sy1 - sy0;
  if (h <= 0) return out;
  PNG.bitblt(capPng, out, 0, sy0, capPng.width, h, 0, dy0);
  return out;
};

const phiNorm = (vm, cap) => {
  const vmNorm = scaleNearest(vm, 400, 300);
  const capNorm = scaleNearest(cap, 400, 300);
  const diffNorm = new PNG({ width: 400, height: 300 });
  const mm = pixelmatch(vmNorm.data, capNorm.data, diffNorm.data, 400, 300, { threshold: 0.2 });
  return Math.round((1 - mm / (400 * 300)) * 1000) / 10;
};

const scanRegion = (vmBase, capBase, region, range) => {
  const vmCrop = rectCrop(vmBase, region);
  let best = { dy: 0, phi: phiNorm(vmCrop, rectCrop(capBase, region)) };
  for (let dy = -range; dy <= range; dy += 1) {
    if (dy === 0) continue;
    const shifted = shiftCapVertically(capBase, dy);
    const capCrop = rectCrop(shifted, region);
    const phi = phiNorm(vmCrop, capCrop);
    if (phi > best.phi) best = { dy, phi };
  }
  return best;
};

const main = () => {
  const opts = parseArgs();
  const cfg = JSON.parse(fs.readFileSync(REGIONS_PATH, 'utf8'));
  const shots = opts.shot ? [opts.shot] : Object.keys(cfg.shots);
  const rows = [];

  for (const shotId of shots) {
    const vmFile = path.join(VM_DIR, `${shotId}-vm.png`);
    const capFile = path.join(CAP_DIR, `${shotId}-capsule.png`);
    if (!fs.existsSync(vmFile) || !fs.existsSync(capFile)) continue;

    const vmBase = scaleNearest(flattenAlpha(readPng(vmFile)), cfg.geometry.width, cfg.geometry.height);
    const capRaw = scaleNearest(readPng(capFile), cfg.geometry.width, cfg.geometry.height);
    const capBase = flattenAlpha(letterboxCapsuleToVm(vmBase, capRaw));

    for (const region of cfg.shots[shotId] || []) {
      if (opts.region && region.regionId !== opts.region) continue;
      const best = scanRegion(vmBase, capBase, region, opts.range);
      rows.push({
        shotId,
        regionId: region.regionId,
        phiAt0: scanRegion(vmBase, capBase, region, 0).phi,
        bestDyPx: best.dy,
        bestPhi: best.phi,
        cssMarginHintRem: Math.round((best.dy / 16) * 100) / 100,
      });
    }
  }

  console.log(JSON.stringify({ calibratedAt: new Date().toISOString(), rows }, null, 2));
};

main();
