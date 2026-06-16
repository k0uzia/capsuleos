#!/usr/bin/env node
/**
 * Smoke branchement icônes « À découvrir » — assets repo + CSS Neon.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-neon-store-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const inventoryScript = path.join(ROOT, 'root/tools/lab/inventory-kde-neon-discover-store-icons.mjs');
const neonCss = path.join(ROOT, 'home/Debian/KDE-Neon/style/apps/discover-store-icons.skin.css');
const skinCss = path.join(ROOT, 'home/Debian/KDE-Neon/style/apps/update_manager.skin.css');

const inv = spawnSync('node', [inventoryScript, '--write'], { cwd: ROOT, encoding: 'utf8' });
const invOut = `${inv.stdout || ''}${inv.stderr || ''}`.trim();
if (inv.status !== 0) {
    console.error('smoke-discover-neon-store-icons — inventaire ÉCHEC');
    console.error(invOut);
    process.exit(1);
}

const errors = [];
const css = fs.readFileSync(neonCss, 'utf8');
const required = [
    'gnome-software__cardicon--calendar',
    'gnome-software__cardicon--file-roller',
    'gnome-software__cardicon--libreoffice',
    'gnome-software__cardicon--thunderbird',
    'gnome-software__cardicon--transmission',
    'gnome-software__cardicon--rhythmbox',
    'gnome-software__cardicon--lecteur-multimedia',
    'gnome-software__cardicon--drawing',
    'gnome-software__cardicon--simple-scan',
    'gnome-software__cardicon--warpinator',
    'gnome-software__cardicon--timeshift',
];

for (const cls of required) {
    if (!css.includes(cls)) {
        errors.push(`discover-store-icons.skin.css : ${cls} absent`);
    }
    if (!css.includes('./assets/images/toolkits/gnome/apps/')) {
        errors.push('discover-store-icons.skin.css : chemins logiques ./assets/ absents');
        break;
    }
}

const skinImport = fs.readFileSync(skinCss, 'utf8');
if (!skinImport.includes('gnome-software__cardicon--thunderbird')) {
    errors.push('update_manager.skin.css : règles À découvrir inline absentes');
}
if (!skinImport.includes('./assets/images/toolkits/gnome/apps/thunderbird.png')) {
    errors.push('update_manager.skin.css : thunderbird.png absent (MIME HTTP)');
}
if (!skinImport.includes('org.gnome.FileRoller.svg')) {
    errors.push('update_manager.skin.css : FileRoller.svg absent (MIME HTTP)');
}

const invJson = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-discover-store-icons.json'), 'utf8')
);
if (invJson.counts.missing !== 0) {
    errors.push(`inventaire : ${invJson.counts.missing} asset(s) manquant(s)`);
}

if (errors.length) {
    console.error('smoke-discover-neon-store-icons — ÉCHEC');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log(`smoke-discover-neon-store-icons — OK (${invJson.counts.resolved} icônes À découvrir branchées)`);
