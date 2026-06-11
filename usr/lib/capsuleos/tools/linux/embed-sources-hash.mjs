/**
 * Hash des sources de l'embed Linux — partagé entre build-linux-embed.mjs (écriture)
 * et validate-embed-freshness.mjs (gate : embed périmé si hash divergent).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

export const EMBED_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');
export const EMBED_HASH_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.hash.json');

/** Répertoires/fichiers lus par build-linux-embed.mjs (gabarits, styles, skins, strings, manifeste). */
const SOURCE_DIRS = [
  'usr/share/capsuleos/linux/apps',
  'usr/share/capsuleos/linux/explorers',
  'home/Debian/Mint/apps',
  'home/SUSE/openSUSE/apps',
  'home/Debian/AnduinOS/apps',
  'home/Debian/Debian-KDE/apps',
  'home/Debian/KDE-Neon/apps',
  'home/Debian/Mint/style/apps',
  'home/Debian/Ubuntu/style/apps',
  'home/Debian/AnduinOS/style/apps',
  'home/Debian/PopOS/style/apps',
  'home/Debian/MX-KDE/style/apps',
  'home/SUSE/openSUSE/style/apps',
  'home/RedHat/Fedora/style/apps',
  'home/RedHat/Rocky/style/apps',
  'home/RedHat/Alma/style/apps',
  'home/Debian/Debian-KDE/style/apps',
  'home/Debian/KDE-Neon/style/apps',
];

const SOURCE_FILES = [
  'home/public/.capsule-manifest.json',
  'home/Debian/Mint/content/strings.json',
  'home/Debian/Ubuntu/content/strings.json',
  'home/Debian/AnduinOS/content/strings.json',
  'home/Debian/PopOS/content/strings.json',
  'home/Debian/MX-KDE/content/strings.json',
  'home/SUSE/openSUSE/content/strings.json',
  'home/RedHat/Fedora/content/strings.json',
  'home/RedHat/Rocky/content/strings.json',
  'home/RedHat/Alma/content/strings.json',
  'home/Debian/Debian-KDE/content/strings.json',
  'home/Debian/KDE-Neon/content/strings.json',
];

function walkFiles(dir, out) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(abs, out);
    } else if (/\.(html|css|json)$/.test(ent.name)) {
      out.push(abs);
    }
  }
}

export function computeEmbedSourcesHash() {
  const files = [];
  for (const rel of SOURCE_DIRS) {
    walkFiles(path.join(ROOT, rel), files);
  }
  for (const rel of SOURCE_FILES) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      files.push(abs);
    }
  }
  const h = crypto.createHash('sha256');
  for (const file of files.sort()) {
    h.update(path.relative(ROOT, file));
    h.update('\u0000');
    h.update(fs.readFileSync(file));
    h.update('\u0000');
  }
  return { hash: h.digest('hex'), fileCount: files.length };
}

export function writeEmbedSourcesHash() {
  const { hash, fileCount } = computeEmbedSourcesHash();
  const payload = {
    hash,
    fileCount,
    generatedAt: new Date().toISOString(),
    builder: 'usr/lib/capsuleos/tools/linux/build-linux-embed.mjs',
  };
  fs.mkdirSync(path.dirname(EMBED_HASH_FILE), { recursive: true });
  fs.writeFileSync(EMBED_HASH_FILE, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

export function readEmbedSourcesHash() {
  if (!fs.existsSync(EMBED_HASH_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(EMBED_HASH_FILE, 'utf8'));
}
