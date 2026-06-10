#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Text Editor — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-text-editor-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/text-editor-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/text-editor.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/text_editor.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-text-editor-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('text-editor-user-scenarios.json manquant');
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
  'GNOME_TE_SESSION_KEY',
  'openTeGnomeVfsSample',
  'showTeGnomeSaveToast',
  'renderGnomeTeTabs',
];
requiredKernel.forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`text-editor.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-te-gnome-area',
  'data-te-gnome-save-dialog',
  'data-te-gnome-toast',
  'data-te-gnome-tabs',
  'data-te-gnome-action="open-vfs"',
  'data-te-gnome-action="new-tab"',
  'data-te-gnome-action="close-tab"',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`text_editor.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-text-editor-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-text-editor-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-text-editor-user-scenarios OK');
process.exit(0);
