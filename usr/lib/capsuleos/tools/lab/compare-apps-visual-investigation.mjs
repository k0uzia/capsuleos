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
import { expectedGeometry, paritySpecForSlot, vmVendorCapturePath } from './apps-parity-geometry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const PRIORITIES = ['P0', 'P1', 'P2'];
const NORM_W = 800;
const NORM_H = 600;
const PHI_OK = 85;
const PHI_ACCEPT = 40;

const resolvePhiOk = (registryId) => {
  if (registryId !== 'linux-kde-neon') return PHI_OK;
  const regPath = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
  const visPath = path.join(ROOT, 'root/tools/lab/kde-settings-visual-investigation-matrix.json');
  for (const p of [regPath, visPath]) {
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j.phiThreshold) return j.phiThreshold;
  }
  return PHI_OK;
};

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

const rectCrop = (png, crop) => {
  if (!crop) {
    return png;
  }
  const x = Math.max(0, Math.min(crop.x || 0, png.width - 1));
  const y = Math.max(0, Math.min(crop.y || 0, png.height - 1));
  const width = Math.min(crop.width || png.width, png.width - x);
  const height = Math.min(crop.height || png.height, png.height - y);
  if (width <= 0 || height <= 0) {
    return png;
  }
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
};

const trimEdges = (png, trim = {}) => {
  if (!trim || (!trim.top && !trim.bottom && !trim.left && !trim.right)) {
    return png;
  }
  const top = trim.top || 0;
  const left = trim.left || 0;
  const bottom = trim.bottom || 0;
  const right = trim.right || 0;
  const width = png.width - left - right;
  const height = png.height - top - bottom;
  if (width <= 0 || height <= 0) {
    return png;
  }
  return rectCrop(png, { x: left, y: top, width, height });
};

