#!/usr/bin/env node
/**
 * Corrige la profondeur usr/lib (5×../ → 4×../) depuis OS/windows/versions/<ver>/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const WIN = path.join(ROOT, 'OS/windows');
const EXT = /\.(html|js|css)$/i;

let n = 0;
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.lstatSync(full).isDirectory()) walk(full);
    else if (EXT.test(name)) {
      let t = fs.readFileSync(full, 'utf8');
      const next = t
        .replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/usr\//g, '../../../../usr/')
        .replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/index\.html/g, '../../../../index.html');
      if (next !== t) {
        n += 1;
        fs.writeFileSync(full, next, 'utf8');
      }
    }
  }
};
if (fs.existsSync(WIN)) walk(WIN);
console.log(`${n} fichier(s) Windows corrigés`);
