#!/usr/bin/env node
/**
 * Compare inventaire assets VM ↔ fichiers CapsuleOS (gate S + dérive binaire).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-vm-settings-assets-capsule.mjs --registry linux-rocky
 *   node usr/lib/capsuleos/tools/lab/compare-vm-settings-assets-capsule.mjs --registry linux-rocky --strict
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const registryIdx = args.indexOf('--registry');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-rocky';

const invPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-assets.json`);
const errors = [];

if (!fs.existsSync(invPath)) {
  console.error(`✗ Inventaire VM assets absent: ${path.relative(ROOT, invPath)}`);
  console.error('  → node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id', registry);
  process.exit(1);
}

const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
const sha256File = (abs) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(abs));
  return hash.digest('hex');
};

let aligned = 0;
let missingCapsule = 0;
let missingVm = 0;
let drift = 0;
const rows = [];

for (const asset of inv.assets || []) {
  const rel = asset.capsulePath;
  const abs = rel ? path.join(ROOT, rel) : null;
  const row = {
    id: asset.id,
    capsulePath: rel,
    vmPath: asset.vmPath,
    existsOnVm: asset.existsOnVm,
    existsInCapsule: Boolean(abs && fs.existsSync(abs)),
    sha256Vm: asset.sha256 || null,
    sha256Capsule: null,
    status: 'unknown',
  };

  if (!asset.existsOnVm) {
    missingVm += 1;
    row.status = 'missing-vm';
    errors.push(`VM: fichier absent ${asset.vmPathPrimary || asset.vmPath}`);
  } else if (!row.existsInCapsule) {
    missingCapsule += 1;
    row.status = 'missing-capsule';
    errors.push(`CapsuleOS: asset absent ${rel} — lancer pull-vm-assets.sh`);
  } else {
    row.sha256Capsule = sha256File(abs);
    if (asset.sha256 && row.sha256Capsule !== asset.sha256) {
      drift += 1;
      row.status = 'drift';
      errors.push(`Dérive ${asset.id}: contenu VM ≠ dépôt`);
    } else {
      aligned += 1;
      row.status = 'aligned';
    }
  }
  rows.push(row);
}

const report = {
  registry,
  generatedAt: new Date().toISOString(),
  vmInventoryAt: inv.generatedAt,
  alignedCount: aligned,
  missingCapsuleCount: missingCapsule,
  missingVmCount: missingVm,
  driftCount: drift,
  rows,
  pullHint: 'bash root/tools/lab/pull-vm-assets.sh --id ' + registry,
};

const outPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-assets-drift.json`);
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

if (errors.length && strict) {
  console.error(`✗ compare-vm-settings-assets — alignés ${aligned}, dérives ${drift}, manquants capsule ${missingCapsule}`);
  errors.slice(0, 12).forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

if (errors.length) {
  console.warn(`⚠ compare-vm-settings-assets — ${errors.length} écart(s) (non strict)`);
} else {
  console.log(`✓ compare-vm-settings-assets OK — ${aligned} alignés`);
}
console.log(`  ${path.relative(ROOT, outPath)}`);
