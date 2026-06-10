#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Terminal Ptyxis (slot terminal) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-terminal-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/terminal-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/terminal/terminal.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/terminal.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-terminal-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-terminal-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-alma-terminal-vm.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('terminal-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'terminal' && contract.slotCapsule !== 'terminal') {
    errors.push('slot doit être terminal');
  }
  if (contract.template !== 'terminal.html') {
    errors.push('template doit être terminal.html');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Te1–Te4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-alma-terminal-vm.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncTerminalGnomeDataset',
  'supportsTerminalGnomeDataset',
  'usesPtyxisTerminalChrome',
  'initTerminalForContainer',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`terminal.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-terminal-gnome-root',
  'data-ptyxis-gnome-root',
  'data-terminal-gnome-output',
  'data-terminal-gnome-prompt',
  'data-terminal-gnome-command',
  'data-ptyxis-gnome-app',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`terminal.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-terminal-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-terminal-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-terminal-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-terminal-user-scenarios OK');
process.exit(0);
