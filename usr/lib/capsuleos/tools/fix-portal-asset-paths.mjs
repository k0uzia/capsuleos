#!/usr/bin/env node
/**
 * Corrige les chemins ././assets et ../.././assets → usr/share/capsuleos/assets (portail + hubs).
 * Usage : node usr/lib/capsuleos/tools/fix-portal-asset-paths.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const TARGET = 'usr/share/capsuleos/assets';

const REPLACEMENTS = [
  [/(\.\.\/)+(\.\/assets\/)/g, (m, dots) => `${dots}${TARGET}/`],
  [/\.\/(\.\/assets\/)/g, `./${TARGET}/`],
];

const SKIP = new Set(['node_modules', '.git', 'var/lib/capsuleos/generated']);
const EXT = /\.(html|js|css|json)$/i;

let changed = 0;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.lstatSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXT.test(name)) continue;
    if (name.includes('fix-portal-asset-paths')) continue;
    let text = fs.readFileSync(full, 'utf8');
    let next = text;
    for (const [re, rep] of REPLACEMENTS) {
      next = next.replace(re, rep);
    }
    if (next !== text) {
      changed += 1;
      const rel = path.relative(ROOT, full);
      if (DRY) console.log('[dry-run]', rel);
      else fs.writeFileSync(full, next, 'utf8');
    }
  }
};

['index.html', 'home', 'OS', 'usr/lib/capsuleos'].forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    if (fs.statSync(full).isFile()) {
      let text = fs.readFileSync(full, 'utf8');
      let next = text;
      for (const [re, rep] of REPLACEMENTS) next = next.replace(re, rep);
      if (next !== text) {
        changed += 1;
        if (DRY) console.log('[dry-run]', rel);
        else fs.writeFileSync(full, next, 'utf8');
      }
    } else walk(full);
  }
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} fichier(s) corrigés`);
