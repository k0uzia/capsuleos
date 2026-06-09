#!/usr/bin/env node
/**
 * P4 one-shot — injecte markup tray Neon (boutons + popovers) dans les dérivés KDE.
 * Usage : node root/tools/lab/patch-kde-p4-tray-markup.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const NEON = path.join(ROOT, 'home/Debian/KDE-Neon/index.html');
const neonHtml = fs.readFileSync(NEON, 'utf8');

const trayMatch = neonHtml.match(/<div class="taskbar-tray" aria-label="Zone de notification">[\s\S]*?<\/div>\s*<button type="button" class="taskbar-clock-trigger"/);
if (!trayMatch) {
  console.error('Tray block introuvable dans KDE-Neon/index.html');
  process.exit(1);
}

const popoverMatch = neonHtml.match(/(<div class="kde-tray-popover" id="kde-tray-popover-notifications"[\s\S]*?<div class="volume-popover" id="volume-popover")/);
if (!popoverMatch) {
  console.error('Popovers block introuvable');
  process.exit(1);
}

const trayBlock = `${trayMatch[0].replace(/<button type="button" class="taskbar-clock-trigger"/, '').trim()}\n            `;
const popoverBlock = popoverMatch[1];

const targets = [
  'home/SUSE/openSUSE/index.html',
  'home/Debian/MX-KDE/index.html',
  'home/Debian/Debian-KDE/index.html',
];

const trayRe = /<div class="taskbar-tray" aria-label="Zone de notification">[\s\S]*?<\/div>\s*(?=<button type="button" class="taskbar-clock-trigger")/;
const popoverRe = /<div class="kde-tray-popover" id="kde-tray-popover-notifications"[\s\S]*?(?=<div class="volume-popover" id="volume-popover")/;

for (const rel of targets) {
  const abs = path.join(ROOT, rel);
  let html = fs.readFileSync(abs, 'utf8');
  if (!trayRe.test(html)) {
    console.error(`Tray non remplacé : ${rel}`);
    process.exit(1);
  }
  html = html.replace(trayRe, trayBlock);
  if (popoverRe.test(html)) {
    html = html.replace(popoverRe, popoverBlock);
  } else if (!html.includes('kde-tray-popover-notifications')) {
    html = html.replace(
      /(<div class="volume-popover" id="volume-popover")/,
      `${popoverBlock}\n    `,
    );
  }
  const scriptTag = '<script src="../../../usr/lib/capsuleos/shells/linux/tray-popover-kde.js?v=20260608p4"></script>\n';
  if (!html.includes('tray-popover-kde.js')) {
    html = html.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/linux\/volume\.js"><\/script>)/,
      `${scriptTag}$1`,
    );
  }
  fs.writeFileSync(abs, html);
  console.log(`OK ${rel}`);
}

console.log('Patch tray markup terminé');
