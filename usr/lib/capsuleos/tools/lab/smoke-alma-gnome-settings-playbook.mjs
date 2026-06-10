#!/usr/bin/env node
/**
 * Smoke playbook Paramètres GNOME — AlmaLinux (inventaire VM + matrices vendor).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-alma-gnome-settings-playbook.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-alma';
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const parityMatrix = JSON.parse(read('root/tools/lab/gnome-settings-parity-matrix-alma.json') || 'null');
const assetsMatrix = JSON.parse(read('root/tools/lab/gnome-settings-assets-matrix-alma.json') || 'null');
const playbookPath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY}-gnome-settings-playbook.json`);
const assetsPath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY}-gnome-settings-assets.json`);
const closurePath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY}-gnome-settings-h6-closure.json`);

if (parityMatrix?.registry !== REGISTRY) {
  errors.push('gnome-settings-parity-matrix-alma.json : registry linux-alma requis (R-LOC1)');
}
if (!parityMatrix?.panels?.length) {
  errors.push('gnome-settings-parity-matrix-alma.json invalide');
}
if (assetsMatrix?.registry !== REGISTRY) {
  errors.push('gnome-settings-assets-matrix-alma.json : registry linux-alma requis');
}
if (!assetsMatrix?.assets?.length) {
  errors.push('gnome-settings-assets-matrix-alma.json invalide');
}
if (!fs.existsSync(playbookPath)) {
  errors.push(`inventaire playbook absent — collect-vm-gnome-settings-playbook.mjs --id ${REGISTRY}`);
} else {
  const playbook = JSON.parse(fs.readFileSync(playbookPath, 'utf8'));
  const opened = playbook.summary?.panelsOpened ?? 0;
  const total = playbook.summary?.panelsTotal ?? 18;
  if (opened < total) {
    errors.push(`playbook : ${opened}/${total} panneaux ouverts`);
  }
  const appearance = (playbook.panels || []).find((p) => p.id === 'appearance');
  const background = (playbook.panels || []).find((p) => p.id === 'background');
  if (!appearance?.gccRunning) errors.push('playbook : panneau appearance non ouvert');
  if (!background?.gccRunning) errors.push('playbook : panneau background non ouvert');
  const accent = (appearance?.controls || []).find((c) => c.id === 'accent' && c.status === 'mapped');
  const wallpaper = (background?.controls || []).find((c) => c.id === 'wallpaper' && c.status === 'mapped');
  if (!accent) errors.push('playbook : accent non mappé');
  if (!wallpaper) errors.push('playbook : wallpaper non mappé');
  if (wallpaper?.vmRaw && !String(wallpaper.vmRaw).includes('almalinux')) {
    errors.push(`playbook : wallpaper VM inattendu (${wallpaper.vmRaw})`);
  }
  const missingAssets = playbook.summary?.assetsMissingOnVm ?? 0;
  if (missingAssets > 0) {
    errors.push(`playbook : ${missingAssets} asset(s) matrice absents sur VM`);
  }
}

if (!fs.existsSync(assetsPath)) {
  errors.push(`inventaire assets absent — collect-vm-gnome-settings-assets.mjs --id ${REGISTRY}`);
}

if (!fs.existsSync(closurePath)) {
  errors.push(`clôture H6 absente — close-h6-gnome-settings.mjs --id ${REGISTRY}`);
}

const collector = read('usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs');
if (!collector.includes('resolveParityMatrix')) {
  errors.push('collecteur : résolution matrice par vendor absente');
}

const storage = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
if (!storage.includes('almaWallpaperCatalog')) {
  errors.push('capsule-theme-storage : catalogue Alma absent');
}
const almaDay = (assetsMatrix?.assets || []).find((a) => a.id === 'wallpaper-almalinux-day');
if (!almaDay?.vmPath?.includes('almalinux-day.jpg')) {
  errors.push('assets-matrix-alma : fond almalinux-day absent');
}

if (errors.length) {
  console.error('smoke-alma-gnome-settings-playbook — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ smoke-alma-gnome-settings-playbook OK — ${REGISTRY} (${parityMatrix.panels.length} panneaux)`);
