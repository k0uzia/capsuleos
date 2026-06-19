#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Loupe (slot visionneur_images) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-loupe-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/loupe-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mint-viewers.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/visionneur_images.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-loupe-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-loupe-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-rocky-loupe-vm-inventory.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('loupe-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'visionneur_images') {
    errors.push('slot doit être visionneur_images');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Li1–Li4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-rocky-loupe-vm-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncLoupeGnomeDataset',
  'supportsLoupeGnomeChrome',
  'initVisionneurImagesApp',
  'openPixDemoImage',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`mint-viewers.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-loupe-gnome-root',
  'data-loupe-gnome-toolbar',
  'data-loupe-gnome-action="zoom-in"',
  'data-loupe-gnome-action="zoom-out"',
  'data-loupe-gnome-action="toggle-meta"',
  'data-loupe-gnome-canvas',
  'data-loupe-gnome-empty',
  'data-loupe-gnome-meta',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`visionneur_images.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-loupe-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-loupe-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-loupe-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-loupe-user-scenarios OK');
process.exit(0);
