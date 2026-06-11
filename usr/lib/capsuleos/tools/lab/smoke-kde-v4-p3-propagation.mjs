#!/usr/bin/env node
/**
 * Smoke V4-P3 — propagation Dolphin KDE chrome vers dérivés Plasma.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const KDE_BODIES = ['kde-neon', 'opensuse', 'mx-kde', 'debian-kde'];

const skins = [
  { id: 'linux-kde-neon', index: 'home/Debian/KDE-Neon/index.html', bodyId: 'kde-neon', discover: true },
  { id: 'linux-opensuse', index: 'home/SUSE/openSUSE/index.html', bodyId: 'opensuse', discover: true },
  { id: 'linux-mx-kde', index: 'home/Debian/MX-KDE/index.html', bodyId: 'mx-kde', discover: true },
  { id: 'linux-debian-kde', index: 'home/Debian/Debian-KDE/index.html', bodyId: 'debian-kde', discover: true },
];

const sharedDolphin = 'usr/lib/capsuleos/shells/linux/fileExplorer/dolphin-kde-chrome.js';
const sharedDiscover = 'usr/lib/capsuleos/shells/linux/discover-kde.js';

if (!fs.existsSync(path.join(ROOT, sharedDolphin))) {
  errors.push('module partagé dolphin-kde-chrome.js absent');
}
if (!fs.existsSync(path.join(ROOT, sharedDiscover))) {
  errors.push('module partagé discover-kde.js absent');
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

for (const skin of skins) {
  const html = read(skin.index);
  if (!html.includes('dolphin-kde-chrome.js')) {
    errors.push(`${skin.id} : dolphin-kde-chrome.js non chargé`);
  }
  if (!html.includes('fileExplorerAdvancedChrome.js')) {
    errors.push(`${skin.id} : fileExplorerAdvancedChrome.js absent`);
  }
  if (!html.includes(`body id="${skin.bodyId}"`) && !html.includes(`id="${skin.bodyId}"`)) {
    errors.push(`${skin.id} : body#${skin.bodyId} absent`);
  }
  if (skin.discover && !html.includes('discover-kde.js')) {
    errors.push(`${skin.id} : discover-kde.js absent (pivot)`);
  }
  if (skin.discover && !fs.existsSync(path.join(ROOT, skin.index.replace('index.html', 'content/discover-catalog.json')))) {
    errors.push(`${skin.id} : content/discover-catalog.json absent (V6)`);
  }
  const profilePath = path.join(ROOT, 'etc/capsuleos/profiles', `${skin.id}.json`);
  if (skin.discover && fs.existsSync(profilePath)) {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const override = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES?.update_manager || '';
    if (!override.includes('update_manager_kde_neon.html')) {
      errors.push(`${skin.id} : profil update_manager_kde_neon.html requis (V6)`);
    }
  }
}

const breeze = read('home/Debian/Debian-KDE/style/debian-breeze.css');
if (!breeze.includes('--debian-kde-breeze-accent')) {
  errors.push('debian-breeze.css : tokens --debian-kde-* absents');
}
if (!breeze.includes('--opensuse-breeze-accent: var(--debian-kde-breeze-accent)')) {
  errors.push('debian-breeze.css : alias legacy --opensuse-* manquants');
}

const dolphinSrc = read(sharedDolphin);
if (!dolphinSrc.includes('document.body.id')) {
  errors.push('dolphin-kde-chrome.js : sélection body générique manquante');
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  phase: 'V4-P3',
  errors,
  skins: skins.map((s) => s.id),
  kdeBodies: KDE_BODIES,
}, null, 2));
process.exit(errors.length ? 1 : 0);
