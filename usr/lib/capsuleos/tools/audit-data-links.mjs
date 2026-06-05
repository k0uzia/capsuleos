#!/usr/bin/env node
/**
 * Vérifie que les data-link des skins Linux référencent des apps embed connues.
 * Usage : node usr/lib/capsuleos/tools/audit-data-links.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const EMBED = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');

const SKINS = [
  'home/Debian/Mint/index.html',
  'home/Debian/Ubuntu/index.html',
  'home/Debian/PopOS/index.html',
  'home/Debian/AnduinOS/index.html',
  'home/Debian/MX-KDE/index.html',
  'home/Debian/Debian-KDE/index.html',
  'home/SUSE/openSUSE/index.html',
  'home/RedHat/Fedora/index.html',
];

const errors = [];
const warnings = [];

if (!fs.existsSync(EMBED)) {
  console.error('✗ capsule-app-embed.js manquant — lancer build-linux-embed.mjs');
  process.exit(1);
}

const embedText = fs.readFileSync(EMBED, 'utf8');
const embedMatch = embedText.match(/window\.CAPSULE_APP_EMBED = (\{[\s\S]*?\});/);
if (!embedMatch) {
  console.error('✗ Impossible de parser CAPSULE_APP_EMBED');
  process.exit(1);
}
// eslint-disable-next-line no-eval
const embedData = eval(`(${embedMatch[1]})`);
const templateKeys = new Set(Object.keys(embedData.templates || {}));
const SHELL_ALIASES = new Set(['nemo']);

const extractLinks = (html) => {
  const ids = new Set();
  const re = /data-(?:link|overview-link|cosmic-app-link)=["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(html))) ids.add(match[1]);
  return ids;
};

const knownDecorative = new Set(['null', '']);

for (const rel of SKINS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`Skin introuvable: ${rel}`);
    continue;
  }
  const html = fs.readFileSync(full, 'utf8');
  for (const id of extractLinks(html)) {
    if (knownDecorative.has(id)) continue;
    if (!templateKeys.has(id) && !SHELL_ALIASES.has(id)) {
      errors.push(`${rel}: data-link "${id}" absent de CAPSULE_APP_EMBED`);
    }
  }
}

if (warnings.length) {
  warnings.forEach((w) => console.warn(`⚠ ${w}`));
}

if (errors.length) {
  console.error(`\n✗ audit-data-links : ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ audit-data-links OK — ${SKINS.length} skins, ${templateKeys.size} gabarits embed`);
