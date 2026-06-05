#!/usr/bin/env node
/**
 * Supprime les images migrées sous home et OS (media, android/assets), branding.
 * Usage : node usr/lib/capsuleos/tools/prune-skin-media.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const IMAGE_EXT = new Set(['.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.ico']);

let removed = 0;

const pruneImagesInDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const f = path.join(dir, name);
    let st;
    try {
      st = fs.lstatSync(f);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      pruneImagesInDir(f);
      continue;
    }
    if (IMAGE_EXT.has(path.extname(name).toLowerCase())) {
      if (DRY) console.log('rm', path.relative(ROOT, f));
      else fs.unlinkSync(f);
      removed += 1;
    }
  }
};

const findSkinRoots = (dir) => {
  const roots = [];
  if (!fs.existsSync(dir)) return roots;
  const scan = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      const media = path.join(full, 'media');
      const assets = path.join(full, 'assets');
      if (fs.existsSync(path.join(full, 'media/img')) || fs.existsSync(path.join(full, 'media'))) {
        roots.push(full);
      } else if (name === 'assets') {
        const skinRoot = path.dirname(full);
        const isLinuxOrHomeSkin =
          /home[/\\](?:Debian|RedHat|SUSE)[/\\]/i.test(full) ||
          /OS[/\\]linux[/\\]families[/\\]/i.test(full);
        const isAndroid = /OS[/\\]android[/\\]assets$/i.test(full);
        if (
          isAndroid ||
          (isLinuxOrHomeSkin &&
            (fs.existsSync(path.join(skinRoot, 'index.html')) ||
              fs.existsSync(path.join(skinRoot, 'skin.profile.json'))))
        ) {
          roots.push(skinRoot);
        }
      } else {
        scan(full);
      }
    }
  };
  scan(dir);
  return roots;
};

const targets = new Set();
for (const base of ['home', 'OS']) {
  for (const r of findSkinRoots(path.join(ROOT, base))) {
    targets.add(r);
  }
}

for (const skinRoot of targets) {
  const mediaDir = path.join(skinRoot, 'media');
  if (fs.existsSync(mediaDir)) pruneImagesInDir(mediaDir);
  const skinAssets = path.join(skinRoot, 'assets');
  if (fs.existsSync(skinAssets)) {
    pruneImagesInDir(skinAssets);
    // Retirer le dossier assets vide (sauf android géré plus bas)
    if (!/android/i.test(skinRoot)) {
      try {
        const left = fs.readdirSync(skinAssets);
        if (left.length === 0) {
          if (DRY) console.log('rmdir', path.relative(ROOT, skinAssets));
          else fs.rmdirSync(skinAssets);
        }
      } catch {
        /* non vide */
      }
    }
  }
}

// linux/content et shared/content : doublons pédagogiques migrés vers home/public/Images
for (const rel of [
  'OS/linux/shared/content/Dossier_personnel/Images',
  'usr/share/capsuleos/linux/content/Dossier_personnel/Images',
]) {
  pruneImagesInDir(path.join(ROOT, rel));
}

// media/img noyau linux (firefox etc. → assets/)
pruneImagesInDir(path.join(ROOT, 'usr/share/capsuleos/linux/media'));

// Branding legacy (copié vers assets/)
const branding = path.join(ROOT, 'usr/share/capsuleos/branding');
if (fs.existsSync(branding)) {
  pruneImagesInDir(path.join(branding, 'icons'));
  pruneImagesInDir(path.join(branding, 'brands'));
  for (const f of ['accueil.svg', 'capsule.webp']) {
    const p = path.join(branding, f);
    if (fs.existsSync(p) && !fs.lstatSync(p).isSymbolicLink()) {
      if (DRY) console.log('rm', path.relative(ROOT, p));
      else fs.unlinkSync(p);
      removed += 1;
    }
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}${removed} images supprimées des skins / branding (doublons migrés)`);
