#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Calculatrice — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-calculator-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/calculator-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/calculator.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/calculator.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-calculator-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('calculator-user-scenarios.json manquant');
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
const requiredKernel = [
  'GNOME_CALC_SESSION_KEY',
  'copyCalcGnomeResult',
  'syncCalcGnomeDataset',
  'showCalcGnomeToast',
];
requiredKernel.forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`calculator.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-calc-gnome-display',
  'data-calc-gnome-toast',
  'data-calc-gnome-action="copy-result"',
  'data-calc-mode="advanced"',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`calculator.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-calculator-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-calculator-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-calculator-user-scenarios OK');
process.exit(0);
