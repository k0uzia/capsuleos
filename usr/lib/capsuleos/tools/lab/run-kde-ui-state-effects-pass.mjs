#!/usr/bin/env node
/**
 * Pass KdS — modules Se-Shell / Se-WM câblés (linux-kde-neon).
 * Usage : node usr/lib/capsuleos/tools/lab/run-kde-ui-state-effects-pass.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const errors = [];

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const required = [
  contract.layerConsumers['Se-Shell'].guards,
  contract.layerConsumers['Se-Shell'].bus,
  contract.layerConsumers['Se-WM'].bus,
  'usr/lib/capsuleos/shells/linux/kde-settings-parity.js',
  'home/Debian/KDE-Neon/style/plasma-panel-dock.css',
];

required.forEach((rel) => {
  if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`artefact absent: ${rel}`);
});

const contentLoader = fs.readFileSync(
  path.join(ROOT, 'usr/lib/capsuleos/shells/linux/contentLoader.js'),
  'utf8'
);
['se-toolkit-guards.js', 'se-shell-bus.js', 'se-wm-bus.js'].forEach((needle) => {
  if (!contentLoader.includes(needle)) errors.push(`contentLoader : ${needle} non injecté`);
});

const parity = fs.readFileSync(
  path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-settings-parity.js'),
  'utf8'
);
if (!parity.includes('capsule:panel-height-changed')) {
  errors.push('kde-settings-parity.js : événement panel-height absent');
}

if (errors.length) {
  console.error(`✗ run-kde-ui-state-effects-pass ${registry}`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log(`✓ run-kde-ui-state-effects-pass OK — ${registry}`);
process.exit(0);
