#!/usr/bin/env node
/**
 * Vérifie que les skins Linux actifs chargent les scripts toolkit partagés (explorateur, fenêtres).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const BOOT = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/boot/toolkit-boot.json');

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const boot = JSON.parse(fs.readFileSync(BOOT, 'utf8'));
const errors = [];

const activeLinux = registry.entries.filter((e) => e.status === 'active' && e.family === 'linux');

for (const entry of activeLinux) {
  const skinRel = entry.skin || entry.referencePaths?.skin;
  if (!skinRel) {
    continue;
  }
  const indexPath = path.join(ROOT, skinRel);
  if (!fs.existsSync(indexPath)) {
    errors.push(`${entry.id}: skin introuvable ${skinRel}`);
    continue;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const toolkitId = entry.toolkit?.id;
  const spec = boot.toolkits[toolkitId];
  if (!spec) {
    continue;
  }
  ['clusterRegistry', 'explorerRegistry', 'explorerIconBase'].forEach((key) => {
    const rel = spec[key];
    if (!rel) {
      return;
    }
    const needle = rel.replace(/\//g, '/');
    if (!html.includes(needle)) {
      errors.push(`${entry.id}: script toolkit manquant dans index.html — ${rel}`);
    }
    if (!fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`${entry.id}: fichier toolkit introuvable — ${rel}`);
    }
  });
  if (!html.includes('capsule-skin-boot.js')) {
    errors.push(`${entry.id}: capsule-skin-boot.js manquant`);
  }
  const profilePath = path.join(ROOT, skinRel.replace(/index\.html$/, 'skin.profile.json'));
  if (fs.existsSync(profilePath)) {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const assetsBase = profile.assets?.assetsBase || '';
    if (!assetsBase.startsWith('../../../usr/share/capsuleos/assets')) {
      errors.push(`${entry.id}: assets.assetsBase doit être ../../../usr/share/capsuleos/assets (actuel: ${assetsBase})`);
    }
    if (!profile.capsuleGlobals?.CAPSULE_APPS_BASE) {
      errors.push(`${entry.id}: CAPSULE_APPS_BASE manquant dans profil`);
    }
    const packs = profile.assets?.iconPacks || [];
    if (toolkitId === 'cinnamon' && !packs.includes('icons/cinnamon')) {
      errors.push(`${entry.id}: iconPacks doit inclure icons/cinnamon`);
    }
  }
  const explorerBeforeLoader = html.indexOf('explorer-registry.js') < html.indexOf('contentLoader.js');
  if (spec.explorerRegistry && !explorerBeforeLoader) {
    errors.push(`${entry.id}: explorer-registry.js doit précéder contentLoader.js`);
  }
}

if (errors.length) {
  console.error(`✗ validate-linux-toolkit-boot — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}
console.log(`✓ validate-linux-toolkit-boot OK — ${activeLinux.length} skin(s) actif(s)`);
