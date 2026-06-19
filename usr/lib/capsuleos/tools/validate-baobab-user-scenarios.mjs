#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Baobab — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-baobab-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/baobab-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/baobab.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/baobab.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-baobab-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('baobab-user-scenarios.json manquant');
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
  'syncBaobabDataset',
  'data-baobab-gnome-volume',
  'data-baobab-gnome-treemap-cell',
  'dataset.baobabVolume',
  'dataset.baobabView',
  'dataset.baobabTreemapReady',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`baobab.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-baobab-gnome-action="scan"',
  'data-baobab-gnome-view="overview"',
  'data-baobab-gnome-view="treemap"',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`baobab.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-baobab-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-baobab-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-baobab-user-scenarios OK');
process.exit(0);
