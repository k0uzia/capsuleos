#!/usr/bin/env node
/**
 * Corrige la profondeur des url(…usr/share/capsuleos/assets/…) dans les CSS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const KERNEL = 'usr/share/capsuleos/assets';
const SCAN = ['home', 'OS', 'usr/share/capsuleos/linux/apps/style'];

const depthPrefix = (filePath) => {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir || relDir === '.') return './';
  return `${'../'.repeat(relDir.split(path.sep).length)}`;
};

let changed = 0;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'var') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.css')) fixFile(full);
  }
};

const fixFile = (full) => {
  const prefix = depthPrefix(full);
  const expected = `${prefix}${KERNEL}/`;
  let text = fs.readFileSync(full, 'utf8');
  const next = text.replace(
    /url\((['"]?)(\.\.\/)+usr\/share\/capsuleos\/assets\/([^'")]+)\1?\)/gi,
    (m, q, _dots, tail) => `url(${q || ''}${expected}${tail}${q || ''})`,
  );
  if (next !== text) {
    changed += 1;
    fs.writeFileSync(full, next, 'utf8');
  }
};

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) walk(full);
});
console.log(`${changed} fichier(s) CSS normalisés`);
