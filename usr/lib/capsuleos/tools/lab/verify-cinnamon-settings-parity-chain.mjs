#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres Cinnamon : matrice ↔ parity ↔ bindings ↔ HTML ↔ skin.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-cinnamon-settings-parity-chain.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/verify-cinnamon-settings-parity-chain.mjs --id linux-mint --strict
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

const strict = process.argv.includes('--strict');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-mint').trim();

const matrixPath = path.join(ROOT, 'root/tools/lab/cinnamon-settings-parity-matrix.json');
if (!fs.existsSync(matrixPath)) {
  errors.push('Matrice cinnamon-settings-parity-matrix.json absente');
}
const matrix = fs.existsSync(matrixPath)
  ? JSON.parse(fs.readFileSync(matrixPath, 'utf8'))
  : { panels: [] };

const parityJs = read('usr/lib/capsuleos/shells/linux/cinnamon-settings-parity.js');
const storeJs = read('usr/lib/capsuleos/shells/linux/cinnamon-gsettings-store.js');
const bindingsJs = read('usr/lib/capsuleos/shells/linux/cinnamon-gsettings-bindings.js');
const settingsHtml = read('usr/share/capsuleos/linux/apps/cinnamon_settings.html');
const skinIndex = read('home/Debian/Mint/index.html');

function effectHandlerKeys(js) {
  const block = js.match(/var EFFECT_HANDLERS = \{([\s\S]*?)\n    \};/);
  if (!block) return new Set();
  const keys = new Set();
  const re = /^\s{8}'([^']+)':/gm;
  let m;
  while ((m = re.exec(block[1])) !== null) keys.add(m[1]);
  return keys;
}

const handlerKeys = effectHandlerKeys(parityJs);

if (!parityJs.includes('EFFECT_HANDLERS')) {
  errors.push('cinnamon-settings-parity.js : EFFECT_HANDLERS absent');
}
if (!parityJs.includes('CapsuleCinnamonGSettings') && !parityJs.includes('gs()')) {
  errors.push('cinnamon-settings-parity.js : store Cinnamon absent');
}
if (!storeJs.includes('CapsuleCinnamonGSettings')) {
  errors.push('cinnamon-gsettings-store.js : API CapsuleCinnamonGSettings absente');
}
if (!bindingsJs.includes('CAPSULE_CINNAMON_GSETTINGS_BINDINGS')) {
  errors.push('cinnamon-gsettings-bindings.js : CAPSULE_CINNAMON_GSETTINGS_BINDINGS absent');
}
if (!skinIndex.includes('cinnamon-gsettings-bindings.js')) {
  errors.push('home/Debian/Mint/index.html : cinnamon-gsettings-bindings.js absent');
}
if (!skinIndex.includes('cinnamon-gsettings-store.js')) {
  errors.push('home/Debian/Mint/index.html : cinnamon-gsettings-store.js absent');
}
if (!skinIndex.includes('cinnamon-settings-parity.js')) {
  errors.push('home/Debian/Mint/index.html : cinnamon-settings-parity.js absent');
}

const bindingsPos = skinIndex.indexOf('cinnamon-gsettings-bindings.js');
const storePos = skinIndex.indexOf('cinnamon-gsettings-store.js');
const parityPos = skinIndex.indexOf('cinnamon-settings-parity.js');
if (bindingsPos >= 0 && storePos >= 0 && bindingsPos > storePos) {
  errors.push('Mint index : bindings doit précéder store');
}
if (storePos >= 0 && parityPos >= 0 && storePos > parityPos) {
  errors.push('Mint index : store doit précéder parity');
}

let generatedBindings = {};
const bindingsMatch = bindingsJs.match(/CAPSULE_CINNAMON_GSETTINGS_BINDINGS = (\{[\s\S]*?\});/);
if (bindingsMatch) {
  try {
    generatedBindings = JSON.parse(bindingsMatch[1]);
  } catch (e) {
    errors.push(`cinnamon-gsettings-bindings.js : JSON invalide (${e.message})`);
  }
}

for (const panel of matrix.panels || []) {
  for (const ctrl of panel.controls || []) {
    if (!ctrl.capsuleKey || !ctrl.schema || !ctrl.key) continue;
    const entry = generatedBindings[ctrl.capsuleKey];
    if (!entry) {
      errors.push(`bindings : absent pour ${ctrl.capsuleKey}`);
      continue;
    }
    if (entry.schema !== ctrl.schema || entry.key !== ctrl.key) {
      errors.push(`bindings : dérive ${ctrl.capsuleKey} (${entry.schema}::${entry.key})`);
    }
    if (!handlerKeys.has(ctrl.capsuleKey)) {
      warnings.push(`EFFECT_HANDLERS : absent pour ${ctrl.capsuleKey}`);
    }
    if (ctrl.capsuleKey && !settingsHtml.includes(`data-cs-capsule-key="${ctrl.capsuleKey}"`)) {
      const wired = `data-cs-capsule-key="${ctrl.capsuleKey}"`;
      if (!parityJs.includes(ctrl.capsuleKey)) {
        errors.push(`HTML/parity : ${ctrl.capsuleKey} non câblé`);
      } else if (!settingsHtml.includes('data-cs-capsule-key') && !settingsHtml.includes(ctrl.id)) {
        warnings.push(`HTML : ${ctrl.capsuleKey} — vérif manuelle panneau dynamique`);
      }
    }
  }
}

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json');
if (!fs.existsSync(contractPath)) {
  errors.push('Contrat settings-effects-chain.json absent');
}

if (errors.length) {
  console.error(`verify-cinnamon-settings-parity-chain ${registry} — échec\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

console.log(`✓ verify-cinnamon-settings-parity-chain ${registry} OK`);
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
if (strict && warnings.length) process.exit(1);
