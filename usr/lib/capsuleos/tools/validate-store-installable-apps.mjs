#!/usr/bin/env node
/**
 * Gate StoreΣ — contrat store-installable-apps + catalogue généré Alma.
 * Usage : node usr/lib/capsuleos/tools/validate-store-installable-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreCatalogEntries } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];

function readJson(rel) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`Fichier manquant: ${rel}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const store = readJson('etc/capsuleos/contracts/store-installable-apps.json');
const appsCatalog = readJson('etc/capsuleos/contracts/apps-catalog.json');
const presentation = readJson('etc/capsuleos/contracts/presentation-bindings.json');
const updateManager = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/update-manager.js'),
    'utf8'
);
const storeRuntime = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-store-catalog.js'),
    'utf8'
);
const storeGeneratedPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-store-catalog.js');
const storeGenerated = fs.existsSync(storeGeneratedPath)
    ? fs.readFileSync(storeGeneratedPath, 'utf8')
    : '';
const storeCss = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/style/update_manager_gnome.base.css'),
    'utf8'
);

const ALMA_P0_SLOTS = ['file_roller', 'libreoffice_startcenter', 'calendar'];
const ALMA_P1_SLOTS = [
    'thunderbird',
    'transmission',
    'rhythmbox',
    'lecteur_multimedia',
    'drawing',
    'simple_scan',
    'warpinator',
    'timeshift',
];
const ALMA_STORE_APP_IDS = [
    'file-roller',
    'libreoffice',
    'calendar',
    'thunderbird',
    'transmission',
    'rhythmbox',
    'lecteur-multimedia',
    'drawing',
    'simple-scan',
    'warpinator',
    'timeshift',
];
const CARDICON_CLASSES = [
    'gnome-software__cardicon--file-roller',
    'gnome-software__cardicon--libreoffice',
    'gnome-software__cardicon--calendar',
    'gnome-software__cardicon--thunderbird',
    'gnome-software__cardicon--transmission',
    'gnome-software__cardicon--rhythmbox',
    'gnome-software__cardicon--lecteur-multimedia',
    'gnome-software__cardicon--drawing',
    'gnome-software__cardicon--simple-scan',
    'gnome-software__cardicon--warpinator',
    'gnome-software__cardicon--timeshift',
];

function assertAlmaStoreSlot(slot) {
    const apps = store.apps || [];
    const entry = apps.find((a) => a.slot === slot);
    if (!entry) {
        errors.push(`store-installable-apps.json : slot ${slot} absent du catalogue`);
        return;
    }
    const almaSrc = entry.sources && entry.sources['linux-alma'];
    if (!almaSrc || almaSrc.storeInstallable !== true || almaSrc.defaultInstalled !== false) {
        errors.push(`store-installable-apps.json : linux-alma.${slot} doit avoir storeInstallable:true defaultInstalled:false`);
    }
}

if (store) {
    if (store.status !== 'active') {
        errors.push(`store-installable-apps.json : status attendu active (actuel: ${store.status})`);
    }
    if (!store.slotsManifestRef) {
        errors.push('store-installable-apps.json : slotsManifestRef absent');
    }
    const almaFront = presentation?.bindings?.['linux-alma']?.storeFront
        || store.storeFrontByRegistry?.['linux-alma'];
    if (!almaFront) {
        errors.push('presentation-bindings / storeFront linux-alma absent');
    }
    ALMA_P0_SLOTS.forEach(assertAlmaStoreSlot);
    ALMA_P1_SLOTS.forEach(assertAlmaStoreSlot);
}

if (appsCatalog && appsCatalog.registryOverrides) {
    const alma = appsCatalog.registryOverrides['linux-alma'];
    if (alma && alma.apps) {
        ['file_roller', 'calendar'].forEach((slot) => {
            const found = Object.values(alma.apps).some((a) => a.slot === slot && a.storeInstallable === true);
            if (!found) {
                errors.push(`apps-catalog linux-alma : slot store ${slot} non référencé`);
            }
        });
    }
}

const kernelNeedles = [
    'CapsuleGnomeStore',
    'renderDiscoverSection',
    'capsule:store-app-installed',
    'data-um-gnome-discover-grid',
];
kernelNeedles.forEach((needle) => {
    if (!updateManager.includes(needle)) {
        errors.push(`update-manager.js : « ${needle} » absent`);
    }
});

if (!storeRuntime.includes('CAPSULE_STORE_APPS_BY_REGISTRY')) {
    errors.push('gnome-store-catalog.js : consommation CAPSULE_STORE_APPS_BY_REGISTRY absente');
}
const STORE_REGISTRY_PILOTS = [
    { id: 'linux-alma', count: 11 },
    { id: 'linux-rocky', count: 11 },
    { id: 'linux-fedora', count: 11 },
];
for (const { id, count } of STORE_REGISTRY_PILOTS) {
    if (!storeGenerated.includes(`"${id}"`)) {
        errors.push(`capsule-store-catalog.js : pilote ${id} absent`);
    }
    const generatedEntries = buildStoreCatalogEntries(id);
    if (generatedEntries.length !== count) {
        errors.push(`capsule-store-catalog.js : attendu ${count} apps ${id} (actuel: ${generatedEntries.length})`);
    }
}
const generatedEntries = buildStoreCatalogEntries('linux-alma');
ALMA_STORE_APP_IDS.forEach((id) => {
    if (!storeGenerated.includes('"' + id + '"')) {
        errors.push(`capsule-store-catalog.js : app store ${id} absente`);
    }
});

CARDICON_CLASSES.forEach((cls) => {
    if (!storeCss.includes(cls)) {
        errors.push(`update_manager_gnome.base.css : classe ${cls} absente`);
    }
});

const html = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/update_manager_gnome.html'),
    'utf8'
);
if (!html.includes('data-um-gnome-discover-grid')) {
    errors.push('update_manager_gnome.html : section À découvrir absente');
}

const MINT_STORE_COUNT = 21;
const mintStoreRuntime = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mint-store-catalog.js'),
    'utf8'
);
const mintinstallRuntime = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mintinstall.js'),
    'utf8'
);
const cinnamonShellPin = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/cinnamon-store-shell-pin.js'),
    'utf8'
);
const mintHtml = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/mintinstall.html'),
    'utf8'
);
const mintBinding = presentation?.bindings?.['linux-mint'];
if (!mintBinding || mintBinding.storeCatalogStatus !== 'active' || mintBinding.toolkit !== 'cinnamon') {
    errors.push('presentation-bindings linux-mint : storeCatalogStatus active / toolkit cinnamon requis');
}
if (!mintBinding?.storeFront || mintBinding.storeFront.slot !== 'mintinstall') {
    errors.push('presentation-bindings linux-mint : storeFront mintinstall requis');
}
const mintGeneratedEntries = buildStoreCatalogEntries('linux-mint');
if (mintGeneratedEntries.length !== MINT_STORE_COUNT) {
    errors.push(`capsule-store-catalog.js : attendu ${MINT_STORE_COUNT} apps linux-mint (actuel: ${mintGeneratedEntries.length})`);
}
if (!mintStoreRuntime.includes('CapsuleCinnamonStore')) {
    errors.push('mint-store-catalog.js : CapsuleCinnamonStore absent');
}
if (!mintStoreRuntime.includes('getStoreAppEntry')) {
    errors.push('mint-store-catalog.js : getStoreAppEntry absent');
}
['getDiscoverApps', 'capsule:store-app-installed'].forEach((needle) => {
    if (!mintinstallRuntime.includes(needle)) {
        errors.push(`mintinstall.js : « ${needle} » absent`);
    }
});
if (!cinnamonShellPin.includes('capsule:store-app-installed')) {
    errors.push('cinnamon-store-shell-pin.js : écoute capsule:store-app-installed absente');
}
if (!mintHtml.includes('data-mi-spotlight') && !mintHtml.includes('mi-app__featured')) {
    errors.push('mintinstall.html : section logiciels phares / vedette absente');
}
if (!mintHtml.includes('data-mi-discover-grid')) {
    errors.push('mintinstall.html : section À découvrir absente');
}
if (!mintStoreRuntime.includes('recordStoreInstall')) {
    errors.push('mint-store-catalog.js : recordStoreInstall absent');
}

if (errors.length) {
    console.error(`✗ validate-store-installable-apps — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log('✓ validate-store-installable-apps OK — GNOME Alma/Rocky/Fedora (11 apps) + Cinnamon Mint (21 apps)');
process.exit(0);
