#!/usr/bin/env node
/**
 * Corrige la profondeur des @import vers usr/share/capsuleos/themes/ selon l’emplacement du CSS.
 * Usage : node usr/lib/capsuleos/tools/fix-theme-import-depths.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const THEME = 'usr/share/capsuleos/themes/';
const SCAN = ['home', 'OS', 'usr/share/capsuleos/linux'];

const depthPrefix = (filePath) => {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir || relDir === '.') return './';
  return `${'../'.repeat(relDir.split(path.sep).length)}`;
};

const rewrite = (text, filePath) => {
  const prefix = depthPrefix(filePath);
  const target = `${prefix}${THEME}`;
  return text.replace(
    /@import url\((['"]?)(?:\.\.\/)+usr\/share\/capsuleos\/themes\//gi,
    `@import url($1${target}`,
  );
};

let changed = 0;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'var') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.css')) processFile(full);
  }
};

const processFile = (full) => {
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes('usr/share/capsuleos/themes/')) return;
  const next = rewrite(text, full);
  if (next !== text) {
    changed += 1;
    if (DRY) console.log('[dry-run]', path.relative(ROOT, full));
    else fs.writeFileSync(full, next, 'utf8');
  }
};

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) walk(full);
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} fichier(s) CSS — profondeur themes corrigée`);
