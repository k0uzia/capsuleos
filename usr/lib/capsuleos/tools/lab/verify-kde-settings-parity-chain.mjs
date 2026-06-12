#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres KDE — Phase 2b (stub tolérant tant que ¬kde-settings-parity.js).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

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

if (errors.length) {
  console.error(`verify-kde-settings-parity-chain ${registry} — échec\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

console.log(`✓ verify-kde-settings-parity-chain ${registry} OK (stub Phase 2b)`);
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
