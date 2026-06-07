#!/usr/bin/env node
/**
 * Smoke playbook Paramètres GNOME — Rocky (inventaire VM + matrices vendor).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-rocky-gnome-settings-playbook.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-rocky';
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const parityMatrix = JSON.parse(read('root/tools/lab/gnome-settings-parity-matrix-rocky.json') || 'null');
const assetsMatrix = JSON.parse(read('root/tools/lab/gnome-settings-assets-matrix-rocky.json') || 'null');
const playbookPath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY}-gnome-settings-playbook.json`);
const assetsPath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY}-gnome-settings-assets.json`);

if (!parityMatrix?.panels?.length) {
  errors.push('gnome-settings-parity-matrix-rocky.json invalide');
}
if (!assetsMatrix?.assets?.length) {
  errors.push('gnome-settings-assets-matrix-rocky.json invalide');
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
  if (wallpaper?.vmRaw && !String(wallpaper.vmRaw).includes('rocky-default')) {
    errors.push(`playbook : wallpaper VM inattendu (${wallpaper.vmRaw})`);
  }
}

if (!fs.existsSync(assetsPath)) {
  errors.push(`inventaire assets absent — collect-vm-gnome-settings-assets.mjs --id ${REGISTRY}`);
}

const collector = read('usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs');
if (!collector.includes('resolveParityMatrix')) {
  errors.push('collecteur : résolution matrice par vendor absente');
}
if (!collector.includes('CAPSULE_SETTINGS_ASSETS_MATRIX')) {
  errors.push('collecteur : matrice assets non transmise à la VM');
}

const storage = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
if (!storage.includes('rockyWallpaperCatalog') && !storage.includes('gemstone-skies')) {
  errors.push('capsule-theme-storage : catalogue Rocky absent');
}
const webpAsset = (assetsMatrix?.assets || []).find((a) => a.capsulePath?.endsWith('.webp'));
if (!webpAsset) {
  errors.push('assets-matrix-rocky : aucun fond WebP référencé');
}

if (errors.length) {
  console.error('smoke-rocky-gnome-settings-playbook — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ smoke-rocky-gnome-settings-playbook OK — ${REGISTRY} (${parityMatrix.panels.length} panneaux)`);
