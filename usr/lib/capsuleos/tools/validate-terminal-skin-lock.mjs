#!/usr/bin/env node
/**
 * Verrouillage skin terminal Ptyxis — anti-porosité vendor + tokens obligatoires.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-terminal-skin-lock.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/terminal-skin-lock.json');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const PTYXIS_BASE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/style/terminal-ptyxis.base.css');

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const errors = [];

const skinPathFor = (profile) => {
  const skinRel = (profile.paths && profile.paths.skin)
    || (profile.referencePaths && profile.referencePaths.skin);
  return skinRel ? path.join(ROOT, skinRel) : null;
};

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const hexOutsideMask = (css) => {
  const stripped = stripComments(css)
    .replace(/mask-image:\s*url\([^)]+\)/gi, '')
    .replace(/-webkit-mask-image:\s*url\([^)]+\)/gi, '')
    .replace(/var\([^)]*#[0-9a-fA-F]{3,8}[^)]*\)/gi, '');
  return /#[0-9a-fA-F]{3,8}\b/.test(stripped);
};

const ptyxisBase = fs.readFileSync(PTYXIS_BASE, 'utf8');
contract.baseMustNot.forEach((needle) => {
  if (ptyxisBase.includes(needle)) {
    errors.push(`terminal-ptyxis.base.css contient motif vendor interdit « ${needle} »`);
  }
});

if (!ptyxisBase.includes('--terminal-body-padding')) {
  errors.push('terminal-ptyxis.base.css : --terminal-body-padding absent (padding corps centralisé)');
}

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'));
const ptyxisSet = new Set(contract.ptyxisProfiles || []);

for (const file of profileFiles) {
  const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
  const profileId = profile.id || file.replace('.json', '');
  if (!ptyxisSet.has(profileId) || profile.status !== 'active') {
    continue;
  }

  const bodyId = profile.bodyId || profile.vendor || profileId.replace(/^linux-/, '');
  const skinPath = skinPathFor(profile);
  if (!skinPath || !fs.existsSync(skinPath)) {
    errors.push(`${profileId}: skin introuvable`);
    continue;
  }

  const skinDir = path.dirname(skinPath);
  const skinCssPath = path.join(skinDir, 'style/apps/terminal.skin.css');
  const tokensPath = path.join(skinDir, 'style/gnome-shell/tokens.css');

  if (!fs.existsSync(skinCssPath)) {
    errors.push(`${profileId}: style/apps/terminal.skin.css introuvable`);
    continue;
  }

  const skinCss = fs.readFileSync(skinCssPath, 'utf8');
  const skinRules = stripComments(skinCss);

  if (hexOutsideMask(skinCss)) {
    errors.push(`${profileId}: terminal.skin.css contient une couleur hex en dur (utiliser tokens.css)`);
  }

  const bareFedora = /(?:^|[,{])\s*\.terminal-window--fedora\b/m.test(skinRules);
  if (bareFedora) {
    errors.push(`${profileId}: terminal.skin.css — sélecteur nu .terminal-window--fedora (préfixer body#${bodyId})`);
  }

  if (!skinCss.includes(`body#${bodyId}`)) {
    errors.push(`${profileId}: terminal.skin.css sans ancrage body#${bodyId}`);
  }

  if (!skinCss.includes('var(--fedora-app-terminal-surface)')) {
    errors.push(`${profileId}: terminal.skin.css sans --fedora-app-terminal-surface`);
  }

  if (/>\s*#terminalContainer[^}]*padding:\s*var\(--z\)/s.test(skinCss)) {
    errors.push(`${profileId}: padding shell var(--z) — utiliser padding: 0 (voir terminal-skin-lock.json)`);
  }

  if (/fedora-terminal-tabs__tab[^}]*max-width:\s*(?!none)/s.test(skinRules)) {
    errors.push(`${profileId}: max-width fixe sur onglets — layout flex dans terminal-ptyxis.base.css`);
  }

  if (fs.existsSync(tokensPath)) {
    const tokens = fs.readFileSync(tokensPath, 'utf8');
    contract.requiredTokens.forEach((token) => {
      if (!tokens.includes(token)) {
        errors.push(`${profileId}: tokens.css sans ${token}`);
      }
    });
  } else {
    errors.push(`${profileId}: style/gnome-shell/tokens.css introuvable`);
  }
}

if (errors.length) {
  console.error(`✗ validate-terminal-skin-lock — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log(`✓ validate-terminal-skin-lock OK — ${ptyxisSet.size} profil(s) Ptyxis vérifié(s)`);
process.exit(0);
