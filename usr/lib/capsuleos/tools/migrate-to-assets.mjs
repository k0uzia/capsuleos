#!/usr/bin/env node
/**
 * Migration des images vers usr/share/capsuleos/assets/ (zones autorisées).
 * Usage : node usr/lib/capsuleos/tools/migrate-to-assets.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets');
const DRY = process.argv.includes('--dry-run');

const IMAGE_EXT = new Set(['.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.ico']);

const copyFile = (src, dest) => {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (DRY) {
    console.log('copy', path.relative(ROOT, src), '→', path.relative(ROOT, dest));
    return true;
  }
  if (fs.existsSync(dest)) {
    const a = createHash('md5').update(fs.readFileSync(src)).digest('hex');
    const b = createHash('md5').update(fs.readFileSync(dest)).digest('hex');
    if (a === b) return false;
  }
  fs.copyFileSync(src, dest);
  return true;
};

const copyTree = (srcDir, destDir) => {
  if (!fs.existsSync(srcDir)) return 0;
  let n = 0;
  const walk = (rel) => {
    const abs = path.join(srcDir, rel);
    for (const name of fs.readdirSync(abs)) {
      const relPath = rel ? `${rel}/${name}` : name;
      const full = path.join(srcDir, relPath);
      if (fs.statSync(full).isDirectory()) {
        walk(relPath);
      } else if (IMAGE_EXT.has(path.extname(name).toLowerCase())) {
        if (copyFile(full, path.join(destDir, relPath))) n += 1;
      }
    }
  };
  walk('');
  return n;
};

/** Copie les sous-dossiers connus d'un media/img skin vers assets. */
const migrateSkinMediaImg = (srcMediaImg, toolkit, vendor) => {
  let n = 0;
  const img = srcMediaImg;
  const maps = [
    ['apps', `images/toolkits/${toolkit}/apps`],
    ['category', `images/toolkits/${toolkit}/category`],
    ['header', `images/toolkits/${toolkit}/header`],
    ['panel', `images/toolkits/kde/panel`],
    ['menu', `images/toolkits/${toolkit === 'kde' ? 'kde' : toolkit}/menu`],
    ['menu-rail', 'images/toolkits/kde/menu-rail'],
    ['dock', 'images/toolkits/gnome/dock'],
    ['symbolic', 'images/toolkits/gnome/symbolic'],
    ['actions', 'images/toolkits/gnome/symbolic'],
    ['taskbar', 'images/vendors/anduin/taskbar'],
    ['assets', `images/vendors/${vendor}`],
    ['elements/kde', 'icons/kde/elements'],
    ['elements/places32', 'icons/kde/places32'],
    ['elements/nemo', toolkit === 'kde' ? 'icons/kde/nemo' : 'icons/cinnamon/nemo'],
    ['elements', `images/toolkits/${toolkit}/elements`],
    ['mimeTypes', 'icons/kde/mimeTypes'],
  ];
  for (const [sub, destRel] of maps) {
    const from = path.join(img, sub);
    if (!fs.existsSync(from)) continue;
    n += copyTree(from, path.join(ASSETS, destRel));
  }
  return n;
};

let total = 0;

// 1. Branding pick-os → assets/images/platforms/pick-os
total += copyTree(
  path.join(ROOT, 'usr/share/capsuleos/branding/icons'),
  path.join(ASSETS, 'images/platforms/pick-os')
);
total += copyTree(
  path.join(ROOT, 'usr/share/capsuleos/branding/brands'),
  path.join(ASSETS, 'images/platforms/brands')
);
for (const f of ['accueil.svg', 'capsule.webp']) {
  const src = path.join(ROOT, 'usr/share/capsuleos/branding', f);
  if (copyFile(src, path.join(ASSETS, 'images/common', f))) total += 1;
}

// 2. Packs toolkit canoniques (source unique par toolkit)
const TOOLKIT_SOURCES = [
  { src: 'home/Debian/Mint/media/img', toolkit: 'cinnamon', vendor: 'mint' },
  { src: 'home/Debian/MX-KDE/media/img', toolkit: 'kde', vendor: 'mx' },
  { src: 'home/Debian/Ubuntu/media/img', toolkit: 'gnome', vendor: 'ubuntu' },
  { src: 'home/RedHat/Fedora/media/img', toolkit: 'gnome', vendor: 'fedora' },
  { src: 'home/Debian/PopOS/media/img', toolkit: 'cosmic', vendor: 'popos' },
  { src: 'home/Debian/AnduinOS/media/img', toolkit: 'gnome', vendor: 'anduin' },
  { src: 'home/Debian/Debian-KDE/media/img', toolkit: 'kde', vendor: 'debian' },
  { src: 'home/SUSE/openSUSE/media/img', toolkit: 'kde', vendor: 'opensuse' },
  { src: 'OS/macos/sonoma/media/img', toolkit: 'macos-aqua', vendor: 'common' },
  { src: 'OS/android/assets', toolkit: 'android-material', vendor: 'common', flat: true },
  { src: 'OS/ios/15/media/img', toolkit: 'ios', vendor: 'common', flat: true },
  { src: 'OS/bsd/ghost/media/img', toolkit: 'bsd-ghost', vendor: 'common', flat: true },
];

