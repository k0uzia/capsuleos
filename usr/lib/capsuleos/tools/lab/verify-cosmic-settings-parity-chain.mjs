#!/usr/bin/env node
/**
 * Vérifie la chaîne Paramètres COSMIC (scaffold PbT) — matrice, playbook, skin, gates.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-cosmic-settings-parity-chain.mjs --id linux-popos
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const errors = [];
const warnings = [];

const parseRegistry = () => {
  const idx = process.argv.indexOf('--id');
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'linux-popos';
};

const readJson = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? JSON.parse(fs.readFileSync(abs, 'utf8')) : null;
};

const runGate = (script, args = []) => {
  const res = spawnSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return res.status === 0;
};

const registry = parseRegistry();
const entry = loadRegistryEntry(registry);
const toolkit = entry.toolkit?.id || entry.toolkit || 'cosmic';

if (toolkit !== 'cosmic') {
  errors.push(`Registry ${registry} : toolkit cosmic requis, reçu ${toolkit}`);
}

const matrix = readJson('root/tools/lab/cosmic-settings-parity-matrix.json');
const playbook = readJson(`root/docs/inventaires/${registry}-cosmic-settings-playbook.json`);
const skinIndexPath = path.join(ROOT, 'home/Debian/PopOS/index.html');
const skinIndex = fs.existsSync(skinIndexPath) ? fs.readFileSync(skinIndexPath, 'utf8') : '';

if (!matrix?.panels?.length) {
  errors.push('cosmic-settings-parity-matrix.json : panels[] absent');
} else if (matrix.panels.length < 20) {
  errors.push(`cosmic-settings-parity-matrix.json : ${matrix.panels.length} panneaux (< 20)`);
}

if (!playbook?.panels?.length) {
  errors.push(`${registry}-cosmic-settings-playbook.json absent ou panels[] vide`);
} else if (playbook.panels.length < matrix?.panels?.length) {
  warnings.push('Playbook : moins de panneaux que la matrice');
}

const p0 = (playbook?.panels || []).filter((p) => p.priority === 'P0');
if (p0.length < 8) {
  errors.push(`Playbook P0 : ${p0.length} panneaux (< 8 attendus)`);
}

if (!skinIndex.includes('data-link="themes"')) {
  errors.push('Skin Pop OS : slot themes absent');
}
if (!fs.existsSync(path.join(ROOT, 'home/Debian/PopOS/style/apps/themes.skin.css'))) {
  errors.push('home/Debian/PopOS/style/apps/themes.skin.css absent');
}

if (!runGate('usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs', ['--id', registry])) {
  errors.push('validate-toolkit-paradigm échec');
}
if (!runGate('usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs', ['--registry', registry, '--strict'])) {
  errors.push('verify-playbook-assets échec');
}

const tail = readJson(`root/docs/inventaires/${registry}-playbook-tail.json`);
if (tail?.status !== 'documented') {
  warnings.push('playbook-tail non documenté (Pbτ)');
}

warnings.forEach((w) => console.warn(`⚠ ${w}`));

if (errors.length) {
  console.error(`✗ verify-cosmic-settings-parity-chain — ${errors.length} écart(s)`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log(
  `✓ verify-cosmic-settings-parity-chain OK — ${registry} `
  + `panels=${playbook.panels.length} P0=${p0.length}`,
);
process.exit(0);
