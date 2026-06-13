#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres : matrice ↔ parity ↔ HTML ↔ baseline VM ↔ interactions.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs --id linux-ubuntu --strict
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import { resolveLabMatrix } from './lab-recipe-resolver.mjs';
import { h6Profile, parseRegistryId, loadPlaybookTail } from './h6-gnome-settings-lib.mjs';
import { writeSettingsEffectsState } from './settings-effects-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const warnings = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const strict = process.argv.includes('--strict');
const registry = parseRegistryId();
const profile = h6Profile(registry);

let matrix;
try {
  const resolved = resolveLabMatrix(registry, 'parity', { strict: true });
  matrix = JSON.parse(fs.readFileSync(resolved.absolute, 'utf8'));
} catch (err) {
  errors.push(err.message);
  matrix = { panels: [] };
}

try {
  resolveLabMatrix(registry, 'assets', { strict: true });
} catch (err) {
  errors.push(err.message);
}

const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const gsettingsJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js');
const bindingsJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js');
const themesHtml = read('usr/share/capsuleos/linux/apps/themes_gnome.html');
const skinIndex = read(profile.skinRel);
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

if (profile.requiresBaseline && !skinIndex.includes(`gnome-settings-vm-baseline-${registry}.js`)) {
  errors.push(`${profile.skinRel} : baseline VM script absent`);
}
if (profile.requiresHotCorners && !skinIndex.includes('gnome-hot-corners.js')) {
  errors.push(`${profile.skinRel} : gnome-hot-corners.js absent (H5 P1 hot-corner)`);
}
if (profile.requiresBaseline && !baselineJs.includes('CAPSULE_VM_SETTINGS_BASELINE')) {
  errors.push(`Baseline JS : CAPSULE_VM_SETTINGS_BASELINE absent pour ${registry}`);
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
if (!gsettingsJs.includes('onChanged')) {
  errors.push('gnome-gsettings-store.js : API onChanged absente');
}
if (!gsettingsJs.includes('searchProviderToggle')) {
  errors.push('gnome-gsettings-store.js : gestion search providers absente');
}
if (!bindingsJs.includes('CAPSULE_GSETTINGS_BINDINGS')) {
  errors.push('gnome-gsettings-bindings.js : CAPSULE_GSETTINGS_BINDINGS absent');
}
if (!skinIndex.includes('gnome-gsettings-bindings.js')) {
  errors.push(`${profile.skinRel} : gnome-gsettings-bindings.js absent`);
}
if (!skinIndex.includes('gnome-gsettings-store.js')) {
  errors.push(`${profile.skinRel} : gnome-gsettings-store.js absent`);
}
const bindingsPos = skinIndex.indexOf('gnome-gsettings-bindings.js');
const gsettingsPos = skinIndex.indexOf('gnome-gsettings-store.js');
const parityPos = skinIndex.indexOf('gnome-settings-parity.js');
if (bindingsPos >= 0 && gsettingsPos >= 0 && bindingsPos > gsettingsPos) {
  errors.push(`${profile.skinRel} : gnome-gsettings-bindings.js doit précéder gnome-gsettings-store.js`);
}
if (gsettingsPos >= 0 && parityPos >= 0 && gsettingsPos > parityPos) {
  errors.push(`${profile.skinRel} : gnome-gsettings-store.js doit précéder gnome-settings-parity.js`);
}

let generatedBindings = {};
const bindingsMatch = bindingsJs.match(/CAPSULE_GSETTINGS_BINDINGS = (\{[\s\S]*?\});/);
if (bindingsMatch) {
  generatedBindings = JSON.parse(bindingsMatch[1]);
}

for (const panel of matrix.panels || []) {
  for (const ctrl of panel.controls || []) {
    if (!ctrl.schema || !ctrl.key || !ctrl.capsuleKey) continue;
    if (ctrl.map === 'volumeStepNote') continue;
    const entry = generatedBindings[ctrl.capsuleKey];
    if (!entry) {
      errors.push(`gsettings-bindings : absent pour ${ctrl.capsuleKey} (${ctrl.schema}::${ctrl.key})`);
      continue;
    }
    if (entry.schema !== ctrl.schema || entry.key !== ctrl.key || entry.map !== ctrl.map) {
      errors.push(`gsettings-bindings : dérive ${ctrl.capsuleKey} (${entry.schema}::${entry.key}/${entry.map})`);
    }
    if (ctrl.providerId && entry.providerId !== ctrl.providerId) {
      errors.push(`gsettings-bindings : providerId dérive ${ctrl.capsuleKey}`);
    }
  }
}

const GNOME_INDEX_PATHS = [
  'home/RedHat/Rocky/index.html',
  'home/RedHat/Fedora/index.html',
  'home/RedHat/Alma/index.html',
  'home/Debian/Ubuntu/index.html',
  'home/Debian/AnduinOS/index.html',
];
for (const rel of GNOME_INDEX_PATHS) {
  const html = read(rel);
  if (!html.includes('gnome-gsettings-bindings.js')) {
    errors.push(`${rel} : gnome-gsettings-bindings.js absent`);
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

if (profile.requiresPlaybook && profile.requiresBaseline && fs.existsSync(playbookPath)) {
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
} else if (profile.requiresPlaybook && profile.requiresBaseline && !fs.existsSync(playbookPath)) {
  warnings.push(`Playbook inventaire absent pour ${registry} — baseline non vérifiée`);
}

if (profile.requiresInteractionInventory && fs.existsSync(interactionPath)) {
  const interaction = JSON.parse(fs.readFileSync(interactionPath, 'utf8'));
  const failed = [];
  for (const panel of interaction.panels || []) {
    for (const it of panel.interactions || []) {
      if (it.status !== 'failed') continue;
      if (it.restoredOk && it.monitorEvent === false) {
        warnings.push(`Interaction VM partielle (toggle non observé, restauration OK) : ${panel.id}/${it.controlId}`);
        continue;
      }
      failed.push(`${panel.id}/${it.controlId}`);
    }
  }
  if (failed.length) {
    errors.push(`Interactions VM en échec : ${failed.join(', ')}`);
  }
  if ((interaction.summary?.ok || 0) < 20) {
    warnings.push(`Interactions VM : seulement ${interaction.summary?.ok || 0} OK`);
  }
} else if (profile.requiresInteractionInventory) {
  warnings.push('Inventaire interaction absent');
}

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json');
if (!fs.existsSync(contractPath)) {
  errors.push('Contrat settings-effects-chain.json absent');
}

const parityJsFull = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const themeStorageJs = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const themesJs = read('usr/lib/capsuleos/shells/linux/themes.js');
const seBusJs = read('usr/lib/capsuleos/shells/linux/se-a11y-bus.js');
const effectSources = `${parityJsFull}\n${themeStorageJs}\n${themesJs}\n${seBusJs}`;

const P0_EVENT_HINTS = {
  theme: ['data-theme-option', 'capsule:gnome-theme-changed', 'persistTheme', 'color-scheme', 'mint-theme'],
  'night-light': ['capsule:night-light-changed', 'capsule:nightlight-changed', 'gnome-night-light'],
  'dynamic-workspaces': ['capsule:workspaces-config-changed', 'capsule:dynamic-workspaces-changed', 'gnome-dynamic-workspaces'],
  dnd: ['capsule:dnd-changed', 'gnome-dnd'],
  accent: ['capsule:accent-changed', 'data-accent-chip', 'gnome-accent'],
  wallpaper: ['capsule:wallpaper-changed', 'data-wallpaper-grid', 'picture-uri'],
  notifications: ['notificationsEnabled', 'show-banners', 'gnome-notifications'],
  contrast: ['capsule:a11y-contrast-changed'],
  'font-scale': ['capsule:a11y-font-scale-changed'],
};

const tail = loadPlaybookTail(registry);
const p0Ids = [...new Set(
  (tail?.gaps || [])
    .filter((g) => g.priority === 'P0')
    .map((g) => g.controlId),
)];

for (const id of p0Ids) {
  const hints = P0_EVENT_HINTS[id] || [`'${id}'`, `data-settings-switch="${id}"`];
  const wired = hints.some((h) => effectSources.includes(h) || parityJsFull.includes(`'${id}'`));
  if (!wired) {
    errors.push(`SeΣ P0 "${id}" : handler/événement absent`);
  }
}

if (errors.length) {
  console.error(`verify-gnome-settings-parity-chain ${registry} — échec\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

console.log(`✓ verify-gnome-settings-parity-chain ${registry} OK`);
writeSettingsEffectsState(registry, {
  Se: true,
  SeΣ: !errors.length && p0Ids.every((id) => {
    const hints = P0_EVENT_HINTS[id] || [`'${id}'`, `data-settings-switch="${id}"`];
    return hints.some((h) => effectSources.includes(h) || parityJsFull.includes(`'${id}'`));
  }),
}, {
  gate: 'verify-gnome-settings-parity-chain.mjs',
  strict,
  p0Ids,
  warnings: warnings.length,
});
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
const strictBlockers = warnings.filter((w) => !w.startsWith('Interaction VM partielle'));
if (strict && strictBlockers.length) process.exit(1);