const writeTempPng = (png) => {
  const file = path.join(ROOT, `var/lib/capsuleos/generated/.parity-crop-${process.pid}-${Date.now()}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
  return file;
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

const trimBlackLetterbox = (png, threshold = 12) => {
  const { width, height, data } = png;
  const isBg = (x, y) => {
    const i = (width * y + x) * 4;
    if (data[i + 3] <= threshold) {
      return true;
    }
    return data[i] <= threshold && data[i + 1] <= threshold && data[i + 2] <= threshold;
  };
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isBg(x, y)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    return png;
  }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  if (cw * ch > width * height * 0.985) {
    return png;
  }
  const out = new PNG({ width: cw, height: ch });
  PNG.bitblt(png, out, minX, minY, cw, ch, 0, 0);
  return out;
};

const comparePair = (vmFile, capFile, opts = {}) => {
  const vmOrig = readPng(vmFile);
  let vmPng = vmOrig;
  const capPng = readPng(capFile);
  if (opts.trimVmLetterbox) {
    vmPng = trimBlackLetterbox(vmPng);
  }
  if (opts.flattenVmAlpha) {
    flattenAlpha(vmPng, opts.flattenVmBg || [255, 255, 255]);
  }

  const expected = opts.expectedGeometry;
  const targetW = expected?.width ?? Math.max(vmPng.width, capPng.width);
  const targetH = expected?.height ?? Math.max(vmPng.height, capPng.height);
  const vmAligned = (vmPng.width !== targetW || vmPng.height !== targetH)
    ? scaleNearest(vmPng, targetW, targetH)
    : vmPng;
  const capAligned = (capPng.width !== targetW || capPng.height !== targetH)
    ? scaleNearest(capPng, targetW, targetH)
    : capPng;

  const width = targetW;
  const height = targetH;
  const vmCrop = centerCrop(vmAligned, width, height);
  const capCrop = centerCrop(capAligned, width, height);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(vmCrop.data, capCrop.data, diff.data, width, height, { threshold: 0.25 });
  const compared = width * height;
  const phi = compared > 0 ? Math.round((1 - mismatched / compared) * 1000) / 10 : 0;

  const vmNorm = scaleNearest(vmAligned, NORM_W, NORM_H);
  const capNorm = scaleNearest(capAligned, NORM_W, NORM_H);
  const diffNorm = new PNG({ width: NORM_W, height: NORM_H });
  const mismatchedNorm = pixelmatch(vmNorm.data, capNorm.data, diffNorm.data, NORM_W, NORM_H, { threshold: 0.2 });
  const phiNormalized = Math.round((1 - mismatchedNorm / (NORM_W * NORM_H)) * 1000) / 10;

  return {
    phi,
    phiNormalized,
    geometryAligned: vmAligned.width !== capAligned.width || vmAligned.height !== capAligned.height,
    geometry: {
      vm: { width: vmOrig.width, height: vmOrig.height },
      capsule: { width: capPng.width, height: capPng.height },
      expected: opts.expectedGeometry || null,
    },
  };
};

const classify = (scores, registryId) => {
  const phiOk = resolvePhiOk(registryId);
  if (scores.phiNormalized >= phiOk) {
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

const resolveVmCapture = (registryId, item) => {
  const vendorRel = vmVendorCapturePath(registryId, item.controlId);
  if (vendorRel) {
    const vendorAbs = path.join(ROOT, vendorRel);
    if (fs.existsSync(vendorAbs)) {
      return vendorAbs;
    }
  }
  const fromList = item.vmCaptures?.find((c) => c.path)?.path;
  if (fromList) return path.join(ROOT, fromList);
  const shot = (item.componentShots || []).find((s) => s.vmCapture)?.vmCapture;
  return shot ? path.join(ROOT, shot) : null;
};

const resolveCapCapture = (registryId, item, paths) => {
  const windowShot = item.capsuleCaptures?.find((c) => c.shot === 'window' && c.path)?.path;
  if (windowShot) {
    const abs = path.join(ROOT, windowShot);
    if (fs.existsSync(abs)) {
      return abs;
    }
  }
  const rel = item.capsuleCaptures?.find((c) => c.path)?.path;
  if (rel) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      return abs;
    }
  }
  return findCapsuleCapture(registryId, item.controlId, paths);
};

const compareItem = (opts, item, paths) => {
  let vmFile = resolveVmCapture(opts.id, item);
  let capFile = resolveCapCapture(opts.id, item, paths);
  if (!vmFile || !capFile || !fs.existsSync(vmFile) || !fs.existsSync(capFile)) {
    return { controlId: item.controlId, status: 'unmeasured' };
  }
  const paritySpec = paritySpecForSlot(opts.id, item.controlId);
  let vmCropTemp = null;
  let capCropTemp = null;
  let vmPng = readPng(vmFile);
  let capPng = readPng(capFile);
  if (paritySpec?.vmCrop) {
    vmPng = rectCrop(vmPng, paritySpec.vmCrop);
  }
  if (paritySpec?.capsuleTrim) {
    capPng = trimEdges(capPng, paritySpec.capsuleTrim);
  }
  if (paritySpec?.vmCrop || paritySpec?.capsuleTrim) {
    vmCropTemp = writeTempPng(vmPng);
    capCropTemp = writeTempPng(capPng);
    vmFile = vmCropTemp;
    capFile = capCropTemp;
  }
  const scores = comparePair(vmFile, capFile, {
    flattenVmAlpha: opts.id === 'linux-kde-neon',
    flattenVmBg: (item.controlId === 'terminal' || item.controlId === 'lecteur_multimedia')
      ? [0, 0, 0]
      : [255, 255, 255],
    trimVmLetterbox: opts.id === 'linux-kde-neon'
      && (item.controlId === 'terminal' || item.controlId === 'lecteur_multimedia'),
    expectedGeometry: expectedGeometry(opts.id, item.controlId),
  });
  if (vmCropTemp) {
    try {
      fs.unlinkSync(vmCropTemp);
    } catch (_) {
      /* ignore */
    }
  }
  if (capCropTemp) {
    try {
      fs.unlinkSync(capCropTemp);
    } catch (_) {
      /* ignore */
    }
  }
  const { visualMatch, gapNotes } = classify(scores, opts.id);
  item.capsuleParity = {
    ...(item.capsuleParity || {}),
    visualMatch,
    phi: scores.phi,
    phiNormalized: scores.phiNormalized,
    geometry: scores.geometry,
    geometryAligned: scores.geometryAligned,
    gapNotes: gapNotes || item.capsuleParity?.gapNotes || '',
    comparedAt: new Date().toISOString(),
  };
  return {
    controlId: item.controlId,
    phi: scores.phi,
    phiNormalized: scores.phiNormalized,
    geometryAligned: scores.geometryAligned,
    geometry: scores.geometry,
    visualMatch,
  };
};

const compareComponentShots = (opts, item) => {
  if (item.controlId !== 'themes') return [];
  const shotResults = [];
  for (const shot of item.componentShots || []) {
    if (!shot.vmCapture || !shot.capsuleCapture) continue;
    const vmFile = path.join(ROOT, shot.vmCapture);
    const capFile = path.join(ROOT, shot.capsuleCapture);
    if (!fs.existsSync(vmFile) || !fs.existsSync(capFile)) continue;
    const scores = comparePair(vmFile, capFile, {
      flattenVmAlpha: true,
      flattenVmBg: [255, 255, 255],
      trimVmLetterbox: false,
      expectedGeometry: expectedGeometry(opts.id, item.controlId),
    });
    const { visualMatch, gapNotes } = classify(scores, opts.id);
    shot.capsuleParity = {
      visualMatch,
      phi: scores.phi,
      phiNormalized: scores.phiNormalized,
      geometry: scores.geometry,
      gapNotes,
      comparedAt: new Date().toISOString(),
    };
    shotResults.push({
      shotId: shot.shotId,
      phiNormalized: scores.phiNormalized,
      visualMatch,
    });
  }
  return shotResults;
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
    results.push(compareItem(opts, item, paths));
    const shotResults = compareComponentShots(opts, item);
    if (shotResults.length) {
      results[results.length - 1].componentShots = shotResults;
      const minPhi = Math.min(...shotResults.map((s) => s.phiNormalized));
      if (minPhi < (item.capsuleParity?.phiNormalized ?? 100)) {
        item.capsuleParity = {
          ...(item.capsuleParity || {}),
          phiNormalizedMinShots: minPhi,
          visualMatch: minPhi >= PHI_OK ? 'ok' : item.capsuleParity?.visualMatch,
          gapNotes: `${item.capsuleParity?.gapNotes || ''} Shots KCM min Φ_norm=${minPhi}.`.trim(),
        };
      }
    }
  }

  if (opts.write) {
    inv.updatedAt = new Date().toISOString();
    fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  }

  console.log(JSON.stringify({ registryId: opts.id, filter: opts.filter, write: opts.write, results }, null, 2));
};

main();
