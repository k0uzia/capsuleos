#!/usr/bin/env node
/**
 * Smoke paires VM ↔ Capsule Dolphin KDE Neon — ground truth visuel.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-dolphin-vm-parity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const IMG = path.join(ROOT, 'home/public/Images/screen_KDE-Neon');
const MIN_BYTES = 8000;

const pairs = [
  ['vm-dolphin.png', 'capsule-dolphin.png'],
  ['vm-dolphin-compact.png', 'capsule-dolphin-compact.png'],
  ['vm-dolphin-list.png', 'capsule-dolphin-list.png'],
  ['vm-dolphin-search-open.png', 'capsule-dolphin-search-open.png'],
  ['vm-dolphin-search-filter-open.png', 'capsule-dolphin-search-filter-open.png'],
  ['vm-dolphin-hamburger-open.png', 'capsule-dolphin-hamburger.png'],
  ['vm-dolphin-split-only.png', 'capsule-dolphin-split.png'],
];

const errors = [];

for (const [vm, cap] of pairs) {
  for (const file of [vm, cap]) {
    const abs = path.join(IMG, file);
    if (!fs.existsSync(abs)) {
      errors.push(`manquant: ${file}`);
      continue;
    }
    const size = fs.statSync(abs).size;
    if (size < MIN_BYTES) {
      errors.push(`${file}: ${size} octets (< ${MIN_BYTES})`);
    }
  }
}

const vmInv = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-vm.json');
if (!fs.existsSync(vmInv)) {
  errors.push('inventaire VM linux-kde-neon-vm.json absent');
}

const diffDoc = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-dolphin-diff.md');
if (!fs.existsSync(diffDoc)) {
  errors.push('linux-kde-neon-dolphin-diff.md absent');
}

if (errors.length) {
  console.error('smoke-dolphin-vm-parity — ÉCHEC');
  errors.forEach((msg) => console.error(`  • ${msg}`));
  process.exit(1);
}

console.log(`smoke-dolphin-vm-parity — OK (${pairs.length} paires VM↔Capsule)`);
