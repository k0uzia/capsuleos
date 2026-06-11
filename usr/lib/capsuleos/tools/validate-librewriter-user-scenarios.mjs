#!/usr/bin/env node
/**
 * Contrat scénarios GNOME LibreOffice Writer (slot librewriter) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-librewriter-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/librewriter-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/librewriter.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/librewriter.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-librewriter-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-librewriter-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-alma-librewriter-vm-inventory.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('librewriter-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'librewriter' && contract.slotCapsule !== 'librewriter') {
    errors.push('slot doit être librewriter (≠ text_editor)');
  }
  if (contract.template !== 'librewriter.html') {
    errors.push('template doit être librewriter.html');
  }
  if (contract.softwareCatalogId !== 'libreoffice-writer') {
    errors.push('softwareCatalogId doit être libreoffice-writer (cohérence S1)');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Lw1–Lw4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-alma-librewriter-vm-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncLibrewriterGnomeDataset',
  'supportsLibrewriterGnomeDataset',
  'initLibreWriter',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`librewriter.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-librewriter-gnome-root',
  'data-librewriter-gnome-page',
  'data-librewriter-gnome-menubar',
  'data-librewriter-gnome-toolbar-std',
  'data-librewriter-gnome-toolbar-fmt',
  'data-librewriter-gnome-action="save"',
  'data-librewriter-gnome-action="new"',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`librewriter.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-librewriter-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-librewriter-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-librewriter-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-librewriter-user-scenarios OK');
process.exit(0);
