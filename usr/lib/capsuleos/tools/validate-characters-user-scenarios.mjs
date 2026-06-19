#!/usr/bin/env node
/** Contrat scénarios GNOME Characters — structure + handlers kernel. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/characters-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/characters.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/characters.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-characters-scenarios.mjs');
const errors = [];

if (!fs.existsSync(CONTRACT)) errors.push('characters-user-scenarios.json manquant');
else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) errors.push('au moins 4 scénarios P0 attendus');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
['syncCharactersDataset', 'data-characters-gnome-action', 'dataset.charactersInit', 'dataset.charactersSelected'].forEach((needle) => {
  if (!kernelText.includes(needle)) errors.push(`characters.js : attendu « ${needle} »`);
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
if (!templateText.includes('data-characters-gnome-action="copy"')) errors.push('characters.html : action copy manquante');
if (!fs.existsSync(SMOKE)) errors.push('smoke-gnome-characters-scenarios.mjs manquant');

if (errors.length) {
  console.error(`✗ validate-characters-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}
console.log('✓ validate-characters-user-scenarios OK');
process.exit(0);
