#!/usr/bin/env node
/**
 * Alias icônes menu Mint : gnome/apps → cinnamon/apps (symlinks relatifs).
 * Les packs dash/ et overview/ restent GNOME-only (Ubuntu/Fedora).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs
 *   node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const GNOME_APPS = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/gnome/apps');
const CINNAMON_APPS = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/cinnamon/apps');
const DRY = process.argv.includes('--dry-run');
const SKIP_DIRS = new Set(['dash', 'overview']);

let created = 0;
let skipped = 0;

if (!fs.existsSync(GNOME_APPS)) {
  console.error('✗ gnome/apps introuvable');
  process.exit(1);
}

if (!DRY && !fs.existsSync(CINNAMON_APPS)) {
  fs.mkdirSync(CINNAMON_APPS, { recursive: true });
}

for (const name of fs.readdirSync(GNOME_APPS)) {
  if (SKIP_DIRS.has(name)) {
    continue;
  }
  const src = path.join(GNOME_APPS, name);
  let st;
  try {
    st = fs.lstatSync(src);
  } catch {
    continue;
  }
  if (!st.isFile()) {
    continue;
  }
  const dest = path.join(CINNAMON_APPS, name);
  if (fs.existsSync(dest)) {
    skipped += 1;
    continue;
  }
  const rel = path.relative(CINNAMON_APPS, src);
  if (DRY) {
    console.log(`[dry-run] ${name} → ${rel}`);
  } else {
    fs.symlinkSync(rel, dest);
  }
  created += 1;
}

console.log(`✓ sync-cinnamon-app-icons — ${created} lien(s)${DRY ? ' (dry-run)' : ''}, ${skipped} déjà présent(s)`);
