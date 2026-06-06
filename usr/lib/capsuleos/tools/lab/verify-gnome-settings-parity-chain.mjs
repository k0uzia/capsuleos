#!/usr/bin/env node
/**
 * Vérifie la chaîne complète Paramètres : matrice ↔ parity ↔ HTML ↔ baseline VM ↔ interactions.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs
 *   node usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs --strict
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];
const warnings = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const strict = process.argv.includes('--strict');
const registry = 'linux-rocky';

const matrix = JSON.parse(read('root/tools/lab/gnome-settings-parity-matrix.json') || '{}');
const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const gsettingsJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js');
const themesHtml = read('usr/share/capsuleos/linux/apps/themes_gnome.html');
const rockyIndex = read('home/RedHat/Rocky/index.html');
const baselineJs = read(`usr/lib/capsuleos/shells/linux/gnome-settings-vm-baseline-${registry}.js`);

const playbookPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-playbook.json`);
const interactionPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-interaction.json`);

function handlerIds(js, name) {
  const block = js.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n    \\};`));
  if (!block) return new Set();
  const ids = new Set();
  const re = /^\s{8}(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*\{/gm;
  let m;
  while ((m = re.exec(block[1])) !== null) ids.add(m[1] || m[2]);
  return ids;
}

const switchIds = handlerIds(parityJs, 'SWITCH_HANDLERS');
const selectIds = handlerIds(parityJs, 'SELECT_HANDLERS');
const sliderIds = handlerIds(parityJs, 'SLIDER_HANDLERS');

if (!rockyIndex.includes(`gnome-settings-vm-baseline-${registry}.js`)) {
  errors.push(`Rocky index : baseline VM script absent`);
}
if (!baselineJs.includes('CAPSULE_VM_SETTINGS_BASELINE')) {
  errors.push('Baseline JS : CAPSULE_VM_SETTINGS_BASELINE absent');
}
if (!parityJs.includes('mergeVmSettingsBaseline')) {
  errors.push('parity.js : mergeVmSettingsBaseline absent');
}
if (!parityJs.includes('CapsuleGnomeGSettings')) {
  errors.push('parity.js : délégation CapsuleGnomeGSettings absente');
}
if (!gsettingsJs.includes('CapsuleGnomeGSettings')) {
  errors.push('gnome-gsettings-store.js : API CapsuleGnomeGSettings absente');
}
if (!rockyIndex.includes('gnome-gsettings-store.js')) {
  errors.push('Rocky index : gnome-gsettings-store.js absent');
}
const gsettingsPos = rockyIndex.indexOf('gnome-gsettings-store.js');
const parityPos = rockyIndex.indexOf('gnome-settings-parity.js');
if (gsettingsPos >= 0 && parityPos >= 0 && gsettingsPos > parityPos) {
  errors.push('Rocky index : gnome-gsettings-store.js doit précéder gnome-settings-parity.js');
}

for (const panel of matrix.panels || []) {
  for (const ctrl of panel.controls || []) {
    if (!ctrl.schema || !ctrl.key || !ctrl.capsuleKey) continue;
    if (ctrl.map === 'volumeStepNote') continue;
    const needle = `'${ctrl.capsuleKey}':`;
    if (!gsettingsJs.includes(needle)) {
      errors.push(`gsettings-store : binding absent pour ${ctrl.capsuleKey} (${ctrl.schema}::${ctrl.key})`);
    }
  }
}

for (const panel of matrix.panels || []) {
  for (const ctrl of panel.controls || []) {
    const id = ctrl.id;
    const hasHandler = switchIds.has(id) || selectIds.has(id) || sliderIds.has(id)
      || ['theme', 'accent', 'wallpaper', 'contrast', 'font-scale'].includes(id);
    if (!hasHandler && !ctrl.source) {
      warnings.push(`Contrôle "${id}" sans handler parity explicite`);
    }
    const htmlWired = {
      theme: 'data-theme-option',
      accent: 'data-accent-chip',
      wallpaper: 'data-wallpaper-grid',
      contrast: 'data-contrast-option',
      'font-scale': 'data-font-scale-option',
      volume: 'data-settings-slider="volume"',
      'pointer-speed': 'data-settings-slider="pointer-speed"',
    };
    const wiredByType = htmlWired[id]
      || (switchIds.has(id) ? `data-settings-switch="${id}"` : null)
      || (selectIds.has(id) ? `data-settings-apply="${id}"` : null)
      || (sliderIds.has(id) ? `data-settings-slider="${id}"` : null)
      || `data-settings-value="${id}"`;
    if (ctrl.capsuleKey && !themesHtml.includes(wiredByType)) {
      errors.push(`HTML : ${id} non câblé (${wiredByType})`);
    }
  }
}

if (fs.existsSync(playbookPath)) {
  const playbook = JSON.parse(fs.readFileSync(playbookPath, 'utf8'));
  const baselineMatch = baselineJs.match(/CAPSULE_VM_SETTINGS_BASELINE = (\{[\s\S]*?\});/);
  let baseline = {};
  if (baselineMatch) {
    baseline = JSON.parse(baselineMatch[1]);
  }
  for (const panel of playbook.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (ctrl.status !== 'mapped' || ctrl.capsuleExpected == null) continue;
      const entry = baseline[ctrl.id];
      if (!entry) {
        errors.push(`Baseline : contrôle mappé VM "${ctrl.id}" absent`);
      } else if (entry.capsuleExpected !== String(ctrl.capsuleExpected)) {
        errors.push(`Baseline : dérive ${ctrl.id} (${entry.capsuleExpected} ≠ ${ctrl.capsuleExpected})`);
      }
    }
  }
} else {
  warnings.push('Playbook inventaire absent — baseline non vérifiée');
}

if (fs.existsSync(interactionPath)) {
  const interaction = JSON.parse(fs.readFileSync(interactionPath, 'utf8'));
  const failed = [];
  for (const panel of interaction.panels || []) {
    for (const it of panel.interactions || []) {
      if (it.status === 'failed') failed.push(`${panel.id}/${it.controlId}`);
    }
  }
  if (failed.length) {
    errors.push(`Interactions VM en échec : ${failed.join(', ')}`);
  }
  if ((interaction.summary?.ok || 0) < 20) {
    warnings.push(`Interactions VM : seulement ${interaction.summary?.ok || 0} OK`);
  }
} else {
  warnings.push('Inventaire interaction absent');
}

if (errors.length) {
  console.error('verify-gnome-settings-parity-chain — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

console.log('✓ verify-gnome-settings-parity-chain OK');
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
if (strict && warnings.length) process.exit(1);
