#!/usr/bin/env node
/**
 * Smoke statique Ubuntu GNOME — parité apps dash / grille Aperçu / recherche.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-ubuntu-gnome-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog } from './apps-catalog-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY_ID = 'linux-ubuntu';
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
};

const indexHtml = read('home/Debian/Ubuntu/index.html');
const overviewJs = read('home/Debian/Ubuntu/js/overview.js');
const profile = read('etc/capsuleos/profiles/linux-ubuntu.json');

const p0Slots = ['nemo', 'firefox', 'lecteur_multimedia', 'librewriter', 'update_manager', 'text_editor', 'calculator', 'themes', 'terminal'];

for (const slot of p0Slots) {
  if (!indexHtml.includes(`data-link="${slot}"`)) {
    errors.push(`index.html : slot ${slot} manquant`);
  }
}

const overviewP0 = ['firefox', 'nemo', 'calculator', 'themes', 'text_editor', 'terminal', 'librewriter', 'lecteur_multimedia', 'update_manager'];
for (const slot of overviewP0) {
  if (!indexHtml.includes(`data-overview-link="${slot}"`)) {
    errors.push(`index.html : grille Aperçu → ${slot} manquant`);
  }
}

for (const slot of p0Slots) {
  if (!overviewJs.includes(`dataLink: '${slot}'`)) {
    errors.push(`overview.js : catalogue recherche P0 → ${slot} manquant`);
  }
}

if (!overviewJs.includes('org.gnome.Loupe.svg')) {
  errors.push('overview.js : Loupe absent du catalogue recherche');
}
if (!overviewJs.includes('org.gnome.Papers.svg')) {
  errors.push('overview.js : Papers absent du catalogue recherche');
}
if (!overviewJs.includes('org.gnome.Yelp.svg')) {
  errors.push('overview.js : Aide Ubuntu absent du catalogue recherche');
}
if (!overviewJs.includes('window.CapsuleGnomeOverview')) {
  errors.push('overview.js : export CapsuleGnomeOverview manquant');
}
if (!profile.includes('CAPSULE_WINDOW_CONTEXT')) {
  errors.push('profil : CAPSULE_WINDOW_CONTEXT manquant');
}
if (!profile.includes('nemo-gnome')) {
  errors.push('profil : template explorateur nemo-gnome attendu');
}

try {
  const catalog = buildCatalog(REGISTRY_ID);
  if (catalog.summary.p0Gaps > 0) {
    errors.push(`catalogue : ${catalog.summary.p0Gaps} écart(s) P0`);
  }
  const overviewRows = catalog.rows.filter((r) => r.placement?.overview && r.slotCapsule);
  for (const row of overviewRows) {
    if (!indexHtml.includes(`data-overview-link="${row.slotCapsule}"`)) {
      errors.push(`catalogue/overview : ${row.labelFr} (${row.slotCapsule}) absent de la grille`);
    }
  }
} catch (err) {
  errors.push(`catalogue : ${err.message}`);
}

if (errors.length) {
  console.error('smoke-ubuntu-gnome-apps — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-ubuntu-gnome-apps OK');
