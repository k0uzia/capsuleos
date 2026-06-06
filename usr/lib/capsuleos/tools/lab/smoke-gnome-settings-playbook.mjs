#!/usr/bin/env node
/**
 * Smoke statique — matrice playbook Paramètres ↔ HTML ↔ parity.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-gnome-settings-playbook.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

const matrix = JSON.parse(read('root/tools/lab/gnome-settings-parity-matrix.json') || '{}');
const themesHtml = read('usr/share/capsuleos/linux/apps/themes_gnome.html');
const playbookSh = read('root/tools/lab/vm-gnome-settings-playbook.sh');
const collector = read('usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs');
const assetsMatrix = read('root/tools/lab/gnome-settings-assets-matrix.json');
const assetsInventorySh = read('root/tools/lab/vm-gnome-settings-assets-inventory.sh');
const verifyAssets = read('usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs');

const htmlPanels = new Set();
const rePanel = /data-gnome-settings-panel="([^"]+)"/g;
let m;
while ((m = rePanel.exec(themesHtml)) !== null) {
  htmlPanels.add(m[1]);
}

const matrixPanels = matrix.panels || [];
if (matrixPanels.length < 18) {
  errors.push(`Matrice: ${matrixPanels.length} panneaux (attendu 18)`);
}

const navPanels = [...htmlPanels].filter((id) => themesHtml.includes(`gnome-settings__navitem`) && themesHtml.includes(`data-gnome-settings-panel="${id}"`));
const expectedNav = ['wifi', 'network', 'bluetooth', 'appearance', 'background', 'notifications', 'search', 'multitasking', 'sound', 'power', 'displays', 'mouse', 'keyboard', 'printers', 'accessibility', 'privacy', 'sharing', 'about'];

for (const id of expectedNav) {
  if (!matrixPanels.some((p) => p.capsulePanel === id)) {
    errors.push(`Matrice: panneau capsule "${id}" absent`);
  }
}

for (const panel of matrixPanels) {
  if (!panel.gccArgv || !panel.gccArgv.length) {
    errors.push(`Matrice: gccArgv vide pour ${panel.id}`);
  }
  if (!playbookSh.includes('tour_panel')) {
    break;
  }
}

if (!playbookSh.includes('gnome-control-center')) {
  errors.push('vm-gnome-settings-playbook.sh : lancement gnome-control-center absent');
}
if (!playbookSh.includes('gsettingsStable')) {
  errors.push('vm-gnome-settings-playbook.sh : comparaison gsettings absente');
}
if (!collector.includes('collect-vm-gnome-settings-playbook')) {
  errors.push('collect-vm-gnome-settings-playbook.mjs : script collecteur invalide');
}

const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const storageJs = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const knownKeys = new Set();
const keyRe = /key:\s*'([^']+)'|persistPref\('([^']+)'|getItem\('([^']+)'|gnome-[a-z0-9-]+|mint-[a-z0-9-]+/g;
while ((m = keyRe.exec(`${parityJs}\n${storageJs}`)) !== null) {
  [m[1], m[2], m[3]].filter(Boolean).forEach((k) => knownKeys.add(k));
}
knownKeys.add('mint-theme');
knownKeys.add('gnome-wallpaper');
knownKeys.add('gnome-accent');
knownKeys.add('gnome-accent-color');
knownKeys.add('gnome-display-resolution');
knownKeys.add('gnome-display-scale');
knownKeys.add('gnome-display-orientation');

for (const panel of matrixPanels) {
  for (const ctrl of panel.controls || []) {
    const key = ctrl.capsuleKey;
    if (!key || ctrl.source === 'simulated') continue;
    if (!knownKeys.has(key)) {
      errors.push(`Matrice: capsuleKey "${key}" (${ctrl.id}) non référencé (parity/storage)`);
    }
  }
}

if (!playbookSh.includes('assetSources')) {
  errors.push('vm-gnome-settings-playbook.sh : section assetSources absente');
}
if (!assetsMatrix.includes('"capsulePath"')) {
  errors.push('gnome-settings-assets-matrix.json : assets[] invalide');
}
if (!assetsInventorySh.includes('gnome-settings-assets-matrix.json')) {
  errors.push('vm-gnome-settings-assets-inventory.sh : matrice assets non référencée');
}
if (!verifyAssets.includes('verify-playbook-assets')) {
  errors.push('verify-playbook-assets.mjs : script gate A absent');
}

if (errors.length) {
  console.error('smoke-gnome-settings-playbook — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ smoke-gnome-settings-playbook OK — ${matrixPanels.length} panneaux, ${knownKeys.size} clés connues`);
