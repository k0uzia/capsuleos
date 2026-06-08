#!/usr/bin/env node
/**
 * Gate paradigme toolkit — Mint/Cinnamon ne doit pas fuiter GNOME shell.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs
 *   node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
 *
 * Exceptions documentées : root/docs/inventaires/linux-mint-cinnamon-vs-gnome-audit.md §4
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const idArg = process.argv.find((a, i) => process.argv[i - 1] === '--id');
const TARGET_ID = idArg || 'linux-mint';

const SKIN_BY_ID = {
  'linux-mint': 'home/Debian/Mint',
};

const skinRel = SKIN_BY_ID[TARGET_ID];
if (!skinRel) {
  console.error(`✗ validate-toolkit-paradigm — id inconnu: ${TARGET_ID}`);
  process.exit(1);
}

const skinDir = path.join(ROOT, skinRel);
const errors = [];
const warnings = [];

/** Motifs autorisés (exceptions VM / apps GTK partagées). */
const ALLOWED_PATTERNS = [
  /terminal-window--gnome/,
  /gnome-terminal-header/,
  /gnome-calc/,
  /gnome-shot/,
  /gnomeCalculatorApp/,
  /gnomeScreenshotApp/,
  /gnome-settings-wallpaper/,
  /cinnamon-settings-wallpaper/,
  /org\.gnome\.Calculator\.webp/,
  /org\.gnome\.Calendar\.webp/,
  /data-link="gnome_disks"/,
  /gnome-disks\.js/,
  /gnome_disks/,
  /mainMenu-data-cinnamon/,
];

const isAllowedLine = (line) => ALLOWED_PATTERNS.some((re) => re.test(line));

const scanFile = (relPath) => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    return;
  }
  const text = fs.readFileSync(full, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('toolkits/gnome') && !isAllowedLine(line)) {
      errors.push(`${relPath}:${idx + 1} — référence toolkits/gnome interdite pour ${TARGET_ID}`);
    }
    if (line.includes('toolkit: gnome') || line.includes('"id": "gnome"') && line.includes('shell')) {
      if (relPath.includes('Mint') || relPath.includes('linux-mint')) {
        errors.push(`${relPath}:${idx + 1} — profil/toolkit GNOME sur skin Cinnamon`);
      }
    }
    if (line.includes('mainMenu-data.js') && !line.includes('mainMenu-data-cinnamon')) {
      if (relPath.includes('Mint/index.html')) {
        errors.push(`${relPath}:${idx + 1} — menu GNOME générique au lieu de mainMenu-data-cinnamon.js`);
      }
    }
    if (line.includes('nemo-gnome') || line.includes('themes_gnome')) {
      errors.push(`${relPath}:${idx + 1} — template GNOME sur skin Cinnamon`);
    }
  });
};

const walk = (dir, base = skinRel) => {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name).replace(/\\/g, '/');
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, rel);
    } else if (/\.(html|js|css|json)$/.test(name)) {
      scanFile(rel);
    }
  }
};

walk(skinDir);

const profilePaths = [
  `etc/capsuleos/profiles/${TARGET_ID}.json`,
  `${skinRel}/skin.profile.json`,
  `OS/linux/families/debian/mint/skin.profile.json`,
];

profilePaths.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    warnings.push(`Profil absent: ${rel}`);
    return;
  }
  const profile = JSON.parse(fs.readFileSync(full, 'utf8'));
  const toolkitId = profile.toolkit && profile.toolkit.id;
  if (toolkitId !== 'cinnamon') {
    errors.push(`${rel}: toolkit.id attendu "cinnamon", reçu "${toolkitId}"`);
  }
  if (profile.assets && profile.assets.toolkitPack !== 'toolkits/cinnamon') {
    errors.push(`${rel}: assets.toolkitPack attendu toolkits/cinnamon`);
  }
  const explorer = profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_EXPLORER_TEMPLATE;
  if (explorer && explorer !== 'nemo') {
    errors.push(`${rel}: CAPSULE_EXPLORER_TEMPLATE attendu "nemo"`);
  }
});

scanFile('usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');

const menuData = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');
if (fs.existsSync(menuData)) {
  const md = fs.readFileSync(menuData, 'utf8');
  if (md.includes('toolkits/gnome/apps')) {
    errors.push('mainMenu-data-cinnamon.js: chemins toolkits/gnome/apps — utiliser toolkits/cinnamon/apps');
  }
}

if (warnings.length) {
  warnings.forEach((w) => console.warn('  ⚠', w));
}

if (errors.length) {
  console.error(`✗ validate-toolkit-paradigm — ${errors.length} erreur(s) (${TARGET_ID})`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}

console.log(`✓ validate-toolkit-paradigm OK — ${TARGET_ID} (toolkit cinnamon, pas de fuite GNOME shell)`);
