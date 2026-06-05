#!/usr/bin/env node
/**
 * Vérifie les liens images vendors : pas de .jpg/.png/.gif si un .webp existe à la même base.
 * Usage : node usr/lib/capsuleos/tools/validate-vendor-image-extensions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const VENDORS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors');

const SCAN_ROOTS = [
  'home',
  'OS/linux/families',
  'usr/lib/capsuleos/shells',
  'usr/share/capsuleos/themes',
  'usr/share/capsuleos/linux/apps',
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'generated', 'original']);

const RASTER_EXT = /\.(png|jpe?g|gif)$/i;
const VENDOR_REF = /vendors\/([a-z0-9_-]+)\/([a-zA-Z0-9_./-]+\.(?:png|jpe?g|gif|webp|svg))/g;

const webpBases = new Set();

function walkVendors(dir, rel = '') {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const key = rel ? `${rel}/${name}` : name;
    if (fs.statSync(full).isDirectory()) {
      walkVendors(full, key);
      continue;
    }
    if (name.endsWith('.webp')) {
      webpBases.add(key.replace(/\.webp$/i, ''));
    }
  }
}

function scanSources(dir, issues, staleRaster) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (SKIP_DIRS.has(name)) {
      continue;
    }
    if (fs.statSync(full).isDirectory()) {
      scanSources(full, issues, staleRaster);
      continue;
    }
    if (!/\.(html|css|js|json|mjs)$/.test(name)) {
      continue;
    }
    const relFile = path.relative(ROOT, full);
    const text = fs.readFileSync(full, 'utf8');
    let match;
    VENDOR_REF.lastIndex = 0;
    while ((match = VENDOR_REF.exec(text))) {
      const vendor = match[1];
      const assetPath = match[2];
      const diskPath = path.join(VENDORS, vendor, assetPath);
      const baseKey = `${vendor}/${assetPath.replace(RASTER_EXT, '')}`;

      if (RASTER_EXT.test(assetPath) && webpBases.has(baseKey)) {
        issues.push({
          file: relFile,
          ref: `vendors/${vendor}/${assetPath}`,
          suggest: `vendors/${vendor}/${assetPath.replace(RASTER_EXT, '.webp')}`,
        });
      }

      if (!fs.existsSync(diskPath) && webpBases.has(baseKey)) {
        staleRaster.push({
          file: relFile,
          ref: `vendors/${vendor}/${assetPath}`,
          suggest: `vendors/${vendor}/${assetPath.replace(RASTER_EXT, '.webp')}`,
        });
      }
    }
  }
}

walkVendors(VENDORS);

const staleRaster = [];
const outdatedRefs = [];
SCAN_ROOTS.forEach((rel) => scanSources(path.join(ROOT, rel), outdatedRefs, staleRaster));

const errors = [];
const seen = new Set();

for (const row of [...staleRaster, ...outdatedRefs]) {
  const key = `${row.file}|${row.ref}`;
  if (seen.has(key)) {
    continue;
  }
  seen.add(key);
  errors.push(row);
}

if (errors.length) {
  console.error(`\n✗ validate-vendor-image-extensions : ${errors.length} référence(s) obsolète(s)`);
  errors.slice(0, 40).forEach((e) => {
    console.error(`  ✗ ${e.file}: ${e.ref} → ${e.suggest}`);
  });
  if (errors.length > 40) {
    console.error(`  ... et ${errors.length - 40} autres`);
  }
  process.exit(1);
}

console.log('✓ validate-vendor-image-extensions OK');
