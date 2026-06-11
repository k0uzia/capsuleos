#!/usr/bin/env node
/**
 * Smoke statique magasin Cinnamon — catalogue Mint actif, Logithèque, scripts store.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-cinnamon-store-static.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreCatalogEntries } from './capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        errors.push(`Fichier manquant: ${rel}`);
        return '';
    }
    return fs.readFileSync(abs, 'utf8');
}

const indexHtml = read('home/Debian/Mint/index.html');
const template = read('usr/share/capsuleos/linux/apps/mintinstall.html');
const presentation = JSON.parse(read('etc/capsuleos/contracts/presentation-bindings.json') || '{}');
const mintStoreJs = read('usr/lib/capsuleos/shells/linux/mint-store-catalog.js');
const mintinstallJs = read('usr/lib/capsuleos/shells/linux/mintinstall.js');
const shellPinJs = read('usr/lib/capsuleos/shells/linux/cinnamon-store-shell-pin.js');

if (!indexHtml.includes("window.CAPSULE_SKIN_PROFILE_ID = 'linux-mint'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-mint absent');
}
if (!indexHtml.includes('capsule-store-catalog.js')) {
    errors.push('index.html : capsule-store-catalog.js absent');
}
if (!indexHtml.includes('mint-store-catalog.js')) {
    errors.push('index.html : mint-store-catalog.js absent');
}
if (!indexHtml.includes('mintinstall.js')) {
    errors.push('index.html : mintinstall.js absent');
}
if (!indexHtml.includes('cinnamon-store-shell-pin.js')) {
    errors.push('index.html : cinnamon-store-shell-pin.js absent');
}
if (!template.includes('mi-app__featured')) {
    errors.push('mintinstall.html : section vedette absente');
}
if (!template.includes('data-mi-cat="installed"')) {
    errors.push('mintinstall.html : catégorie Installés absente');
}
if (!template.includes('data-mi-discover-grid')) {
    errors.push('mintinstall.html : grille À découvrir absente');
}
if (!mintinstallJs.includes('renderDiscoverSection')) {
    errors.push('mintinstall.js : renderDiscoverSection absent');
}

const binding = presentation.bindings && presentation.bindings['linux-mint'];
if (!binding || binding.storeCatalogStatus !== 'active' || binding.toolkit !== 'cinnamon') {
    errors.push('presentation-bindings.json : linux-mint storeCatalogStatus active / toolkit cinnamon requis');
}
if (!binding || !binding.storeFront || binding.storeFront.slot !== 'mintinstall') {
    errors.push('presentation-bindings.json : storeFront mintinstall requis pour linux-mint');
}

const storeEntries = buildStoreCatalogEntries('linux-mint');
if (!storeEntries.length) {
    errors.push('catalogue magasin linux-mint : 0 entrée');
}

if (!mintStoreJs.includes('CapsuleCinnamonStore')) {
    errors.push('mint-store-catalog.js : alias CapsuleCinnamonStore absent');
}
if (!mintStoreJs.includes('getStoreAppEntry')) {
    errors.push('mint-store-catalog.js : getStoreAppEntry absent');
}
if (!mintinstallJs.includes('getDiscoverApps')) {
    errors.push('mintinstall.js : branchement catalogue magasin absent');
}
if (!mintinstallJs.includes('capsule:store-app-installed')) {
    errors.push('mintinstall.js : événement capsule:store-app-installed absent');
}
if (!shellPinJs.includes('capsule:cinnamon-store-menu-pin')) {
    errors.push('cinnamon-store-shell-pin.js : rafraîchissement menu absent');
}

const menuData = read('usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');
if (!menuData.includes("name: 'Logithèque'") || !menuData.includes("dataLink: 'mintinstall'")) {
    errors.push('mainMenu-data-cinnamon.js : Logithèque → dataLink mintinstall requis');
}

if (errors.length) {
    console.error('smoke-cinnamon-store-static — ÉCHEC');
    errors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

console.log(`smoke-cinnamon-store-static — OK (${storeEntries.length} apps magasin linux-mint)`);