// Icône portail iOS (legacy OS/ios/15/assets/apple.svg)
const iosAppleLegacy = path.join(ROOT, 'OS/ios/15/assets/apple.svg');
if (fs.existsSync(iosAppleLegacy) && copyFile(iosAppleLegacy, path.join(ASSETS, 'images/platforms/pick-os/ios/apple.svg'))) {
  total += 1;
}

for (const entry of TOOLKIT_SOURCES) {
  const { src, toolkit, vendor, flat } = entry;
  const base = path.join(ROOT, src);
  if (flat) {
    if (src.includes('android/assets')) {
      total += copyTree(path.join(base, 'icones'), path.join(ASSETS, 'images/toolkits/android-material/icones'));
      total += copyTree(path.join(base, 'images'), path.join(ASSETS, 'images/toolkits/android-material/images'));
    } else if (src.endsWith('media/img')) {
      total += copyTree(base, path.join(ASSETS, 'images/toolkits', toolkit));
    }
  } else {
    total += migrateSkinMediaImg(base, toolkit, vendor);
  }
}

// 3. Windows : chaque version + shared + legacy OS/windows/11
const WIN_VERSIONS_DIR = path.join(ROOT, 'OS/windows/versions');
if (fs.existsSync(WIN_VERSIONS_DIR)) {
  for (const ver of fs.readdirSync(WIN_VERSIONS_DIR)) {
    const mediaImg = path.join(WIN_VERSIONS_DIR, ver, 'media/img');
    if (fs.existsSync(mediaImg)) {
      total += copyTree(mediaImg, path.join(ASSETS, 'images/toolkits/windows', ver));
    }
  }
}
total += copyTree(
  path.join(ROOT, 'OS/windows/shared/media/img'),
  path.join(ASSETS, 'images/toolkits/windows/shared')
);
total += copyTree(
  path.join(ROOT, 'OS/windows/11/media/img'),
  path.join(ASSETS, 'images/toolkits/windows/11')
);

// 4. Doublons home/* et OS/linux/families/* (copie si absent ou différent)
const SKIN_DUPLICATES = [
  ['home/Debian/Mint/media/img', 'cinnamon', 'mint'],
  ['home/Debian/MX-KDE/media/img', 'kde', 'mx'],
  ['home/Debian/Ubuntu/media/img', 'gnome', 'ubuntu'],
  ['home/RedHat/Fedora/media/img', 'gnome', 'fedora'],
  ['home/Debian/PopOS/media/img', 'cosmic', 'popos'],
  ['home/Debian/AnduinOS/media/img', 'gnome', 'anduin'],
  ['home/Debian/Debian-KDE/media/img', 'kde', 'debian'],
  ['home/SUSE/openSUSE/media/img', 'kde', 'opensuse'],
  ['OS/linux/families/debian/mint/media/img', 'cinnamon', 'mint'],
  ['OS/linux/families/debian/mx-kde/media/img', 'kde', 'mx'],
  ['OS/linux/families/debian/ubuntu/media/img', 'gnome', 'ubuntu'],
  ['OS/linux/families/redhat/fedora/media/img', 'gnome', 'fedora'],
  ['OS/linux/families/debian/popos/media/img', 'cosmic', 'popos'],
  ['OS/linux/families/debian/anduinos/media/img', 'gnome', 'anduin'],
  ['OS/linux/families/debian/debian-kde/media/img', 'kde', 'debian'],
  ['OS/linux/families/suse/opensuse/media/img', 'kde', 'opensuse'],
];

for (const [rel, toolkit, vendor] of SKIN_DUPLICATES) {
  const mediaImg = path.join(ROOT, rel);
  if (fs.existsSync(mediaImg)) {
    total += migrateSkinMediaImg(mediaImg, toolkit, vendor);
  }
}

// 5. Fichiers isolés sous home|OS/.../assets/ (hors media/img)
const SKIN_FLAT_ASSETS = [
  ['home/Debian/Mint/assets/mint.webp', 'images/vendors/mint/mint.webp'],
  ['OS/linux/families/debian/mint/assets/mint.webp', 'images/vendors/mint/mint.webp'],
  ['home/Debian/Debian-KDE/assets/debian-logo.svg', 'images/vendors/debian/debian-logo.svg'],
  ['home/Debian/Debian-KDE/assets/debian-logo-at.svg', 'images/vendors/debian/debian-logo-at.svg'],
  ['OS/linux/families/debian/debian-kde/assets/debian-logo.svg', 'images/vendors/debian/debian-logo.svg'],
  ['OS/linux/families/debian/debian-kde/assets/debian-logo-at.svg', 'images/vendors/debian/debian-logo-at.svg'],
  ['home/RedHat/Fedora/assets/favicon.svg', 'images/vendors/fedora/favicon.svg'],
  ['OS/linux/families/redhat/fedora/assets/favicon.svg', 'images/vendors/fedora/favicon.svg'],
  ['usr/share/capsuleos/linux/media/img/apps/firefox.png', 'images/toolkits/gnome/apps/firefox.png'],
];

for (const [rel, destRel] of SKIN_FLAT_ASSETS) {
  const src = path.join(ROOT, rel);
  if (copyFile(src, path.join(ASSETS, destRel))) total += 1;
}

console.log(`${DRY ? '[dry-run] ' : ''}Migration : ${total} fichiers copiés/mis à jour vers assets/`);
