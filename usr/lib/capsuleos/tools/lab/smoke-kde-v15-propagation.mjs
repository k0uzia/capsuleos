#!/usr/bin/env node
/**
 * Smoke propagation v15 Paramètres KDE — dérivés Plasma.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const DERIVATIVES = ['linux-debian-kde', 'linux-mx-kde', 'linux-opensuse'];
const errors = [];

for (const id of DERIVATIVES) {
  let skinRel;
  try {
    skinRel = loadRegistryEntry(id).referencePaths?.skin;
  } catch (e) {
    errors.push(`${id} : registry absent (${e.message})`);
    continue;
  }
  const index = fs.readFileSync(path.join(ROOT, skinRel), 'utf8');
  for (const needle of [
    'kde-kconfig-bindings.js',
    'kde-systemsettings-nav.js',
    'kde-systemsettings.js',
    'data-link="themes"',
  ]) {
    if (!index.includes(needle)) {
      errors.push(`${id} : ${needle} absent de ${skinRel}`);
    }
  }
}

const regPath = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
if (!fs.existsSync(regPath)) {
  errors.push('kde-settings-controls-registry.json absent');
}

if (errors.length) {
  console.error('smoke-kde-v15-propagation — échec');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ smoke-kde-v15-propagation OK — ${DERIVATIVES.length} dérivés`);
