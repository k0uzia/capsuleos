#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres KDE — Phase 2b + couche Se (bus capsule:*).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { writeSettingsEffectsState } from './settings-effects-lib.mjs';

const errors = [];
const warnings = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const allowStub = process.argv.includes('--allow-stub');

const matrixPath = path.join(ROOT, 'root/tools/lab/kde-settings-parity-matrix.json');
const parityPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-settings-parity.js');
const storePath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-kconfig-store.js');
const skinIndex = read('home/Debian/KDE-Neon/index.html');

if (!fs.existsSync(matrixPath)) {
  errors.push('kde-settings-parity-matrix.json absent');
}

if (!fs.existsSync(parityPath)) {
  if (allowStub) {
    warnings.push('kde-settings-parity.js absent — Phase 2b');
  } else {
    warnings.push('kde-settings-parity.js absent — Phase 2b (non bloquant)');
  }
}

if (!fs.existsSync(storePath)) {
  warnings.push('kde-kconfig-store.js absent — Phase 2b');
}

if (!skinIndex.includes('data-link="themes"')) {
  errors.push('KDE-Neon index : slot themes absent');
}
if (!skinIndex.includes('kde-settings-parity.js')) {
  errors.push('KDE-Neon index : kde-settings-parity.js non chargé');
}
if (!skinIndex.includes('kde-kconfig-store.js')) {
  errors.push('KDE-Neon index : kde-kconfig-store.js non chargé');
}

const skinCss = read('home/Debian/KDE-Neon/style/style.css');
const importsCss = read('home/Debian/KDE-Neon/style/imports.css');
const hasA11yChain =
  skinCss.includes('imports.css') && importsCss.includes('a11y-overrides.css');
if (!hasA11yChain) {
  errors.push('KDE-Neon : a11y-overrides.css non importé (style.css → imports.css)');
}

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/kde-ground-truth-chain.json');
if (!fs.existsSync(contractPath)) {
  errors.push('kde-ground-truth-chain.json absent');
}

const seContractPath = path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json');
if (!fs.existsSync(seContractPath)) {
  errors.push('Contrat settings-effects-chain.json absent');
}

const parityJs = read('usr/lib/capsuleos/shells/linux/kde-settings-parity.js');
const themeStorageJs = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const a11yCss = read('home/Debian/KDE-Neon/style/a11y-overrides.css');
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
}

if (!a11yCss.includes('data-contrast-mode')) {
  errors.push('Se-A11y : consommateur data-contrast-mode absent (a11y-overrides.css)');
}
if (!a11yCss.includes('data-font-scale')) {
  errors.push('Se-A11y : consommateur data-font-scale absent (a11y-overrides.css)');
}

const settingsTpl = read('usr/share/capsuleos/linux/apps/systemsettings_kde.html');
for (const eff of p0Effects) {
  if (!settingsTpl.includes(`data-kde-setting="${eff.capsuleKey}"`)) {
    errors.push(`SeΣ P0 "${eff.capsuleKey}" : contrôle absent dans systemsettings_kde.html`);
  }
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
  phase: '2b',
  p0Effects: p0Effects.map((e) => e.capsuleKey),
  warnings: warnings.length,
});

console.log(`✓ verify-kde-settings-parity-chain ${registry} OK — SeΣ=${seSigma}`);
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
