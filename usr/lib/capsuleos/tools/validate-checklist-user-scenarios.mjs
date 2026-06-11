#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Missions CapsuleOS (slot checklist) — structure + handlers kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-checklist-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/checklist-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/checklist.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/checklist.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-checklist-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-checklist-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-alma-checklist-capsule-inventory.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('checklist-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'checklist' && contract.slotCapsule !== 'checklist') {
    errors.push('slot doit être checklist');
  }
  if (contract.template !== 'checklist.html') {
    errors.push('template doit être checklist.html');
  }
  if (!contract.capsuleOnly) {
    errors.push('capsuleOnly: true requis (module pédagogique CapsuleOS)');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Ck1–Ck4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-alma-checklist-capsule-inventory.json manquant');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncChecklistGnomeDataset',
  'supportsChecklistGnomeDataset',
  'initChecklistApp',
  'checklistGnomeTaskCount',
  'checklistGnomeDoneCount',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`checklist.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-checklist-gnome-root',
  'data-checklist-gnome-list',
  'data-checklist-gnome-item',
  'data-checklist-gnome-task-id',
  'data-checklist-gnome-check',
  'data-checklist-gnome-progress-bar',
  'data-checklist-gnome-progress-label',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`checklist.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-checklist-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-checklist-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-checklist-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-checklist-user-scenarios OK');
process.exit(0);
