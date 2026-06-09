#!/usr/bin/env node
/**
 * Alias icônes menu Mint : gnome/apps → cinnamon/apps (symlinks relatifs).
 * Les packs dash/ et overview/ restent GNOME-only (Ubuntu/Fedora).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs
 *   node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const GNOME_APPS = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/gnome/apps');
const CINNAMON_APPS = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/cinnamon/apps');
const RASTER_EXT_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/cinnamon-app-raster-ext.js');
const DRY = process.argv.includes('--dry-run');
const SKIP_DIRS = new Set(['dash', 'overview']);
const RASTER_SUFFIX = /\.(png|svg|webp|jpg|xpm|gif)$/i;

const hasRasterSuffix = (name) => RASTER_SUFFIX.test(name);

const detectRasterExt = (absPath) => {
  try {
    const real = fs.realpathSync(absPath);
    const head = fs.readFileSync(real).subarray(0, 8).toString('utf8');
    if (head.startsWith('\u0089PNG')) {
      return 'png';
    }
    if (head.indexOf('<') === 0 || head.indexOf('<?xml') === 0) {
      return 'svg';
    }
    const mime = execFileSync('file', ['-b', real], { encoding: 'utf8' });
    if (mime.indexOf('PNG') >= 0) {
      return 'png';
    }
    if (mime.indexOf('SVG') >= 0) {
      return 'svg';
    }
  } catch {
    return 'svg';
  }
  return 'svg';
};

let created = 0;
let skipped = 0;

if (!fs.existsSync(GNOME_APPS)) {
  console.error('✗ gnome/apps introuvable');
  process.exit(1);
}

if (!DRY && !fs.existsSync(CINNAMON_APPS)) {
  fs.mkdirSync(CINNAMON_APPS, { recursive: true });
}

for (const name of fs.readdirSync(GNOME_APPS)) {
  if (SKIP_DIRS.has(name)) {
    continue;
  }
  const src = path.join(GNOME_APPS, name);
  let st;
  try {
    st = fs.lstatSync(src);
  } catch {
    continue;
  }
  if (!st.isFile()) {
    continue;
  }
  const dest = path.join(CINNAMON_APPS, name);
  if (fs.existsSync(dest)) {
    skipped += 1;
    continue;
  }
  const rel = path.relative(CINNAMON_APPS, src);
  if (DRY) {
    console.log(`[dry-run] ${name} → ${rel}`);
  } else {
    fs.symlinkSync(rel, dest);
  }
  created += 1;
}

let rasterAliases = 0;
let rasterFixed = 0;
const rasterExtMap = {};
for (const name of fs.readdirSync(CINNAMON_APPS)) {
  if (SKIP_DIRS.has(name) || hasRasterSuffix(name)) {
    continue;
  }
  const base = path.join(CINNAMON_APPS, name);
  let st;
  try {
    st = fs.lstatSync(base);
  } catch {
    continue;
  }
  if (!st.isFile() && !st.isSymbolicLink()) {
    continue;
  }
  const ext = detectRasterExt(base);
  rasterExtMap[name] = ext;
  const aliasName = `${name}.${ext}`;
  const aliasDest = path.join(CINNAMON_APPS, aliasName);
  const wrongSvg = path.join(CINNAMON_APPS, `${name}.svg`);
  if (ext === 'png' && fs.existsSync(wrongSvg)) {
    try {
      const wrongTarget = fs.realpathSync(wrongSvg);
      const baseTarget = fs.realpathSync(base);
      if (wrongTarget === baseTarget) {
        if (DRY) {
          console.log(`[dry-run] fix ${name}.svg → ${name}.png`);
        } else {
          fs.unlinkSync(wrongSvg);
        }
        rasterFixed += 1;
      }
    } catch {
      /* ignore */
    }
  }
  if (fs.existsSync(aliasDest)) {
    continue;
  }
  if (DRY) {
    console.log(`[dry-run] alias ${aliasName} → ${name}`);
  } else {
    fs.symlinkSync(name, aliasDest);
  }
  rasterAliases += 1;
}

if (!DRY) {
  const mapLines = Object.keys(rasterExtMap).sort().map((key) => `    '${key}': '${rasterExtMap[key]}',`);
  const js = `/** Généré par sync-cinnamon-app-icons.mjs — ne pas éditer à la main. */
(function initCinnamonAppRasterExt(global) {
  'use strict';
  global.CAPSULE_CINNAMON_APP_RASTER_EXT = {
${mapLines.join('\n')}
  };
}(typeof window !== 'undefined' ? window : globalThis));
`;
  fs.writeFileSync(RASTER_EXT_JS, js);
}

const NEMO_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/icons/cinnamon/nemo');
const NEMO_SYMBOLIC = [
  ['view-more-symbolic.svg', '../../gnome/adwaita/symbolic/actions/view-more-symbolic.svg'],
  ['find-location-symbolic.svg', '../../gnome/adwaita/symbolic/actions/find-location-symbolic.svg'],
];
let nemoLinks = 0;
if (fs.existsSync(NEMO_DIR)) {
  NEMO_SYMBOLIC.forEach(([name, target]) => {
    const dest = path.join(NEMO_DIR, name);
    if (fs.existsSync(dest)) {
      return;
    }
    if (DRY) {
      console.log(`[dry-run] nemo/${name} → ${target}`);
    } else {
      fs.symlinkSync(target, dest);
    }
    nemoLinks += 1;
  });
}

console.log(`✓ sync-cinnamon-app-icons — ${created} lien(s)${DRY ? ' (dry-run)' : ''}, ${skipped} déjà présent(s), ${rasterAliases} alias raster, ${rasterFixed} svg→png corrigé(s), ${nemoLinks} nemo symbolic`);
