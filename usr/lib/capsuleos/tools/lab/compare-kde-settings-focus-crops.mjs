#!/usr/bin/env node
/**
 * Compare Φ par région focus — shots P0 Paramètres KDE (crops VM ↔ Capsule).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-kde-settings-focus-crops.mjs
 *   node usr/lib/capsuleos/tools/lab/compare-kde-settings-focus-crops.mjs --write
 *   node usr/lib/capsuleos/tools/lab/compare-kde-settings-focus-crops.mjs --shot colors-panel
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REGIONS_PATH = path.join(ROOT, 'root/tools/lab/kde-settings-visual-focus-regions.json');
const VM_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes');
const CAP_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual-capsule/themes');
const FOCUS_OUT = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual-focus');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { write: false, shot: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--shot' && args[i + 1]) opts.shot = args[++i];
  }
  return opts;
};

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));
const scaleNearest = (src, tw, th) => {
  const out = new PNG({ width: tw, height: th });
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const sx = Math.floor((x * src.width) / tw);
      const sy = Math.floor((y * src.height) / th);
      const si = (src.width * sy + sx) << 2;
      const di = (tw * y + x) << 2;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
};

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

const compareCrop = (vmPng, capPng, region) => {
  const vm = rectCrop(vmPng, region);
  const cap = rectCrop(capPng, region);
  const diff = new PNG({ width: region.width, height: region.height });
  const mm = pixelmatch(vm.data, cap.data, diff.data, region.width, region.height, { threshold: 0.2 });
  const phi = Math.round((1 - mm / (region.width * region.height)) * 1000) / 10;
  const vmNorm = scaleNearest(vm, 400, 300);
  const capNorm = scaleNearest(cap, 400, 300);
  const diffNorm = new PNG({ width: 400, height: 300 });
  const mmNorm = pixelmatch(vmNorm.data, capNorm.data, diffNorm.data, 400, 300, { threshold: 0.2 });
  const phiNormalized = Math.round((1 - mmNorm / (400 * 300)) * 1000) / 10;
  return { phi, phiNormalized, vm, cap, diff };
};

const main = () => {
  const opts = parseArgs();
  const cfg = JSON.parse(fs.readFileSync(REGIONS_PATH, 'utf8'));
  const shots = opts.shot ? [opts.shot] : Object.keys(cfg.shots);
  const results = [];
  const reportPath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-kde-settings-focus-parity.json');

  if (opts.write) fs.mkdirSync(FOCUS_OUT, { recursive: true });

  for (const shotId of shots) {
    const regions = cfg.shots[shotId] || [];
    const vmFile = path.join(VM_DIR, `${shotId}-vm.png`);
    const capFile = path.join(CAP_DIR, `${shotId}-capsule.png`);
    if (!fs.existsSync(vmFile) || !fs.existsSync(capFile)) {
      results.push({ shotId, status: 'missing-capture' });
      continue;
    }
    const vmBase = scaleNearest(flattenAlpha(readPng(vmFile)), cfg.geometry.width, cfg.geometry.height);
    const capBase = scaleNearest(readPng(capFile), cfg.geometry.width, cfg.geometry.height);
    const regionResults = [];

    for (const region of regions) {
      const scores = compareCrop(vmBase, capBase, region);
      const ok = scores.phiNormalized >= (region.phiThreshold || 90);
      regionResults.push({
        regionId: region.regionId,
        phi: scores.phi,
        phiNormalized: scores.phiNormalized,
        phiThreshold: region.phiThreshold || 90,
        ok,
      });
      if (opts.write) {
        const outBase = path.join(FOCUS_OUT, shotId, region.regionId);
        fs.mkdirSync(outBase, { recursive: true });
        fs.writeFileSync(path.join(outBase, `${region.regionId}-vm.png`), PNG.sync.write(scores.vm));
        fs.writeFileSync(path.join(outBase, `${region.regionId}-capsule.png`), PNG.sync.write(scores.cap));
        fs.writeFileSync(path.join(outBase, `${region.regionId}-diff.png`), PNG.sync.write(scores.diff));
      }
    }

    const minPhi = regionResults.length
      ? Math.min(...regionResults.map((r) => r.phiNormalized))
      : null;
    results.push({ shotId, minPhiNormalized: minPhi, regions: regionResults });
  }

  const payload = {
    registryId: cfg.registryId,
    comparedAt: new Date().toISOString(),
    focusOutDir: 'root/docs/inventaires/captures/linux-kde-neon/apps-visual-focus',
    results,
  };

  if (opts.write) {
    fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
  }

  console.log(JSON.stringify(payload, null, 2));
  const failing = results.flatMap((r) => (r.regions || [])
    .filter((reg) => !reg.ok)
    .map((reg) => `${r.shotId}/${reg.regionId} Φ_norm=${reg.phiNormalized}`));
  if (failing.length) {
    console.error(`\n⚠ ${failing.length} région(s) sous seuil`);
    failing.forEach((f) => console.error(`  • ${f}`));
    process.exit(1);
  }
  console.log('✓ compare-kde-settings-focus-crops OK');
};

main();
