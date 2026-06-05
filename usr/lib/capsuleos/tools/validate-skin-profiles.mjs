#!/usr/bin/env node
/**
 * Valide les profils skin (Phase 0.5.6) : pas de mediaBase ni CAPSULE_MEDIA_BASE legacy.
 * Usage : node usr/lib/capsuleos/tools/validate-skin-profiles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');

const errors = [];

const checkProfile = (file, profile) => {
  const id = profile.id || file;
  if (profile.assets?.mediaBase) {
    errors.push(`${file}: assets.mediaBase obsolète (utiliser assetsBase + toolkitPack)`);
  }
  const globals = profile.capsuleGlobals || {};
  const forbiddenGlobals = [
    'CAPSULE_MEDIA_BASE',
    'CAPSULE_ASSETS_BASE',
    'CAPSULE_KDE_ICONS_BASE',
    'CAPSULE_GNOME_ICONS_BASE',
    'CAPSULE_CINNAMON_ICONS_BASE',
    'CAPSULE_TOOLKIT_ASSETS_BASE',
  ];
  forbiddenGlobals.forEach((key) => {
    if (globals[key]) {
      errors.push(`${file}: ${key} interdit dans capsuleGlobals (utiliser assets.* + CapsuleResource)`);
    }
  });
  if (/home\/Debian\/Mint\/media/i.test(JSON.stringify(profile))) {
    errors.push(`${file}: référence legacy home/Debian/Mint/media`);
  }
  if (!profile.assets?.assetsBase) {
    errors.push(`${file}: assets.assetsBase requis`);
  }
  if (!profile.assets?.toolkitPack) {
    errors.push(`${file}: assets.toolkitPack requis`);
  }
};

if (fs.existsSync(PROFILES_DIR)) {
  for (const file of fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'))) {
    const full = path.join(PROFILES_DIR, file);
    checkProfile(file, JSON.parse(fs.readFileSync(full, 'utf8')));
  }
}

const SKIP_DIRS = new Set(['public', 'node_modules', '.git']);

const scanSkinMirrors = (dir, depth = 0) => {
  if (!fs.existsSync(dir) || depth > 4) return;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const profilePath = path.join(full, 'skin.profile.json');
    if (fs.existsSync(profilePath)) {
      checkProfile(path.relative(ROOT, profilePath), JSON.parse(fs.readFileSync(profilePath, 'utf8')));
    }
    scanSkinMirrors(full, depth + 1);
  }
};

scanSkinMirrors(path.join(ROOT, 'home'));
scanSkinMirrors(path.join(ROOT, 'OS/linux/families'));

if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) profils skin`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}
console.log('✓ validate-skin-profiles OK');
