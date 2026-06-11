#!/usr/bin/env node
/**
 * Gate vérité FS — home/public, manifeste canonique, config user-home.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-fs-routing.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

const userHomeCfg = path.join(ROOT, 'etc/capsuleos/user-home.json');
const manifestPath = path.join(ROOT, 'home/public/.capsule-manifest.json');
const legacyManifest = path.join(ROOT, 'home/public/nemo-manifest.json');

if (!fs.existsSync(userHomeCfg)) {
  errors.push('etc/capsuleos/user-home.json absent');
} else {
  const cfg = JSON.parse(fs.readFileSync(userHomeCfg, 'utf8'));
  if (cfg.defaultHome !== 'home/public') {
    errors.push(`user-home.defaultHome attendu home/public (reçu ${cfg.defaultHome})`);
  }
  if (cfg.logicalPath !== '/home/public') {
    errors.push(`user-home.logicalPath attendu /home/public (reçu ${cfg.logicalPath})`);
  }
}

if (!fs.existsSync(manifestPath)) {
  errors.push('home/public/.capsule-manifest.json absent');
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.root || !manifest.folders || !Object.keys(manifest.folders).length) {
    errors.push('.capsule-manifest.json invalide (root/folders)');
  }
  if (!manifest.folders[manifest.root]) {
    errors.push('.capsule-manifest.json : entrée root absente dans folders');
  }
}

if (fs.existsSync(legacyManifest)) {
  warnings.push('home/public/nemo-manifest.json legacy présent — supprimer ou migrer');
}

const manifestCheck = spawnSync(
  process.execPath,
  ['usr/lib/capsuleos/tools/generate-public-manifest.mjs', '--check'],
  { cwd: ROOT, encoding: 'utf8' },
);
if (manifestCheck.status !== 0) {
  errors.push('manifeste public non régénéré après changement home/public/');
}

const fsModules = [
  'usr/lib/capsuleos/common/user-home.js',
  'usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js',
  'usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerVfs.js',
  'usr/lib/capsuleos/shells/linux/terminal/virtual-shell.js',
  'usr/lib/capsuleos/shells/linux/explorers/commons/explorer-home.js',
];

fsModules.forEach((rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`module FS manquant : ${rel}`);
    return;
  }
  const text = fs.readFileSync(abs, 'utf8');
  if (!text.includes('.capsule-manifest.json') && !text.includes('manifestFileName')) {
    warnings.push(`${rel} : référence manifeste canonique non détectée`);
  }
});

function walkMenuData(dir, hits) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkMenuData(full, hits);
      continue;
    }
    if (name === 'mainMenu-data.js' || name === 'mainMenu-data-cinnamon.js') {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes('Dossier_personnel')) {
        hits.push(full.replace(`${ROOT}/`, ''));
      }
    }
  }
}

const legacyMenuHits = [];
walkMenuData(path.join(ROOT, 'home'), legacyMenuHits);
if (legacyMenuHits.length) {
  warnings.push(`menu-data legacy Dossier_personnel (${legacyMenuHits.length}) — repli mainMenu.normalizeMenuDirectory`);
}

if (warnings.length) {
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
  console.error(`✗ validate-fs-routing — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log('✓ validate-fs-routing OK — home/public + .capsule-manifest.json');
