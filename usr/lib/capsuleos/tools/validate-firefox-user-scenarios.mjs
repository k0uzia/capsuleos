#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Firefox (slot firefox) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-firefox-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/firefox-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/firefoxBrowser.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/firefox.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-firefox-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-firefox-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-alma-firefox-vm-inventory.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('firefox-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'firefox') {
    errors.push('slot doit être firefox');
  }
  if (contract.template !== 'firefox.html') {
    errors.push('template doit être firefox.html');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (F1–F4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-alma-firefox-vm-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncFirefoxGnomeDataset',
  'supportsFirefoxGnomeChrome',
  'initFirefoxBrowser',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`firefoxBrowser.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-firefox-gnome-root',
  'data-firefox-gnome-tabstrip',
  'data-firefox-gnome-tabs',
  'data-firefox-gnome-toolbar',
  'data-firefox-gnome-address',
  'data-firefox-gnome-bookmarks',
  'data-firefox-gnome-newtab',
  'data-firefox-gnome-chrome',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`firefox.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-firefox-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-firefox-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-firefox-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-firefox-user-scenarios OK');
process.exit(0);
