#!/usr/bin/env node
/**
 * Génère le catalogue fonds d'écran Mint depuis vendors/mint/wallpaper/ (post-ManΣ).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-wallpaper-catalog.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const WALL_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/mint/wallpaper');
const OUT_JS = path.join(ROOT, 'var/lib/capsuleos/generated/mint-wallpaper-catalog.js');

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write') };
};

const humanLabel = (basename) => {
  const stem = basename.replace(/\.[^.]+$/, '');
  return stem
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildCatalog = () => {
  if (!fs.existsSync(WALL_DIR)) {
    return [];
  }
  const files = fs.readdirSync(WALL_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'fr'));
  return files.map((file) => {
    const id = file.replace(/\.[^.]+$/, '');
    const rel = `vendors/mint/wallpaper/${file}`;
    return {
      id,
      label: humanLabel(file),
      type: 'image',
      dark: rel,
      light: rel,
      default: id === 'linuxmint',
    };
  });
};

const renderJs = (entries) => `/* Généré par generate-mint-wallpaper-catalog.mjs — ne pas éditer à la main */
(function (global) {
    'use strict';
    global.CAPSULE_MINT_WALLPAPER_CATALOG = ${JSON.stringify(entries, null, 4)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

const main = () => {
  const opts = parseArgs();
  const entries = buildCatalog();
  if (!entries.length) {
    console.error('Aucun fond sous', WALL_DIR.replace(`${ROOT}/`, ''));
    process.exit(1);
  }
  const js = renderJs(entries);
  if (opts.write) {
    fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });
    fs.writeFileSync(OUT_JS, `${js}\n`);
    console.log(`✓ ${OUT_JS.replace(`${ROOT}/`, '')} (${entries.length} fonds)`);
  } else {
    process.stdout.write(`${js}\n`);
  }
};

main();
