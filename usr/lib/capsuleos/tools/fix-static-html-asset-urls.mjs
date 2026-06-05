#!/usr/bin/env node
/**
 * Réécrit src/href statiques ./assets/ et ./icons/ → chemins physiques
 * (file:// et HTTP sans hydratation head).
 * Usage : node usr/lib/capsuleos/tools/fix-static-html-asset-urls.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');
const ASSETS = 'usr/share/capsuleos/assets';

const SCAN = ['home', 'OS', 'index.html'];
const SKIP = new Set(['node_modules', '.git', 'var']);

const depthFromDir = (absDir) => {
  const relDir = path.relative(ROOT, absDir);
  const depth = relDir ? relDir.split(path.sep).filter(Boolean).length : 0;
  return depth;
};

/** Préfixe relatif vers la racine du dépôt (depuis le répertoire effectif du document). */
const repoPrefix = (filePath, html) => {
  const fileDir = path.dirname(filePath);
  const baseMatch = html.match(/<base\s+[^>]*href=["']([^"']+)["']/i);
  if (baseMatch) {
    const effectiveDir = path.normalize(path.join(fileDir, baseMatch[1]));
    const depth = depthFromDir(effectiveDir);
    return depth === 0 ? './' : '../'.repeat(depth);
  }
  const depth = depthFromDir(fileDir);
  return depth === 0 ? './' : '../'.repeat(depth);
};

const PHYS_RE = new RegExp(
  `(src|href)=(["'])(?:\\.\\./)+${ASSETS.replace(/\//g, '\\/')}/`,
  'gi',
);

const rewriteHtml = (text, prefix) => {
  let out = text;
  const physAssets = `${prefix}${ASSETS}/`;
  const normalizePhys = new RegExp(
    `(src|href)=(["'])(?:\\.\\.\\/)+${ASSETS.replace(/\//g, '\\/')}/`,
    'gi',
  );
  out = out.replace(normalizePhys, (_, attr, q) => `${attr}=${q}${physAssets}`);
  out = out.replace(
    /(src|href)=(["'])(\.\/assets\/)/gi,
    (_, attr, q) => `${attr}=${q}${physAssets}`,
  );
  out = out.replace(
    /(src|href)=(["'])(\.\/icons\/)/gi,
    (_, attr, q) => `${attr}=${q}${physAssets}icons/`,
  );
  out = out.replace(
    /(src|href)=(["'])(\.\/media\/)/gi,
    (_, attr, q) => `${attr}=${q}${physAssets}images/`,
  );
  return out;
};

let changed = 0;

const processFile = (full) => {
  if (!full.endsWith('.html')) return;
  const text = fs.readFileSync(full, 'utf8');
  if (!/\.\/(?:assets|icons|media)\//.test(text) && !text.includes(`${ASSETS}/`)) return;
  const prefix = repoPrefix(full, text);
  const next = rewriteHtml(text, prefix);
  if (next === text) return;
  changed += 1;
  const rel = path.relative(ROOT, full);
  if (DRY) console.log('[dry-run]', rel);
  else fs.writeFileSync(full, next, 'utf8');
};

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full);
    else processFile(full);
  }
};

const indexRoot = path.join(ROOT, 'index.html');
if (fs.existsSync(indexRoot)) processFile(indexRoot);

SCAN.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return;
  if (fs.statSync(full).isDirectory()) walk(full);
  else processFile(full);
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} fichier(s) HTML — urls statiques → ${ASSETS}/`);
