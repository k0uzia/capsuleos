#!/usr/bin/env node
/** Contrat scénarios Capture d'écran GNOME — structure + handlers kernel. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/screenshot-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/screenshot.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/screenshot.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-screenshot-scenarios.mjs');
const errors = [];

if (!fs.existsSync(CONTRACT)) errors.push('screenshot-user-scenarios.json manquant');
else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) errors.push('au moins 4 scénarios P0 attendus');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
['syncShotDataset', 'data-shot-gnome-action', 'dataset.shotPhase', 'dataset.shotInit'].forEach((needle) => {
  if (!kernelText.includes(needle)) errors.push(`screenshot.js : attendu « ${needle} »`);
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
if (!templateText.includes('data-shot-gnome-action="capture"')) errors.push('screenshot.html : action capture manquante');
if (!fs.existsSync(SMOKE)) errors.push('smoke-gnome-screenshot-scenarios.mjs manquant');

if (errors.length) {
  console.error(`✗ validate-screenshot-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}
console.log('✓ validate-screenshot-user-scenarios OK');
process.exit(0);
