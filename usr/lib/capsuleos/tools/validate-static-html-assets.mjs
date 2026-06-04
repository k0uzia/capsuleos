#!/usr/bin/env node
/**
 * Vérifie que chaque src/href statique ./assets|./icons|./media existe sur disque
 * (sans supposer CapsuleResource — charge navigateur immédiate).
 * Usage : node usr/lib/capsuleos/tools/validate-static-html-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SCAN = ['home', 'OS', 'index.html'];
const SKIP = new Set(['node_modules', '.git', 'var']);

const errors = [];
const warnings = [];

const strip = (u) => u.split('?')[0].split('#')[0];

const parseBaseDir = (full, html) => {
  const fileDir = path.dirname(full);
  const m = html.match(/<base\s+[^>]*href=["']([^"']+)["']/i);
  if (m) return path.normalize(path.join(fileDir, m[1]));
  return fileDir;
};

const resolveAttr = (baseDir, url) => {
  const clean = strip(url);
  if (/^(https?:|data:|javascript:|#|mailto:)/i.test(clean)) return null;
  if (clean.startsWith('/')) return path.join(ROOT, clean.slice(1));
  return path.normalize(path.join(baseDir, clean));
};

const checkFile = (full) => {
  const rel = path.relative(ROOT, full);
  const html = fs.readFileSync(full, 'utf8');
  const baseDir = parseBaseDir(full, html);
  const re = /(?:src|href)=(["'])([^"']+)\1/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[2];
    if (!/(?:^\.\/|\/)(?:assets|icons|media)\//.test(url) && !url.includes(`usr/share/capsuleos/assets/`)) continue;
    if (url.includes('usr/share/capsuleos/assets/')) {
      const resolved = resolveAttr(baseDir, url);
      if (resolved && !fs.existsSync(resolved)) errors.push(`${rel}: ${url}`);
      continue;
    }
    if (!/^\.(?:\/|\.\/)(?:assets|icons|media)\//.test(url)) continue;
    const resolved = resolveAttr(baseDir, url);
    if (resolved && !fs.existsSync(resolved)) {
      errors.push(`${rel}: ${url}`);
    }
  }
  const logicalOnly = /(?:src|href)=(["'])\.\/assets\//i.test(html);
  const hasEarlyBoot = /<head[^>]*>[\s\S]*?capsule-resource\.js[\s\S]*?capsule-skin-boot\.js/i.test(html);
  if (logicalOnly && !hasEarlyBoot) {
    warnings.push(`${rel}: ./assets/ en HTML sans boot head (préférer chemins physiques ou fix-static-html-asset-urls)`);
  }
};

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.lstatSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) checkFile(full);
  }
};

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return;
  if (fs.statSync(full).isFile()) checkFile(full);
  else walk(full);
});

if (warnings.length) {
  console.warn(`Avertissements (${warnings.length}):`);
  warnings.slice(0, 15).forEach((w) => console.warn(`  ⚠ ${w}`));
  if (warnings.length > 15) console.warn(`  ... ${warnings.length - 15} autres`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} url(s) statique(s) introuvable(s)`);
  errors.slice(0, 40).forEach((e) => console.error(' ', e));
  if (errors.length > 40) console.error(`  ... et ${errors.length - 40} autres`);
  process.exit(1);
}
console.log('✓ validate-static-html-assets OK');
