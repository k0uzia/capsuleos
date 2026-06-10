#!/usr/bin/env node
/**
 * Audit chemins assets post-migration (sources html/css/js/json hors generated).
 * Usage : node usr/lib/capsuleos/tools/audit-asset-paths.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SKIP_DIRS = new Set(['node_modules', '.git', 'var/lib/capsuleos/generated']);
const EXT = /\.(html|css|js|json)$/i;

const SKIP_FILES = new Set([
  'usr/lib/capsuleos/common/capsule-resource.js',
  'usr/share/capsuleos/assets/manifest.json',
  'var/lib/capsuleos/generated/capsule-assets-manifest.js',
  'usr/lib/capsuleos/shells/linux/linux-shell-config.js',
]);

const LEGACY_PATTERNS = [
  { id: 'media/img (hors commentaire resolver)', re: /\/media\/img\//i },
  { id: './media/ dans src/href/url', re: /(?:src|href|url)\([^)]*\.\/media\//i },
  { id: 'home/.../Mint/media', re: /home\/Debian\/Mint\/media/i },
  { id: 'branding/icons', re: /branding\/icons/i },
  { id: 'branding/brands', re: /branding\/brands/i },
  { id: 'OS/.../assets/ (hors ./assets/)', re: /['"`](?:\.\.\/)+OS\/[^'"]+\/assets\// },
  { id: 'assets/images/android_background (racine legacy)', re: /assets\/images\/android_background/i },
  { id: 'icons/linux (legacy pick-os)', re: /icons\/linux\//i },
  { id: '././assets (portail cassé)', re: /\.\/(\.\/)+assets\// },
  { id: '../.././assets (hub cassé)', re: /\.\.\/.*\/\.\/assets\// },
];

const hits = new Map();
LEGACY_PATTERNS.forEach((p) => hits.set(p.id, []));

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXT.test(name)) continue;
    if (name.includes('audit-asset-paths') || name.includes('rewrite-asset-paths')) continue;
    const rel = path.relative(ROOT, full);
    if (SKIP_FILES.has(rel)) continue;
    const text = fs.readFileSync(full, 'utf8');
    LEGACY_PATTERNS.forEach((p) => {
      if (p.re.test(text)) hits.get(p.id).push(rel);
    });
  }
};

['home', 'OS', 'usr/lib/capsuleos', 'usr/share/capsuleos', 'index.html'].forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    if (fs.statSync(full).isFile()) {
      const text = fs.readFileSync(full, 'utf8');
      const r = path.relative(ROOT, full);
      LEGACY_PATTERNS.forEach((p) => {
        if (p.re.test(text)) hits.get(p.id).push(r);
      });
    } else {
      walk(full);
    }
  }
});

let total = 0;
for (const [id, files] of hits) {
  if (!files.length) continue;
  total += files.length;
  console.error(`\n✗ ${id} (${files.length})`);
  [...new Set(files)].slice(0, 15).forEach((f) => console.error(' ', f));
  if (files.length > 15) console.error(`  ... et ${files.length - 15} autres`);
}

if (total) {
  console.error(`\n✗ audit-asset-paths : ${total} occurrence(s) legacy`);
  process.exit(1);
}
console.log('✓ audit-asset-paths OK — aucun motif legacy dans les sources');
