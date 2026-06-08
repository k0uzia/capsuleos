#!/usr/bin/env node
/**
 * Vérifie le cloisonnement assets : images autorisées uniquement sous
 * usr/share/capsuleos/assets/ et home/public/Images/
 * Usage : node usr/lib/capsuleos/tools/validate-asset-zones.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const IMAGE_EXT = new Set(['.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.ico']);

const ALLOWED_PREFIXES = [
  path.join(ROOT, 'usr/share/capsuleos/assets'),
  path.join(ROOT, 'home/public/Images'),
  // Enquête visuelle lab (V / Vc) — procedure-replication-formelle.md
  path.join(ROOT, 'root/docs/inventaires/captures'),
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  path.join(ROOT, 'usr/share/capsuleos/assets'),
  path.join(ROOT, 'home/public/Images'),
]);

const violations = [];

const isAllowed = (abs) =>
  ALLOWED_PREFIXES.some((p) => abs === p || abs.startsWith(p + path.sep));

const walk = (dir) => {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    if (name === '.git' || name === 'node_modules') continue;
    if (SKIP_DIRS.has(full)) continue;
    // Cache transitif import manifeste — pas une zone assets durable
    if (name === 'staging' && full.includes(`${path.sep}proc${path.sep}`)) continue;

    let st;
    try {
      st = fs.lstatSync(full);
    } catch {
      continue;
    }

    if (st.isSymbolicLink()) {
      continue;
    }

    if (st.isDirectory()) {
      walk(full);
      continue;
    }

    if (IMAGE_EXT.has(path.extname(name).toLowerCase()) && !isAllowed(full)) {
      violations.push(path.relative(ROOT, full));
    }
  }
};

walk(ROOT);

if (violations.length) {
  console.error(`✗ ${violations.length} images hors zones autorisées (assets/ ou home/public/Images/)`);
  violations.slice(0, 30).forEach((v) => console.error(' ', v));
  if (violations.length > 30) console.error(`  ... et ${violations.length - 30} autres`);
  process.exit(1);
}
console.log('✓ validate-asset-zones OK — aucune image hors zones autorisées');
