#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Papers (slot visionneur_pdf) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-papers-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/papers-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mint-viewers.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/visionneur_pdf.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-papers-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-papers-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-rocky-papers-vm-inventory.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('papers-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'visionneur_pdf') {
    errors.push('slot doit être visionneur_pdf');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Pa1–Pa4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-rocky-papers-vm-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncPapersGnomeDataset',
  'supportsPapersGnomeChrome',
  'initVisionneurPdfApp',
  'openXreaderDemoPdf',
  "action === 'next'",
  "action === 'prev'",
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`mint-viewers.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-papers-gnome-root',
  'data-papers-gnome-action="next"',
  'data-papers-gnome-action="prev"',
  'data-papers-gnome-action="sidebar"',
  'data-papers-gnome-canvas',
  'data-papers-gnome-empty',
  'data-papers-gnome-sidebar',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`visionneur_pdf.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-papers-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-papers-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-papers-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-papers-user-scenarios OK');
process.exit(0);
