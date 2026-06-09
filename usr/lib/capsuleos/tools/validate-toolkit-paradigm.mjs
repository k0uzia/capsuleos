#!/usr/bin/env node
/**
 * Gate paradigme toolkit — cloisonnement DE (Cinnamon / GNOME / KDE).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs
 *   node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all
 *
 * Exceptions documentées : root/docs/inventaires/linux-mint-cinnamon-vs-gnome-audit.md §4
 * Matrice DE : root/docs/paradigme-toolkit-de.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const ALL_FLAG = process.argv.includes('--all');
const idArg = process.argv.find((a, i) => process.argv[i - 1] === '--id');
const TARGET_IDS = ALL_FLAG
  ? ['linux-mint', 'linux-rocky', 'linux-ubuntu', 'linux-debian-kde']
  : [idArg || 'linux-mint'];

/** @type {Record<string, { skin: string, toolkit: string, explorer: string, forbidden: RegExp[], allowed?: RegExp[] }>} */
const PARADIGMS = {
  'linux-mint': {
    skin: 'home/Debian/Mint',
    toolkit: 'cinnamon',
    explorer: 'nemo',
    forbidden: [
      /toolkits\/gnome\/apps/,
      /mainMenu-data\.js(?!-cinnamon)/,
      /nemo-gnome/,
      /themes_gnome/,
      /cinnamon-window-behaviors\.js.*gnome-window-behaviors/,
    ],
    allowed: [
      /terminal-window--gnome/,
      /gnome-terminal-header/,
      /gnome-calc/,
      /gnome-shot/,
      /gnomeCalculatorApp/,
      /gnomeScreenshotApp/,
      /gnome-settings-wallpaper/,
      /cinnamon-settings-wallpaper/,
      /org\.gnome\.Calculator/,
      /org\.gnome\.Calendar/,
      /data-link="gnome_disks"/,
      /gnome-disks\.js/,
      /gnome_disks/,
      /mainMenu-data-cinnamon/,
    ],
  },
  'linux-rocky': {
    skin: 'home/RedHat/Rocky',
    toolkit: 'gnome',
    explorer: 'nemo-gnome',
    forbidden: [
      /toolkits\/cinnamon/,
      /mainMenu-data-cinnamon/,
      /cinnamon-window-behaviors/,
      /cinnamon-settings\.js/,
      /mint-menu-parity/,
      /mint-panel/,
      /CAPSULE_EXPLORER_TEMPLATE.*"nemo"(?!-)/,
    ],
    allowed: [
      /toolkits\/gnome/,
      /gnome-window-behaviors/,
      /themes_gnome/,
      /nemo-gnome/,
      /nautilus-app/,
    ],
  },
  'linux-ubuntu': {
    skin: 'home/Debian/Ubuntu',
    toolkit: 'gnome',
    explorer: 'nemo-gnome',
    forbidden: [
      /toolkits\/cinnamon/,
      /mainMenu-data-cinnamon/,
      /cinnamon-window-behaviors/,
      /cinnamon-settings\.js/,
      /mint-menu-parity/,
      /mint-panel/,
    ],
    allowed: [
      /toolkits\/gnome/,
      /gnome-window-behaviors/,
      /themes_gnome/,
      /nemo-gnome/,
      /nautilus-app/,
    ],
  },
  'linux-debian-kde': {
    skin: 'home/Debian/Debian-KDE',
    toolkit: 'kde',
    explorer: 'dolphin',
    forbidden: [
      /toolkits\/cinnamon/,
      /mainMenu-data-cinnamon/,
      /cinnamon-window-behaviors/,
      /mint-menu-parity/,
      /nemo-gnome/,
      /nautilus-app/,
    ],
    allowed: [
      /toolkits\/kde/,
      /icons\/kde/,
      /dolphin/,
    ],
  },
};

const errors = [];
const warnings = [];

const isAllowedLine = (line, allowed) => {
  if (!allowed || !allowed.length) {
    return false;
  }
  return allowed.some((re) => re.test(line));
};

