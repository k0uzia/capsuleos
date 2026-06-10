#!/usr/bin/env node
/**
 * Gate StoreΣ — contrat store-installable-apps + slots Alma référencés.
 * Usage : node usr/lib/capsuleos/tools/validate-store-installable-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const updateManager = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/update-manager.js'),
    'utf8'
);
const storeCatalog = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-store-catalog.js'),
    'utf8'
);

if (store) {
    if (store.status !== 'pilot-alma') {
        errors.push(`store-installable-apps.json : status attendu pilot-alma (actuel: ${store.status})`);
    }
    if (!store.storeFrontByRegistry || !store.storeFrontByRegistry['linux-alma']) {
        errors.push('store-installable-apps.json : storeFrontByRegistry.linux-alma absent');
    }
    const almaP0Slots = ['file_roller', 'libreoffice_startcenter', 'calendar'];
    const apps = store.apps || [];
    almaP0Slots.forEach((slot) => {
        const entry = apps.find((a) => a.slot === slot);
        if (!entry) {
            errors.push(`store-installable-apps.json : slot ${slot} absent du catalogue`);
            return;
        }
        const almaSrc = entry.sources && entry.sources['linux-alma'];
        if (!almaSrc || almaSrc.storeInstallable !== true || almaSrc.defaultInstalled !== false) {
            errors.push(`store-installable-apps.json : linux-alma.${slot} doit avoir storeInstallable:true defaultInstalled:false`);
        }
    });
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

if (!storeCatalog.includes("'linux-alma'")) {
    errors.push('gnome-store-catalog.js : pilote linux-alma absent');
}
['file-roller', 'libreoffice', 'calendar'].forEach((id) => {
    if (!storeCatalog.includes("'" + id + "'")) {
        errors.push(`gnome-store-catalog.js : app store ${id} absente`);
    }
});

const html = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/update_manager_gnome.html'),
    'utf8'
);
if (!html.includes('data-um-gnome-discover-grid')) {
    errors.push('update_manager_gnome.html : section À découvrir absente');
}

if (errors.length) {
    console.error(`✗ validate-store-installable-apps — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log('✓ validate-store-installable-apps OK — pilote Alma (file_roller, LibreOffice, Agenda)');
process.exit(0);
