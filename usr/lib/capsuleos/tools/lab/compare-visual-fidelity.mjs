#!/usr/bin/env node
/**
 * Compare les paires de captures VM ↔ clone et calcule le score Φ par scène.
 * Contrat : etc/capsuleos/contracts/visual-scenes.json
 * Rapport : root/docs/inventaires/<registryId>-visual-fidelity.json
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-visual-fidelity.mjs --id linux-mint [--slot mintinstall] [--gate]
 *
 * Φ_scene = 100 × (1 − pixels divergents / pixels comparés), masques appliqués,
 * sur la zone commune centrée des deux captures.
 * Classification : match (Φ ≥ seuil ET géométrie ≤ 8 px), partial, mismatch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/visual-scenes.json');
const GEOMETRY_TOLERANCE_PX = 8;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', slot: null, gate: false };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--slot' && args[i + 1]) opts.slot = args[++i];
    else if (a === '--gate') opts.gate = true;
  }
  return opts;
};

const opts = parseArgs();
const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const registry = contract.registries[opts.id];
if (!registry) {
  console.error(`✗ registre ${opts.id} absent du contrat visual-scenes.json`);
  process.exit(1);
}
const capturesBase = path.join(
  ROOT,
  (contract.defaults.capturesDir || '').replace('<registryId>', opts.id),
);
const reportPath = path.join(
  ROOT,
  (contract.defaults.reportPath || '').replace('<registryId>', opts.id),
);

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

/** Recadre au centre sur width × height. */
function centerCrop(png, width, height) {
  const out = new PNG({ width, height });
  const ox = Math.floor((png.width - width) / 2);
  const oy = Math.floor((png.height - height) / 2);
  PNG.bitblt(png, out, ox, oy, width, height, 0, 0);
  return out;
}

/** Noircit les rectangles masqués (coordonnées relatives à la fenêtre). */
function applyMasks(png, masks) {
  for (const mask of masks || []) {
    const x0 = Math.max(0, mask.x);
    const y0 = Math.max(0, mask.y);
    const x1 = Math.min(png.width, mask.x + mask.w);
    const y1 = Math.min(png.height, mask.y + mask.h);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 255;
      }
    }
  }
  return png;
}

function maskedArea(masks, width, height) {
  let area = 0;
  for (const mask of masks || []) {
    const w = Math.max(0, Math.min(width, mask.x + mask.w) - Math.max(0, mask.x));
    const h = Math.max(0, Math.min(height, mask.y + mask.h) - Math.max(0, mask.y));
    area += w * h;
  }
  return area;
}

function classifyScene(phi, geometryOk, thresholds) {
  if (phi >= thresholds.match && geometryOk) return 'match';
  if (phi >= thresholds.partial) return 'partial';
  return 'mismatch';
}

