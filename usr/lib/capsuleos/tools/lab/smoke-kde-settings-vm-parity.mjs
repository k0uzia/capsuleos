#!/usr/bin/env node
/**
 * Smoke paires VM ↔ Capsule Paramètres KDE Neon — 10 shots P0 (inventaires captures).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-kde-settings-vm-parity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REGISTRY = 'linux-kde-neon';
const MIN_BYTES = 8000;
const VM_DIR = path.join(ROOT, 'root/docs/inventaires/captures', REGISTRY, 'apps-visual/themes');
const CAP_DIR = path.join(ROOT, 'root/docs/inventaires/captures', REGISTRY, 'apps-visual-capsule/themes');
const MATRIX_REL = 'root/tools/lab/kde-settings-visual-investigation-matrix.json';

const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, MATRIX_REL), 'utf8'));
const shots = (matrix.investigations || [])
  .filter((i) => i.parityPriority === 'P0')
  .map((i) => i.controlId);

const errors = [];

for (const shotId of shots) {
  const vm = path.join(VM_DIR, `${shotId}-vm.png`);
  const cap = path.join(CAP_DIR, `${shotId}-capsule.png`);
  for (const [label, abs] of [['VM', vm], ['Capsule', cap]]) {
    if (!fs.existsSync(abs)) {
      errors.push(`${shotId} ${label} manquant: ${path.basename(abs)}`);
      continue;
    }
    const size = fs.statSync(abs).size;
    if (size < MIN_BYTES) {
      errors.push(`${shotId} ${label}: ${size} octets (< ${MIN_BYTES})`);
    }
  }
}

const frontInv = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-kde-settings-front-inventory.json');
if (!fs.existsSync(frontInv)) {
  errors.push('linux-kde-neon-kde-settings-front-inventory.json absent');
}

const diffDoc = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-kde-settings-diff.md');
if (!fs.existsSync(diffDoc)) {
  errors.push('linux-kde-neon-kde-settings-diff.md absent');
}

if (errors.length) {
  console.error('smoke-kde-settings-vm-parity — ÉCHEC');
  errors.forEach((msg) => console.error(`  • ${msg}`));
  process.exit(1);
}

console.log(`smoke-kde-settings-vm-parity — OK (${shots.length} paires VM↔Capsule)`);
