#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Horloges — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-clocks-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/clocks-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/clocks.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/clocks.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-clocks-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('clocks-user-scenarios.json manquant');
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
  'GNOME_CLOCKS_SESSION_KEY',
  'syncClocksDataset',
  'addNextCity',
  'addSampleAlarm',
  'toggleStopwatch',
  'toggleTimer',
  'data-clocks-view',
  'data-clocks-action',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`clocks.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-clocks-view="world"',
  'data-clocks-action="add-city"',
  'data-clocks-action="stopwatch-toggle"',
  'data-clocks-action="timer-toggle"',
  'data-clocks-gnome-face="timer"',
  'data-clocks-gnome-face="stopwatch"',
  'data-clocks-gnome-empty="alarms"',
  'data-clocks-gnome-alarm-list',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`clocks.html : attendu « ${needle} »`);
  }
});

['data-clocks-gnome-city', 'data-clocks-gnome-alarm'].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`clocks.js : rendu dynamique attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-clocks-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-clocks-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-clocks-user-scenarios OK');
process.exit(0);