function compareScene(slotId, slotSpec, scene) {
  const vmFile = path.join(capturesBase, slotId, 'vm', `${scene.id}.png`);
  const cloneFile = path.join(capturesBase, slotId, 'clone', `${scene.id}.png`);
  const entry = {
    id: scene.id,
    priority: scene.priority || 'P1',
    label: scene.label || scene.id,
    vmCapture: fs.existsSync(vmFile) ? path.relative(ROOT, vmFile) : null,
    cloneCapture: fs.existsSync(cloneFile) ? path.relative(ROOT, cloneFile) : null,
  };
  if (!entry.vmCapture || !entry.cloneCapture) {
    entry.classification = 'unmeasured';
    entry.note = !entry.vmCapture
      ? 'Capture VM absente — capture-scene-pair.mjs (ou dépôt manuel si vm.mode=manual)'
      : 'Capture clone absente — capture-scene-pair.mjs --clone-only';
    return entry;
  }

  const vmPng = readPng(vmFile);
  const clonePng = readPng(cloneFile);
  entry.geometry = {
    vm: { width: vmPng.width, height: vmPng.height },
    clone: { width: clonePng.width, height: clonePng.height },
    delta: {
      width: Math.abs(vmPng.width - clonePng.width),
      height: Math.abs(vmPng.height - clonePng.height),
    },
  };
  const geometryOk = entry.geometry.delta.width <= GEOMETRY_TOLERANCE_PX
    && entry.geometry.delta.height <= GEOMETRY_TOLERANCE_PX;

  const width = Math.min(vmPng.width, clonePng.width);
  const height = Math.min(vmPng.height, clonePng.height);
  const vmCrop = applyMasks(centerCrop(vmPng, width, height), scene.masks);
  const cloneCrop = applyMasks(centerCrop(clonePng, width, height), scene.masks);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(vmCrop.data, cloneCrop.data, diff.data, width, height, {
    threshold: contract.defaults.pixelmatchThreshold || 0.25,
  });
  const compared = width * height - maskedArea(scene.masks, width, height);
  const phi = compared > 0
    ? Math.round((1 - mismatched / compared) * 1000) / 10
    : 0;

  const diffDir = path.join(capturesBase, slotId, 'diff');
  fs.mkdirSync(diffDir, { recursive: true });
  const diffFile = path.join(diffDir, `${scene.id}.png`);
  fs.writeFileSync(diffFile, PNG.sync.write(diff));

  const thresholds = scene.thresholds || contract.defaults.thresholds;
  entry.phi = phi;
  entry.pixels = { compared, mismatched };
  entry.geometryOk = geometryOk;
  entry.diff = path.relative(ROOT, diffFile);
  entry.classification = classifyScene(phi, geometryOk, thresholds);
  entry.thresholds = thresholds;
  return entry;
}

const slots = opts.slot ? [opts.slot] : Object.keys(registry.slots || {});
const previous = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  : { registryId: opts.id, slots: {} };
const report = {
  registryId: opts.id,
  contract: 'etc/capsuleos/contracts/visual-scenes.json',
  updatedAt: new Date().toISOString(),
  slots: previous.slots || {},
};

let gateFailures = [];
for (const slotId of slots) {
  const slotSpec = registry.slots[slotId];
  if (!slotSpec) {
    console.error(`✗ slot ${slotId} absent du contrat pour ${opts.id}`);
    process.exit(1);
  }
  const scenes = (slotSpec.scenes || []).map((scene) => compareScene(slotId, slotSpec, scene));
  const p0 = scenes.filter((s) => s.priority === 'P0');
  const p0Measured = p0.filter((s) => typeof s.phi === 'number');
  const slotPhi = p0Measured.length
    ? Math.min(...p0Measured.map((s) => s.phi))
    : null;
  let slotClass = 'pending-phi';
  if (p0Measured.length === p0.length && p0.length > 0) {
    if (p0Measured.every((s) => s.classification === 'match')) slotClass = 'match';
    else if (p0Measured.every((s) => s.classification !== 'mismatch')) slotClass = 'partial';
    else slotClass = 'mismatch';
  }
  report.slots[slotId] = {
    phi: slotPhi,
    classification: slotClass,
    scenes,
    updatedAt: new Date().toISOString(),
  };
  p0.forEach((s) => {
    if (s.classification === 'mismatch' || s.classification === 'unmeasured') {
      gateFailures.push(`${slotId}/${s.id} : ${s.classification}`);
    }
  });
  const detail = scenes
    .map((s) => `${s.id}=${s.classification}${typeof s.phi === 'number' ? ` Φ=${s.phi}` : ''}`)
    .join(', ');
  console.log(`${slotClass === 'match' ? '✓' : slotClass === 'pending-phi' ? '○' : '⚠'} ${opts.id}/${slotId} — Φ=${slotPhi === null ? 'non mesuré' : slotPhi} [${detail}]`);
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Écrit ${path.relative(ROOT, reportPath)}`);

if (opts.gate && gateFailures.length) {
  console.error(`✗ compare-visual-fidelity gate — ${gateFailures.length} scène(s) P0 non conformes`);
  gateFailures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
}
process.exit(0);
