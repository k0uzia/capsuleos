#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres KDE — Phase 2b + couche Se (bus capsule:*).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { writeSettingsEffectsState } from './settings-effects-lib.mjs';

const errors = [];
const warnings = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const allowStub = process.argv.includes('--allow-stub');

let skinRel = 'home/Debian/KDE-Neon/index.html';
try {
  const entry = loadRegistryEntry(registry);
  skinRel = entry.referencePaths?.skin || skinRel;
} catch {
  /* pivot par défaut */
}
const skinDir = path.dirname(skinRel);

const matrixPath = path.join(ROOT, 'root/tools/lab/kde-settings-parity-matrix.json');
const registryPath = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
const parityPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-settings-parity.js');
const bindingsPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-kconfig-bindings.js');
const storePath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-kconfig-store.js');
const skinIndex = read(skinRel);
const settingsTpl = read('usr/share/capsuleos/linux/apps/systemsettings_kde_neon.html')
  || read('usr/share/capsuleos/linux/apps/systemsettings_kde.html');

if (!fs.existsSync(matrixPath)) {
  errors.push('kde-settings-parity-matrix.json absent');
}
if (!fs.existsSync(registryPath)) {
  errors.push('kde-settings-controls-registry.json absent');
}
if (!fs.existsSync(parityPath)) {
  warnings.push('kde-settings-parity.js absent — Phase 2b');
}
if (!fs.existsSync(bindingsPath)) {
  errors.push('kde-kconfig-bindings.js absent — generate-kde-kconfig-bindings.mjs');
}
if (!fs.existsSync(storePath)) {
  warnings.push('kde-kconfig-store.js absent — Phase 2b');
}

if (!skinIndex.includes('data-link="themes"')) {
  errors.push(`${skinRel} : slot themes absent`);
}
if (!skinIndex.includes('kde-settings-parity.js')) {
  errors.push(`${skinRel} : kde-settings-parity.js non chargé`);
}
if (!skinIndex.includes('kde-kconfig-bindings.js')) {
  errors.push(`${skinRel} : kde-kconfig-bindings.js non chargé`);
}
if (!skinIndex.includes('kde-systemsettings-nav.js')) {
  errors.push(`${skinRel} : kde-systemsettings-nav.js non chargé`);
}

const skinCss = read(path.join(skinDir, 'style/style.css'));
const importsCss = read(path.join(skinDir, 'style/imports.css'));
const hasA11yChain =
  skinCss.includes('imports.css') && importsCss.includes('a11y-overrides.css');
if (!hasA11yChain) {
  errors.push(`${skinRel} : a11y-overrides.css non importé (style.css → imports.css)`);
}

const parityJs = read('usr/lib/capsuleos/shells/linux/kde-settings-parity.js');
const themeStorageJs = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const a11yCss = read(path.join(skinDir, 'style/a11y-overrides.css'));
const effectSources = `${parityJs}\n${themeStorageJs}`;

const matrix = fs.existsSync(matrixPath)
  ? JSON.parse(fs.readFileSync(matrixPath, 'utf8'))
  : { panels: [] };

const p0Effects = [];
for (const panel of matrix.panels || []) {
  if (panel.priority !== 'P0') continue;
  for (const eff of panel.effects || []) {
    p0Effects.push(eff);
  }
}

if (!p0Effects.length) {
  errors.push('SeΣ : aucun effet P0 dans kde-settings-parity-matrix.json');
}

for (const eff of p0Effects) {
  if (!parityJs.includes(eff.capsuleKey)) {
    errors.push(`SeΣ P0 "${eff.capsuleKey}" : handler absent dans kde-settings-parity.js`);
  }
  if (eff.event && !effectSources.includes(eff.event)) {
    errors.push(`SeΣ P0 "${eff.capsuleKey}" : événement ${eff.event} absent`);
  }
  if (!settingsTpl.includes(`data-kde-setting="${eff.capsuleKey}"`)) {
    errors.push(`SeΣ P0 "${eff.capsuleKey}" : contrôle absent dans systemsettings_kde_neon.html`);
  }
}

if (!a11yCss.includes('data-contrast-mode')) {
  errors.push('Se-A11y : consommateur data-contrast-mode absent (a11y-overrides.css)');
}
if (!a11yCss.includes('data-font-scale')) {
  errors.push('Se-A11y : consommateur data-font-scale absent (a11y-overrides.css)');
}

if (errors.length) {
  console.error(`verify-kde-settings-parity-chain ${registry} — échec\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

const seSigma = p0Effects.every((eff) => (
  parityJs.includes(eff.capsuleKey)
  && (!eff.event || effectSources.includes(eff.event))
  && settingsTpl.includes(`data-kde-setting="${eff.capsuleKey}"`)
));

writeSettingsEffectsState(registry, {
  Se: true,
  SeΣ: seSigma,
}, {
  gate: 'verify-kde-settings-parity-chain.mjs',
  phase: '2b-v15',
  p0Effects: p0Effects.map((e) => e.capsuleKey),
  warnings: warnings.length,
});

console.log(`✓ verify-kde-settings-parity-chain ${registry} OK — SeΣ=${seSigma} (${p0Effects.length} effets P0)`);
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
