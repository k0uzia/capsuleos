#!/usr/bin/env node
/**
 * Vérifie que chaque url(…) pointant vers assets/icons existe sur disque.
 * Usage : node usr/lib/capsuleos/tools/validate-css-asset-urls.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SCAN = ['home', 'OS/linux/families', 'OS/windows', 'OS/android', 'OS/ios', 'OS/macos', 'usr/share/capsuleos/linux/apps/style'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'var/lib/capsuleos/generated']);

const errors = [];

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (/[/\\]OS[/\\]windows[/\\]11[/\\]/.test(full) && !/versions/.test(full)) continue;
    if (fs.lstatSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith('.css')) continue;
    checkCss(full);
  }
};

const checkCss = (full) => {
  const rel = path.relative(ROOT, full);
  const text = fs.readFileSync(full, 'utf8');
  const dir = path.dirname(full);
  const re = /url\((['"]?)([^'")]+)\1?\)/gi;
  let m;
  while ((m = re.exec(text))) {
    const u = m[2].trim().split('?')[0];
    if (/^(https?:|data:|#|\/\/)/i.test(u)) continue;
    if (!u.includes('assets/') && !u.includes('icons/') && !u.includes('fonts/')) continue;
    const resolved = path.normalize(path.join(dir, u));
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel}: url(${u})`);
    }
  }
  const imp = /@import url\((['"]?)([^'")]+)\1?\)/gi;
  while ((m = imp.exec(text))) {
    const u = m[2].trim().split('?')[0];
    if (/^(https?:|data:|#|\/\/)/i.test(u)) continue;
    const resolved = path.normalize(path.join(dir, u));
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel}: @import(${u})`);
    }
  }
};

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return;
  if (fs.statSync(full).isFile() && rel.endsWith('.css')) checkCss(full);
  else walk(full);
});

if (errors.length) {
  console.error(`\n✗ validate-css-asset-urls : ${errors.length} url() cassée(s)`);
  errors.slice(0, 30).forEach((e) => console.error(`  ✗ ${e}`));
  if (errors.length > 30) console.error(`  ... et ${errors.length - 30} autres`);
  process.exit(1);
}
console.log('✓ validate-css-asset-urls OK');
