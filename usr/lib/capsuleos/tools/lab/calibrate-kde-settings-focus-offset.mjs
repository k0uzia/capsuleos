#!/usr/bin/env node
/**
 * Mesure Δx/Δy optimal Capsule↔VM par région focus.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-focus-offset.mjs
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-focus-offset.mjs --shot appearance-panel --region theme-grid
 *   node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-focus-offset.mjs --2d --shot hub-sidebar --region sidebar --step 2 --pause-ms 5
 *
 * Scan 2D (--2d) : décalage sur le crop région uniquement (pas de PNG plein cadre) — RAM ~fixe.
 * Limiter le heap Node : NODE_OPTIONS='--max-old-space-size=14336' (14 GiB).
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
  const opts = {
    shot: null,
    region: null,
    range: 48,
    rangeX: 20,
    step: 1,
    twoD: false,
    pauseMs: 0,
    gcEvery: 200,
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--shot' && args[i + 1]) opts.shot = args[++i];
    else if (args[i] === '--region' && args[i + 1]) opts.region = args[++i];
    else if (args[i] === '--range' && args[i + 1]) opts.range = Number(args[++i]);
    else if (args[i] === '--range-x' && args[i + 1]) opts.rangeX = Number(args[++i]);
    else if (args[i] === '--step' && args[i + 1]) opts.step = Math.max(1, Number(args[++i]));
    else if (args[i] === '--pause-ms' && args[i + 1]) opts.pauseMs = Math.max(0, Number(args[++i]));
    else if (args[i] === '--gc-every' && args[i + 1]) opts.gcEvery = Math.max(1, Number(args[++i]));
    else if (args[i] === '--2d') opts.twoD = true;
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

/** Crop région avec décalage (dx, dy) — une seule tuile ~122×680, pas la frame entière. */
const shiftCropFromBase = (capBase, region, dx, dy, reuse) => {
  const out = reuse || new PNG({ width: region.width, height: region.height });
  const d = out.data;
  const src = capBase.data;
  const sw = capBase.width;
  const sh = capBase.height;
  for (let row = 0; row < region.height; row += 1) {
    const srcY = region.y + row - dy;
    for (let col = 0; col < region.width; col += 1) {
      const srcX = region.x + col - dx;
      const di = (row * region.width + col) * 4;
      if (srcX < 0 || srcY < 0 || srcX >= sw || srcY >= sh) {
        d[di] = 255;
        d[di + 1] = 255;
        d[di + 2] = 255;
        d[di + 3] = 255;
      } else {
        const si = (srcY * sw + srcX) * 4;
        d[di] = src[si];
        d[di + 1] = src[si + 1];
        d[di + 2] = src[si + 2];
        d[di + 3] = src[si + 3];
      }
    }
  }
  return out;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const maybeGc = (global, every, count) => {
  if (every > 0 && count > 0 && count % every === 0 && typeof global.gc === 'function') {
    global.gc();
  }
};

const phiNorm = (vm, cap) => {
  const vmNorm = scaleNearest(vm, 400, 300);
  const capNorm = scaleNearest(cap, 400, 300);
  const diffNorm = new PNG({ width: 400, height: 300 });
  const mm = pixelmatch(vmNorm.data, capNorm.data, diffNorm.data, 400, 300, { threshold: 0.2 });
  return Math.round((1 - mm / (400 * 300)) * 1000) / 10;
};

const scanRegion = (vmBase, capBase, region, range, step) => {
  const vmCrop = rectCrop(vmBase, region);
  let best = { dy: 0, phi: phiNorm(vmCrop, rectCrop(capBase, region)) };
  for (let dy = -range; dy <= range; dy += step) {
    if (dy === 0) continue;
    const shifted = shiftCapVertically(capBase, dy);
    const capCrop = rectCrop(shifted, region);
    const phi = phiNorm(vmCrop, capCrop);
    if (phi > best.phi) best = { dy, phi };
  }
  return best;
};

const scanRegion2d = async (vmBase, capBase, region, rangeY, rangeX, step, pauseMs, gcEvery) => {
  const vmCrop = rectCrop(vmBase, region);
  const capCrop0 = rectCrop(capBase, region);
  let best = { dx: 0, dy: 0, phi: phiNorm(vmCrop, capCrop0) };
  const reuse = new PNG({ width: region.width, height: region.height });
  let iter = 0;
  for (let dy = -rangeY; dy <= rangeY; dy += step) {
    for (let dx = -rangeX; dx <= rangeX; dx += step) {
      if (dx === 0 && dy === 0) continue;
      iter += 1;
      const capCrop = shiftCropFromBase(capBase, region, dx, dy, reuse);
      const phi = phiNorm(vmCrop, capCrop);
      if (phi > best.phi) best = { dx, dy, phi };
      maybeGc(globalThis, gcEvery, iter);
      if (pauseMs > 0 && iter % 50 === 0) await sleep(pauseMs);
    }
  }
  return { ...best, iterations: iter };
};

const main = async () => {
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
      const vmCrop = rectCrop(vmBase, region);
      const capCrop = rectCrop(capBase, region);
      if (opts.twoD) {
        const best = await scanRegion2d(
          vmBase,
          capBase,
          region,
          opts.range,
          opts.rangeX,
          opts.step,
          opts.pauseMs,
          opts.gcEvery,
        );
        rows.push({
          shotId,
          regionId: region.regionId,
          phiAt0: phiNorm(vmCrop, capCrop),
          bestDxPx: best.dx,
          bestDyPx: best.dy,
          bestPhi: best.phi,
          iterations: best.iterations,
          cssMarginHintRem: Math.round((best.dy / 16) * 100) / 100,
          cssMarginLeftHintRem: Math.round((best.dx / 16) * 100) / 100,
        });
      } else {
        const best = scanRegion(vmBase, capBase, region, opts.range, opts.step);
        rows.push({
          shotId,
          regionId: region.regionId,
          phiAt0: phiNorm(vmCrop, capCrop),
          bestDyPx: best.dy,
          bestPhi: best.phi,
          cssMarginHintRem: Math.round((best.dy / 16) * 100) / 100,
        });
      }
    }
  }

  console.log(JSON.stringify({ calibratedAt: new Date().toISOString(), rows }, null, 2));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
