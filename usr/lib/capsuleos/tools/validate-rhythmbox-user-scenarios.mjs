#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Rhythmbox (slot lecteur_multimedia Ubuntu) — structure + kernel + gabarit.
 * Usage : node usr/lib/capsuleos/tools/validate-rhythmbox-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/rhythmbox-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/rhythmbox.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/rhythmbox.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-rhythmbox-scenarios.mjs');
const CAPTURE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/capture-capsule-rhythmbox-views.mjs');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-ubuntu-rhythmbox-vm-inventory.json');
const UBUNTU_PROFILE = path.join(ROOT, 'home/Debian/Ubuntu/skin.profile.json');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('rhythmbox-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  if (contract.slot !== 'lecteur_multimedia') {
    errors.push('slot doit être lecteur_multimedia');
  }
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus (Rb1–Rb4)');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

if (!fs.existsSync(INVENTORY)) {
  errors.push('linux-ubuntu-rhythmbox-vm-inventory.json manquant');
}

const profile = JSON.parse(fs.readFileSync(UBUNTU_PROFILE, 'utf8'));
const override = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES?.lecteur_multimedia;
if (!override || !String(override).includes('rhythmbox.html')) {
  errors.push('Ubuntu skin.profile.json : override lecteur_multimedia → rhythmbox.html attendu');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'syncRhythmboxGnomeDataset',
  'supportsRhythmboxGnomeChrome',
  'initRhythmboxApp',
  'togglePlayPause',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`rhythmbox.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-rb-gnome-root',
  'data-rb-gnome-nav="library"',
  'data-rb-gnome-nav="podcasts"',
  'data-rb-gnome-tracks',
  'data-rb-gnome-action="play-pause"',
  'data-rb-gnome-now',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`rhythmbox.html : attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-rhythmbox-scenarios.mjs manquant');
}
if (!fs.existsSync(CAPTURE)) {
  errors.push('capture-capsule-rhythmbox-views.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-rhythmbox-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-rhythmbox-user-scenarios OK');
process.exit(0);
