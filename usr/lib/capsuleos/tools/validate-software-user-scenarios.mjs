#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Software — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-software-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/software-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/update-manager.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/update_manager_gnome.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('software-user-scenarios.json manquant');
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
  'runGnomeInstallSimulation',
  'renderGnomeInstalledList',
  'openGnomeAppSlot',
  'GNOME_INSTALLED_KEY',
  'data-um-gnome-action="open"',
];
requiredKernel.forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`update-manager.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
['data-um-gnome-installed-list', 'data-um-gnome-install-progress'].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`update_manager_gnome.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-software-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-software-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-software-user-scenarios OK');
process.exit(0);
