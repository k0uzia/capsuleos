#!/usr/bin/env node
/**
 * Réécrit ./assets/ et (../)+assets/ → chemins physiques usr/share/capsuleos/assets/
 * pour familles sans CapsuleResource (Windows versions, Android, iOS, macOS).
 * Usage : node usr/lib/capsuleos/tools/rewrite-physical-asset-paths.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const TARGET = 'usr/share/capsuleos/assets';
const SCAN_ROOTS = ['OS/windows', 'OS/android', 'OS/ios', 'OS/macos'];
const SKIP_DIRS = new Set(['node_modules', '.git']);
const EXT = /\.(html|css|js)$/i;

const APPLE_FAVICON = `${TARGET}/images/platforms/pick-os/ios/apple.svg`;

const physicalPrefix = (filePath) => {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  const depth = relDir ? relDir.split(path.sep).length : 0;
  return depth === 0 ? './' : '../'.repeat(depth);
};

const rewriteText = (text, prefix) => {
  let next = text;
  next = next.replace(/(?:\.\.\/)+assets\//g, `${prefix}${TARGET}/`);
  next = next.replace(/\.\/assets\//g, `${prefix}${TARGET}/`);
  next = next.replace(
    new RegExp(`${TARGET}/apple\\.svg`, 'g'),
    APPLE_FAVICON,
  );
  return next;
};

let changed = 0;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.lstatSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXT.test(name)) continue;
    if (name.includes('rewrite-physical-asset-paths')) continue;
    const prefix = physicalPrefix(full);
    const text = fs.readFileSync(full, 'utf8');
    const next = rewriteText(text, prefix);
    if (next !== text) {
      changed += 1;
      const rel = path.relative(ROOT, full);
      if (DRY) console.log('[dry-run]', rel);
      else fs.writeFileSync(full, next, 'utf8');
    }
  }
};

SCAN_ROOTS.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) walk(full);
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} fichier(s) réécrit(s)`);
