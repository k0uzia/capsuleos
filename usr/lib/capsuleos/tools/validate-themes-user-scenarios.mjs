#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Paramètres (themes) — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-themes-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/themes-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/themes.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/themes_gnome.html');
const STORAGE = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-themes-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('themes-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'buildWallpaperGrid',
  'bindAccentChips',
  'activateGnomeSettingsPanel',
  'setCapsuleSettingsPanel',
  'data-theme-option',
  'data-accent-chip',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`themes.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-gnome-settings-panel="appearance"',
  'data-gnome-settings-panel="displays"',
  'data-wallpaper-grid',
  'data-accent-chip',
  'data-theme-option',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`themes_gnome.html : attendu « ${needle} »`);
  }
});

const storageText = fs.readFileSync(STORAGE, 'utf8');
['applyAccentColor', 'applyWallpaper', 'almaWallpaperCatalog', 'getWallpaperCatalog'].forEach((needle) => {
  if (!storageText.includes(needle)) {
    errors.push(`capsule-theme-storage.js : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-themes-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-themes-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-themes-user-scenarios OK');
process.exit(0);
