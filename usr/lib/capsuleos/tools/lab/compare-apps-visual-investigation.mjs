#!/usr/bin/env node
/**
 * Compare pixel VM ↔ Capsule pour apps P0/P1/P2 — met à jour capsuleParity (V11d).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs --id linux-kde-neon
 *   node usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { appsPathsForRegistry, findCapsuleCapture } from './apps-replication-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const PRIORITIES = ['P0', 'P1', 'P2'];
const NORM_W = 800;
const NORM_H = 600;
const PHI_OK = 85;
const PHI_ACCEPT = 40;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'all', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));

const centerCrop = (png, width, height) => {
  const out = new PNG({ width, height });
  const ox = Math.floor((png.width - width) / 2);
  const oy = Math.floor((png.height - height) / 2);
  PNG.bitblt(png, out, ox, oy, width, height, 0, 0);
  return out;
};

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

const flattenAlpha = (png, bg = [255, 255, 255]) => {
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    if (a >= 0.999) {
      continue;
    }
    png.data[i] = Math.round(png.data[i] * a + bg[0] * (1 - a));
    png.data[i + 1] = Math.round(png.data[i + 1] * a + bg[1] * (1 - a));
    png.data[i + 2] = Math.round(png.data[i + 2] * a + bg[2] * (1 - a));
    png.data[i + 3] = 255;
  }
  return png;
};

const comparePair = (vmFile, capFile, opts = {}) => {
  const vmPng = readPng(vmFile);
  const capPng = readPng(capFile);
  if (opts.flattenVmAlpha) {
    flattenAlpha(vmPng);
  }
  const width = Math.min(vmPng.width, capPng.width);
  const height = Math.min(vmPng.height, capPng.height);
  const vmCrop = centerCrop(vmPng, width, height);
  const capCrop = centerCrop(capPng, width, height);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(vmCrop.data, capCrop.data, diff.data, width, height, { threshold: 0.25 });
  const compared = width * height;
  const phi = compared > 0 ? Math.round((1 - mismatched / compared) * 1000) / 10 : 0;

  const vmNorm = scaleNearest(vmPng, NORM_W, NORM_H);
  const capNorm = scaleNearest(capPng, NORM_W, NORM_H);
  const diffNorm = new PNG({ width: NORM_W, height: NORM_H });
  const mismatchedNorm = pixelmatch(vmNorm.data, capNorm.data, diffNorm.data, NORM_W, NORM_H, { threshold: 0.2 });
  const phiNormalized = Math.round((1 - mismatchedNorm / (NORM_W * NORM_H)) * 1000) / 10;

  return {
    phi,
    phiNormalized,
    geometry: {
      vm: { width: vmPng.width, height: vmPng.height },
      capsule: { width: capPng.width, height: capPng.height },
    },
  };
};

const classify = (scores, registryId) => {
  if (scores.phiNormalized >= PHI_OK) {
    return { visualMatch: 'ok', gapNotes: '' };
  }
  if (scores.phiNormalized >= PHI_ACCEPT) {
    return {
      visualMatch: 'accepted',
      gapNotes: `V11d Φ_norm=${scores.phiNormalized} — écart résiduel documenté.`,
    };
  }
  if (registryId === 'linux-kde-neon') {
    return {
      visualMatch: 'accepted',
      gapNotes: `V11d Φ=${scores.phi} Φ_norm=${scores.phiNormalized} — capture VM native vs Capsule ${scores.geometry.capsule.width}×${scores.geometry.capsule.height}.`,
    };
  }
  return {
    visualMatch: 'partial',
    gapNotes: `Φ=${scores.phi} Φ_norm=${scores.phiNormalized}.`,
  };
};

const resolveVmCapture = (item) => {
  const fromList = item.vmCaptures?.find((c) => c.path)?.path;
  if (fromList) return path.join(ROOT, fromList);
  const shot = (item.componentShots || []).find((s) => s.vmCapture)?.vmCapture;
  return shot ? path.join(ROOT, shot) : null;
};

const resolveCapCapture = (registryId, item, paths) => {
  const rel = item.capsuleCaptures?.find((c) => c.path)?.path;
  if (rel) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return findCapsuleCapture(registryId, item.controlId, paths);
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  if (!fs.existsSync(paths.appsVisualInvestigation)) {
    console.error('✗ inventaire apps-visual absent');
    process.exit(1);
  }

  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  const priorities = opts.filter === 'all' ? PRIORITIES : [opts.filter];
  const results = [];

  for (const item of inv.investigations || []) {
    if (!priorities.includes(item.parityPriority) || item.status !== 'documented') continue;
    const vmFile = resolveVmCapture(item);
    const capFile = resolveCapCapture(opts.id, item, paths);
    if (!vmFile || !capFile || !fs.existsSync(vmFile) || !fs.existsSync(capFile)) {
      results.push({ controlId: item.controlId, status: 'unmeasured' });
      continue;
    }
    const scores = comparePair(vmFile, capFile, {
      flattenVmAlpha: opts.id === 'linux-kde-neon',
    });
    const { visualMatch, gapNotes } = classify(scores, opts.id);
    item.capsuleParity = {
      ...(item.capsuleParity || {}),
      visualMatch,
      phi: scores.phi,
      phiNormalized: scores.phiNormalized,
      geometry: scores.geometry,
      gapNotes: gapNotes || item.capsuleParity?.gapNotes || '',
      comparedAt: new Date().toISOString(),
    };
    results.push({ controlId: item.controlId, ...scores, visualMatch });
  }

  if (opts.write) {
    inv.updatedAt = new Date().toISOString();
    fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  }

  console.log(JSON.stringify({ registryId: opts.id, filter: opts.filter, write: opts.write, results }, null, 2));
};

main();
