#!/usr/bin/env node
/**
 * Smoke — tokens surface opaques AnduinOS (pas de fuite --fedora-app-* non défini).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const errors = [];
const imports = read('home/Debian/AnduinOS/style/imports.css');
const tokens = read('home/Debian/AnduinOS/style/anduin-shell/gnome-app-tokens.css');

if (!imports.includes('gnome-app-tokens.css')) {
  errors.push('imports.css : gnome-app-tokens.css non importé');
}

const required = [
  '--fedora-app-surface:',
  '--fedora-app-header-bg:',
  '--fedora-app-header-alt-bg:',
  '--fedora-app-text:',
  '--fedora-app-terminal-surface:',
  '--fedora-window-surface:',
];

required.forEach((needle) => {
  if (!tokens.includes(needle)) {
    errors.push(`gnome-app-tokens.css : ${needle} manquant`);
  }
});

const rhythmbox = read('home/Debian/AnduinOS/style/apps/rhythmbox.skin.css');
if (!rhythmbox.includes('--ma-bg:')) {
  errors.push('rhythmbox.skin.css : --ma-bg non mappé (base.css attend --ma-*)');
}

const simpleScan = read('home/Debian/AnduinOS/style/apps/simple_scan.skin.css');
if (!simpleScan.includes('--ma-bg:')) {
  errors.push('simple_scan.skin.css : --ma-bg non mappé');
}

const drawing = read('home/Debian/AnduinOS/style/apps/drawing.skin.css');
if (!drawing.includes('background: var(--drawing-bg)')) {
  errors.push('drawing.skin.css : fond opaque manquant sur main#drawingApp');
}

const result = { ok: errors.length === 0, registryId: 'linux-anduinos', errors };
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
