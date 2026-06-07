#!/usr/bin/env node
/**
 * Gate normalisation médias web — spec prepare-web-media.
 * Usage : node usr/lib/capsuleos/tools/validate-web-media-prepare.mjs [--strict]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/web-media-prepare.json');
const STRICT = process.argv.includes('--strict');

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const errors = [];
const warnings = [];
let webpCount = 0;
let sidecarCount = 0;

function walk(dir, fn) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, fn);
      continue;
    }
    fn(full, name);
  }
}

if (contract.gates.jxlRequiresWebpSibling) {
  walk(path.join(ASSETS, 'images/vendors'), (full, name) => {
    if (!name.endsWith('.jxl')) {
      return;
    }
    const webp = full.replace(/\.jxl$/i, '.webp');
    if (!fs.existsSync(webp)) {
      errors.push(`JXL sans WebP : ${path.relative(ROOT, full)}`);
    }
  });
}

const panelGateVendors = contract.gates.panelRasterRequiresWebpSibling?.vendors;
if (panelGateVendors?.length) {
  walk(path.join(ASSETS, 'images/vendors'), (full) => {
    const rel = path.relative(ASSETS, full).split(path.sep).join('/');
    const m = rel.match(/^images\/vendors\/([^/]+)\/panel\/[^/]+\.(png|ico|gif)$/i);
    if (!m || !panelGateVendors.includes(m[1])) {
      return;
    }
    const webp = full.replace(/\.(png|ico|gif)$/i, '.webp');
    if (!fs.existsSync(webp)) {
      errors.push(`Panel raster sans WebP : ${path.relative(ROOT, full)}`);
    }
  });
}

walk(ASSETS, (full, name) => {
  if (!name.endsWith('.webp')) {
    return;
  }
  webpCount += 1;
  const scPath = `${full}.json`;
  if (!fs.existsSync(scPath)) {
    if (contract.gates.sidecarRequiredForTranscoded) {
      warnings.push(`WebP sans sidecar : ${path.relative(ROOT, full)}`);
    }
    return;
  }
  sidecarCount += 1;
  let sc;
  try {
    sc = JSON.parse(fs.readFileSync(scPath, 'utf8'));
  } catch {
    errors.push(`Sidecar JSON invalide : ${path.relative(ROOT, scPath)}`);
    return;
  }

  if (sc.source) {
    const srcPath = path.join(ASSETS, sc.source);
    if (fs.existsSync(srcPath)) {
      const hash = sha256(srcPath);
      if (sc.sourceSha256 && sc.sourceSha256 !== hash) {
        errors.push(`Drift source : ${sc.source} (sidecar ${path.relative(ROOT, scPath)})`);
      }
    }
  }

  const outHash = sha256(full);
  if (sc.outputSha256 && sc.outputSha256 !== outHash) {
    errors.push(`Drift output : ${path.relative(ROOT, full)}`);
  }
});

if (warnings.length && STRICT) {
  errors.push(...warnings.map((w) => `[strict] ${w}`));
}

if (errors.length) {
  console.error(`\n✗ validate-web-media-prepare : ${errors.length} problème(s)`);
  errors.slice(0, 30).forEach((e) => console.error(`  ✗ ${e}`));
  if (errors.length > 30) {
    console.error(`  ... et ${errors.length - 30} autres`);
  }
  process.exit(1);
}

if (warnings.length) {
  warnings.slice(0, 10).forEach((w) => console.warn(`  ⚠ ${w}`));
}

console.log(
  `✓ validate-web-media-prepare OK — ${webpCount} webp, ${sidecarCount} sidecar(s)`,
);
