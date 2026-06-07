#!/usr/bin/env node
/**
 * Cloisonnement vendor — pas d'imports / marqueurs shell d'une autre distribution.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-skin-vendor-isolation.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/skin-vendor-isolation.json');

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const errors = [];

const skinPathFor = (profile) => {
  const skinRel = (profile.paths && profile.paths.skin)
    || (profile.referencePaths && profile.referencePaths.skin);
  return skinRel ? path.join(ROOT, skinRel) : null;
};

const importsPathFor = (skinPath) => path.join(path.dirname(skinPath), 'style/imports.css');
const workstationPathFor = (skinPath) => path.join(path.dirname(skinPath), 'style/gnome-workstation.css');
const indexPathFor = (skinPath) => skinPath;

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'));

for (const file of profileFiles) {
  const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
  if (profile.status !== 'active') {
    continue;
  }
  const profileId = profile.id || file.replace('.json', '');
  const vendor = profile.vendor || profileId.replace(/^linux-/, '');
  const bodyId = profile.bodyId || vendor;
  const skinPath = skinPathFor(profile);
  if (!skinPath || !fs.existsSync(skinPath)) {
    errors.push(`${profileId}: skin introuvable`);
    continue;
  }

  const denylist = contract.vendorImportDenylist[vendor] || [];
  const importsPath = importsPathFor(skinPath);
  if (fs.existsSync(importsPath)) {
    const importsSrc = fs.readFileSync(importsPath, 'utf8');
    denylist.forEach((needle) => {
      if (importsSrc.includes(needle)) {
        errors.push(`${profileId}: imports.css contient motif interdit vendor « ${needle} »`);
      }
    });
  }

  if (contract.noPersistentDockProfiles.includes(profileId)) {
    const wsPath = workstationPathFor(skinPath);
    if (fs.existsSync(wsPath)) {
      const ws = fs.readFileSync(wsPath, 'utf8');
      const dockRule = new RegExp(`#${bodyId}\\s+#tableau\\.fedora-dock\\s*\\{[^}]*display:\\s*flex`, 's');
      if (dockRule.test(ws)) {
        errors.push(
          `${profileId}: dock persistant (display:flex) — RHEL/Fedora n'a pas de barre Unity ; masquer #tableau.fedora-dock`,
        );
      }
      if (/vendors\/ubuntu\/wallpaper|wallpaper-racoon|warty-final-ubuntu/i.test(ws)) {
        errors.push(`${profileId}: gnome-workstation.css référence un fond Ubuntu`);
      }
    }
    const tokensPath = path.join(path.dirname(skinPath), 'style/gnome-shell/tokens.css');
    if (fs.existsSync(tokensPath)) {
      const tokens = fs.readFileSync(tokensPath, 'utf8');
      if (/--fedora-dock-width:\s*calc\(/.test(tokens)) {
        errors.push(`${profileId}: --fedora-dock-width non nul — réserver l'inset dock Unity`);
      }
    }
  }

  if (!contract.persistentDockProfiles.includes(profileId)) {
    const indexSrc = fs.readFileSync(indexPathFor(skinPath), 'utf8');
    (contract.ubuntuOnlyMarkers || []).forEach((marker) => {
      if (indexSrc.includes(marker)) {
        errors.push(`${profileId}: index.html contient marqueur Ubuntu « ${marker} »`);
      }
    });
  }
}

if (errors.length) {
  console.error(`✗ validate-skin-vendor-isolation — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

const active = profileFiles.filter((f) => {
  const p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), 'utf8'));
  return p.status === 'active';
}).length;

console.log(`✓ validate-skin-vendor-isolation OK — ${active} profil(s) actif(s) vérifié(s)`);
process.exit(0);