const scanSkin = (skinRel, paradigm) => {
  const skinDir = path.join(ROOT, skinRel);
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
        const text = fs.readFileSync(full, 'utf8');
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          paradigm.forbidden.forEach((re) => {
            if (re.test(line) && !isAllowedLine(line, paradigm.allowed)) {
              errors.push(`${rel}:${idx + 1} — fuite toolkit interdite (${re})`);
            }
          });
        });
      }
    }
  };
  walk(skinDir);
};

const validateProfile = (targetId, paradigm) => {
  const profilePaths = [
    `etc/capsuleos/profiles/${targetId}.json`,
    `${paradigm.skin}/skin.profile.json`,
  ];

  profilePaths.forEach((rel) => {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      warnings.push(`Profil absent: ${rel}`);
      return;
    }
    const profile = JSON.parse(fs.readFileSync(full, 'utf8'));
    const toolkitId = profile.toolkit && profile.toolkit.id;
    if (toolkitId !== paradigm.toolkit) {
      errors.push(`${rel}: toolkit.id attendu "${paradigm.toolkit}", reçu "${toolkitId}"`);
    }
    const explorer = profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_EXPLORER_TEMPLATE;
    if (explorer && explorer !== paradigm.explorer) {
      errors.push(`${rel}: CAPSULE_EXPLORER_TEMPLATE attendu "${paradigm.explorer}", reçu "${explorer}"`);
    }
    if (paradigm.toolkit === 'cinnamon' && profile.assets && profile.assets.toolkitPack !== 'toolkits/cinnamon') {
      errors.push(`${rel}: assets.toolkitPack attendu toolkits/cinnamon`);
    }
    if (paradigm.toolkit === 'gnome' && profile.assets && profile.assets.toolkitPack !== 'toolkits/gnome') {
      errors.push(`${rel}: assets.toolkitPack attendu toolkits/gnome`);
    }
    if (paradigm.toolkit === 'kde' && profile.assets && profile.assets.toolkitPack !== 'toolkits/kde') {
      errors.push(`${rel}: assets.toolkitPack attendu toolkits/kde`);
    }
  });
};

const validateMintMenuData = () => {
  const menuData = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');
  if (!fs.existsSync(menuData)) {
    return;
  }
  const md = fs.readFileSync(menuData, 'utf8');
  if (md.includes('toolkits/gnome/apps')) {
    errors.push('mainMenu-data-cinnamon.js: chemins toolkits/gnome/apps — utiliser toolkits/cinnamon/apps');
  }
};

const validateExplorerCoreBranching = () => {
  const corePath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerContextMenu.js');
  if (!fs.existsSync(corePath)) {
    errors.push('fileExplorerContextMenu.js absent');
    return;
  }
  const text = fs.readFileSync(corePath, 'utf8');
  if (!text.includes('isNautilusGnomeTemplate') && !text.includes('isNautilusGnome')) {
    errors.push('fileExplorerContextMenu.js: branche toolkit GNOME absente');
  }
  if (!text.includes('bindNemoContextMenu')) {
    errors.push('fileExplorerContextMenu.js: branche Cinnamon Nemo absente');
  }
  if (text.includes('??') || text.includes('?.')) {
    errors.push('fileExplorerContextMenu.js: syntaxe ES6 interdite (?. ??)');
  }
  if (/\[\.\.\./.test(text) || /\{\.\.\./.test(text)) {
    errors.push('fileExplorerContextMenu.js: spread operator interdit');
  }
};

for (const targetId of TARGET_IDS) {
  const paradigm = PARADIGMS[targetId];
  if (!paradigm) {
    console.error(`✗ validate-toolkit-paradigm — id inconnu: ${targetId}`);
    process.exit(1);
  }
  scanSkin(paradigm.skin, paradigm);
  validateProfile(targetId, paradigm);
}

if (TARGET_IDS.includes('linux-mint')) {
  validateMintMenuData();
}
validateExplorerCoreBranching();

if (warnings.length) {
  warnings.forEach((w) => console.warn('  ⚠', w));
}

if (errors.length) {
  console.error(`✗ validate-toolkit-paradigm — ${errors.length} erreur(s) [${TARGET_IDS.join(', ')}]`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}

console.log(`✓ validate-toolkit-paradigm OK — [${TARGET_IDS.join(', ')}]`);
