#!/usr/bin/env node
/**
 * Vérifie la résolution vendor → icône pick-os + logo À propos pour le registre OS.
 * Usage : node usr/lib/capsuleos/tools/validate-vendor-icon-resolution.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  resolveVendorSlug,
  resolvePickIconFile,
  resolveAboutLogoFile,
  resolveAboutLogoLogical,
} from './vendor-icon-resolution-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const errors = [];
const warnings = [];

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const entries = (registry.entries || []).filter(
  (e) => (e.status === 'active' || e.status === 'planned') && (e.skin || e.referencePaths?.skin || e.referencePaths?.facade),
);

entries.forEach((entry) => {
  const slug = resolveVendorSlug(entry);
  const pickFile = resolvePickIconFile(entry);
  if (!pickFile || !fs.existsSync(pickFile)) {
    errors.push(`${entry.id}: icône pick-os introuvable (slug=${slug})`);
  }
  const aboutFile = resolveAboutLogoFile(entry);
  if (!aboutFile || !fs.existsSync(aboutFile)) {
    if (entry.family === 'linux') {
      errors.push(`${entry.id}: logo À propos introuvable sous vendors/${slug}/`);
    } else {
      warnings.push(`${entry.id}: pas de logo vendor Linux (famille ${entry.family})`);
    }
  }
});

const profileDataFiles = [];
const scanProfileData = (dir, depth) => {
  if (!fs.existsSync(dir) || depth > 5) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      scanProfileData(full, depth + 1);
      continue;
    }
    if (name === 'profile-data.js') {
      profileDataFiles.push(full);
    }
  }
};

scanProfileData(path.join(ROOT, 'home'), 0);
scanProfileData(path.join(ROOT, 'OS/linux/families'), 0);

profileDataFiles.forEach((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const logoMatch = text.match(/logo:\s*['"]([^'"]+)['"]/);
  if (!logoMatch) return;
  const logo = logoMatch[1];
  if (/^\.\.\/\.\.\/\.\.\/usr\/share\/capsuleos\/assets\//.test(logo)) {
    warnings.push(`${path.relative(ROOT, file)}: logo en chemin physique — préférer ./assets/images/vendors/<slug>/…`);
  }
  if (!logo.includes('/vendors/')) {
    warnings.push(`${path.relative(ROOT, file)}: logo hors dossier vendors/ (${logo})`);
  }
  const skinDir = path.dirname(file);
  const resolved = path.normalize(path.join(skinDir, logo.replace(/^\.\//, '')));
  const viaAssets = logo.startsWith('./assets/')
    ? path.join(ROOT, 'usr/share/capsuleos/assets', logo.replace(/^\.\/assets\//, ''))
    : resolved;
  const checkPath = fs.existsSync(viaAssets) ? viaAssets : resolved;
  if (!fs.existsSync(checkPath)) {
    errors.push(`${path.relative(ROOT, file)}: fichier logo introuvable (${logo})`);
  }
});

if (warnings.length) {
  console.warn(`⚠ ${warnings.length} avertissement(s) vendor-icon-resolution`);
  warnings.forEach((w) => console.warn(' ', w));
}

if (errors.length) {
  console.error(`\n✗ validate-vendor-icon-resolution : ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}

console.log(`✓ validate-vendor-icon-resolution OK — ${entries.length} entrées, ${profileDataFiles.length} profile-data.js`);
