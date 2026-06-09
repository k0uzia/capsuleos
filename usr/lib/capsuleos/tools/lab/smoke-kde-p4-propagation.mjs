#!/usr/bin/env node
/**
 * Smoke P4 — propagation toolkit KDE Neon → dérivés.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const skins = [
  {
    id: 'linux-opensuse',
    index: 'home/SUSE/openSUSE/index.html',
    imports: 'home/SUSE/openSUSE/style/imports.css',
    launcher: 'opensuse-launcher.svg',
    panelDock: true,
  },
  {
    id: 'linux-mx-kde',
    index: 'home/Debian/MX-KDE/index.html',
    imports: 'home/Debian/MX-KDE/style/imports.css',
    launcher: 'mx-logo.png',
    panelDock: true,
  },
  {
    id: 'linux-debian-kde',
    index: 'home/Debian/Debian-KDE/index.html',
    imports: 'home/Debian/Debian-KDE/style/imports.css',
    launcher: 'start-here-kde.svg',
    panelDock: true,
  },
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

for (const skin of skins) {
  const html = read(skin.index);
  const css = read(skin.imports);

  if (!html.includes('tray-popover-kde.js')) {
    errors.push(`${skin.id} : script tray-popover-kde.js absent`);
  }
  if (!html.includes('id="tray-btn-clipboard"')) {
    errors.push(`${skin.id} : boutons tray Neon absents`);
  }
  if (!html.includes('kde-tray-popover-network')) {
    errors.push(`${skin.id} : popover réseau absent`);
  }
  if (!css.includes('tray-popover-kde.base.css')) {
    errors.push(`${skin.id} : import tray-popover-kde.base.css absent`);
  }
  if (skin.panelDock && !css.includes('plasma-panel-dock.css')) {
    errors.push(`${skin.id} : plasma-panel-dock.css non importé`);
  }
  if (!html.includes(skin.launcher)) {
    errors.push(`${skin.id} : launcher vendor ${skin.launcher} absent (spécificité)`);
  }
}

const sharedJs = read('usr/lib/capsuleos/shells/linux/tray-popover-kde.js');
if (!sharedJs.includes('mx-kde') || !sharedJs.includes('debian-kde') || !sharedJs.includes('opensuse')) {
  errors.push('tray-popover-kde.js : body ids dérivés manquants');
}

console.log(JSON.stringify({ ok: errors.length === 0, errors, skins: skins.length }, null, 2));
process.exit(errors.length ? 1 : 0);
