#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Nautilus (slot nemo) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-nautilus-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/nautilus-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerNautilus.js');
const KERNEL_CORE = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-nautilus-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-alma-nautilus-vm-inventory.json');
const CINNAMON_TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/nemo.html');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('nautilus-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slotCapsule !== 'nemo') {
    errors.push('slotCapsule doit être nemo');
  }
  if (contract.template !== 'nemo-gnome') {
    errors.push('template doit être nemo-gnome');
  }
  if (contract.appId !== 'org.gnome.Nautilus') {
    errors.push('appId doit être org.gnome.Nautilus');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (N1–N4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-alma-nautilus-vm-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'bindFileExplorerNautilusFeatures',
  'syncNautilusGnomeDataset',
  'resolveNautilusGnomePlace',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`fileExplorerNautilus.js : attendu « ${needle} »`);
  }
});

const coreText = fs.readFileSync(KERNEL_CORE, 'utf8');
if (!coreText.includes('syncNautilusGnomeDataset')) {
  errors.push('fileExplorerCore.js : syncNautilusGnomeDataset non appelé après navigation');
}

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-nautilus-gnome-root',
  'data-nautilus-gnome-title',
  'data-nautilus-gnome-sidebar="home"',
  'data-nautilus-gnome-sidebar="starred"',
  'data-nautilus-gnome-sidebar="network"',
  'data-nautilus-gnome-sidebar="documents"',
  'data-nautilus-gnome-sidebar="downloads"',
  'data-nautilus-gnome-sidebar-section="places"',
  'data-nautilus-gnome-sidebar-section="other-places"',
  'data-nautilus-gnome-path-crumbbar',
  'data-nautilus-gnome-action="new-folder"',
  'data-nautilus-gnome-grid',
  'data-nautilus-gnome-tabstrip',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`shell-gnome.html : attendu « ${needle} »`);
  }
});

if (templateText.includes('data-nemo-cinnamon')) {
  errors.push('shell-gnome.html : data-nemo-cinnamon interdit (réservé Mint)');
}

if (fs.existsSync(CINNAMON_TEMPLATE)) {
  const cinnamonText = fs.readFileSync(CINNAMON_TEMPLATE, 'utf8');
  if (cinnamonText.includes('data-nautilus-gnome-')) {
    errors.push('nemo.html Cinnamon : ne doit pas contenir data-nautilus-gnome-*');
  }
}

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-nautilus-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-nautilus-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-nautilus-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-nautilus-user-scenarios OK');
process.exit(0);
