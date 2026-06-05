#!/usr/bin/env node
/**
 * Réécrit url(./assets/…), url(../assets/…), url(./icons/…) en chemins physiques
 * usr/share/capsuleos/assets/ (relatifs au fichier CSS).
 * Le navigateur ne passe pas par CapsuleResource pour les feuilles liées.
 * Usage : node usr/lib/capsuleos/tools/rewrite-css-asset-urls.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const KERNEL = 'usr/share/capsuleos/assets';

const SCAN = ['home', 'OS/linux/families', 'usr/share/capsuleos/linux/apps/style', 'OS/linux/shared'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'var']);

const depthPrefix = (filePath) => {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir || relDir === '.') return './';
  return `${'../'.repeat(relDir.split(path.sep).length)}`;
};

const rewriteUrlPath = (urlPath, filePath) => {
  let u = urlPath.trim();
  if (/^(https?:|data:|blob:|#|\/\/)/i.test(u)) return u;
  if (u.includes(KERNEL)) {
    const prefix = depthPrefix(filePath);
    const expected = `${prefix}${KERNEL}/`;
    if (u.startsWith(expected)) return u;
    const tail = u.replace(/^.*usr\/share\/capsuleos\/assets\//, '');
    return `${prefix}${KERNEL}/${tail}`;
  }

  const prefix = depthPrefix(filePath);

  if (u.startsWith('./assets/')) {
    return `${prefix}${KERNEL}/${u.slice('./assets/'.length)}`;
  }
  if (u.startsWith('./icons/')) {
    return `${prefix}${KERNEL}/${u.slice(2)}`;
  }
  if (u.startsWith('../assets/')) {
    return `${prefix}${KERNEL}/${u.slice('../assets/'.length)}`;
  }
  if (u.startsWith('../icons/')) {
    return `${prefix}${KERNEL}/${u.slice('../icons/'.length)}`;
  }

  const assetsRel = u.match(/^((?:\.\.\/)+)assets\/(.+)$/);
  if (assetsRel) {
    return `${prefix}${KERNEL}/${assetsRel[2]}`;
  }
  const iconsRel = u.match(/^((?:\.\.\/)+)icons\/(.+)$/);
  if (iconsRel) {
    return `${prefix}${KERNEL}/icons/${iconsRel[2]}`;
  }

  return u;
};

const rewriteCss = (text, filePath) =>
  text.replace(/url\((['"]?)([^'")]+)\1?\)/gi, (full, quote, inner) => {
    const bare = inner.split('?')[0].trim();
    if (!/\/(assets|icons)\//.test(bare) && !bare.startsWith('./assets') && !bare.startsWith('../assets')) {
      return full;
    }
    const next = rewriteUrlPath(bare, filePath);
    if (next === bare) return full;
    const q = quote || '';
    return `url(${q}${next}${q})`;
  });

let changed = 0;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.lstatSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith('.css')) continue;
    if (name.includes('rewrite-css-asset-urls')) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (!/url\([^)]*(?:assets|icons)\//i.test(text)) continue;
    const next = rewriteCss(text, full);
    if (next !== text) {
      changed += 1;
      const rel = path.relative(ROOT, full);
      if (DRY) console.log('[dry-run]', rel);
      else fs.writeFileSync(full, next, 'utf8');
    }
  }
};

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) walk(full);
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} fichier(s) CSS mis à jour`);
