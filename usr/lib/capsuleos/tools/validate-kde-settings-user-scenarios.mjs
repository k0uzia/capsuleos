#!/usr/bin/env node
/**
 * Gate scénarios KDE Paramètres — structure contrat + handlers P0.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/kde-settings-user-scenarios.json');
const PARITY = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-settings-parity.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/systemsettings_kde_neon.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('kde-settings-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0');
  if (p0.length < 4) errors.push('au moins 4 scénarios P0 attendus');
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

const parityText = fs.readFileSync(PARITY, 'utf8');
['EFFECT_HANDLERS', 'kde-global-theme', 'kde-panel-height', 'kde-a11y-high-contrast', 'kde-desktop-icons'].forEach((needle) => {
  if (!parityText.includes(needle)) errors.push(`kde-settings-parity.js : « ${needle} » absent`);
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-kde-settings-root',
  'data-kde-setting="kde-global-theme"',
  'data-kde-setting="kde-panel-height"',
  'data-kde-setting="kde-a11y-high-contrast"',
  'data-kde-setting="kde-desktop-icons"',
].forEach((needle) => {
  if (!templateText.includes(needle)) errors.push(`systemsettings_kde_neon.html : « ${needle} » absent`);
});

if (!fs.existsSync(SMOKE)) errors.push('smoke-h6-kde-settings-ready.mjs manquant');

if (errors.length) {
  console.error(`✗ validate-kde-settings-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-kde-settings-user-scenarios OK');
process.exit(0);
