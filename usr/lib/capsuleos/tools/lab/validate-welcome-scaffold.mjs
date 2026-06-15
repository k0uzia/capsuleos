#!/usr/bin/env node
/**
 * Gate AccΣ — squelette d'accueil OS planned.
 * Usage : node usr/lib/capsuleos/tools/lab/validate-welcome-scaffold.mjs --id linux-elementary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const registryId = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || '').trim();
if (!registryId) {
  console.error('Usage: validate-welcome-scaffold.mjs --id <registryId>');
  process.exit(1);
}

const contract = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'etc/capsuleos/contracts/os-welcome-scaffold.json'), 'utf8')
);
const spec = contract.entries[registryId];
const errors = [];
const warnings = [];

if (!spec) {
  console.error(`Entrée scaffold absente pour ${registryId}`);
  process.exit(1);
}

const homeRel = spec.homeLayout;
const homeAbs = path.join(ROOT, homeRel);

contract.requiredFiles.forEach((rel) => {
  const abs = path.join(homeAbs, rel);
  if (!fs.existsSync(abs)) errors.push(`fichier requis absent: ${homeRel}/${rel}`);
});

const profilePath = path.join(ROOT, 'etc/capsuleos/profiles', `${registryId}.json`);
if (!fs.existsSync(profilePath)) {
  errors.push(`profil absent: etc/capsuleos/profiles/${registryId}.json`);
} else {
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  if (profile.id !== registryId) errors.push(`profil id mismatch: ${profile.id}`);
  if (profile.status !== 'planned' && profile.tier !== spec.welcomeTier) {
    warnings.push(`tier/status profil: ${profile.tier}/${profile.status}`);
  }
}

const indexPath = path.join(homeAbs, 'index.html');
if (fs.existsSync(indexPath) && !spec.nonLinux) {
  const html = fs.readFileSync(indexPath, 'utf8');
  contract.p0Slots.forEach((slot) => {
    if (!html.includes(`data-link="${slot}"`)) {
      errors.push(`slot P0 absent dans index.html: data-link="${slot}"`);
    }
  });
}

const imports = fs.existsSync(path.join(homeAbs, 'style/imports.css'))
  ? fs.readFileSync(path.join(homeAbs, 'style/imports.css'), 'utf8')
  : '';
const style = fs.existsSync(path.join(homeAbs, 'style/style.css'))
  ? fs.readFileSync(path.join(homeAbs, 'style/style.css'), 'utf8')
  : '';
const hasA11y =
  imports.includes('a11y-overrides.css') ||
  style.includes('a11y-overrides.css') ||
  (fs.existsSync(indexPath) && fs.readFileSync(indexPath, 'utf8').includes('a11y-overrides.css'));
if (!hasA11y) errors.push('a11y-overrides.css non importé dans la chaîne CSS');

const recipes = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'etc/capsuleos/contracts/lab-recipe-profiles.json'), 'utf8')
);
if (!recipes.profiles[registryId]) {
  warnings.push('entrée lab-recipe-profiles absente');
}

const procReadme = path.join(ROOT, 'proc', registryId, 'README.md');
if (!fs.existsSync(procReadme)) warnings.push(`proc/${registryId}/README.md absent`);

if (errors.length) {
  console.error(`validate-welcome-scaffold ${registryId} — échec\n`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}

console.log(`✓ validate-welcome-scaffold ${registryId} OK (AccΣ)`);
if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
