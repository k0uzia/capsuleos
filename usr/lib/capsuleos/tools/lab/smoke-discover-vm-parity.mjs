#!/usr/bin/env node
/**
 * Smoke paires VM ↔ Capsule Discover KDE Neon — ground truth visuel.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-vm-parity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const IMG = path.join(ROOT, 'home/public/Images/screen_KDE-Neon');
const MIN_BYTES = 8000;

const pairs = [
  ['vm-discover.png', 'capsule-discover.png'],
  ['vm-discover-installed.png', 'capsule-discover-installed.png'],
  ['vm-discover-updates.png', 'capsule-discover-updates.png'],
  ['vm-discover-config.png', 'capsule-discover-config.png'],
  ['vm-discover-about.png', 'capsule-discover-about.png'],
  ['vm-discover-detail-vlc.png', 'capsule-discover-detail-vlc.png'],
  ['vm-discover-detail-vlc-scrolled.png', 'capsule-discover-detail-vlc-scrolled.png'],
];

const installedDetailsPath = path.join(
  ROOT,
  'root/docs/inventaires/linux-kde-neon-discover-installed-app-details.json',
);
if (fs.existsSync(installedDetailsPath)) {
  const { installedIds = [] } = JSON.parse(fs.readFileSync(installedDetailsPath, 'utf8'));
  for (const id of installedIds) {
    pairs.push([
      `vm-discover-installed-detail-${id}.png`,
      `capsule-discover-installed-detail-${id}.png`,
    ]);
  }
}

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

if (errors.length) {
  console.error('smoke-discover-vm-parity — ÉCHEC');
  errors.forEach((msg) => console.error(`  • ${msg}`));
  process.exit(1);
}

console.log(`smoke-discover-vm-parity — OK (${pairs.length} paires VM↔Capsule)`);
