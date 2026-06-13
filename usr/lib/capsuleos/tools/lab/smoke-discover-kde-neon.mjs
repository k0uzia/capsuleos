#!/usr/bin/env node
/**
 * Smoke statique Discover KDE neon — catalogue magasin actif, template Neon, scripts store.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
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

const indexHtml = read('home/Debian/KDE-Neon/index.html');
const template = read('usr/share/capsuleos/linux/apps/update_manager_kde_neon.html');
const catalogJson = read('home/Debian/KDE-Neon/content/discover-catalog.json');
const presentation = JSON.parse(read('etc/capsuleos/contracts/presentation-bindings.json') || '{}');
const discoverJs = read('usr/lib/capsuleos/shells/linux/discover-kde.js');

if (!indexHtml.includes("window.CAPSULE_SKIN_PROFILE_ID = 'linux-kde-neon'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-kde-neon absent');
}
if (!indexHtml.includes('capsule-store-catalog.js')) {
    errors.push('index.html : capsule-store-catalog.js absent');
}
if (!indexHtml.includes('gnome-store-catalog.js')) {
    errors.push('index.html : gnome-store-catalog.js absent');
}
if (!indexHtml.includes('discover-kde.js')) {
    errors.push('index.html : discover-kde.js absent');
}
if (!template.includes('update-manager--kde-neon')) {
    errors.push('update_manager_kde_neon.html : classe update-manager--kde-neon absente');
}
if (!template.includes('data-discover-nav="home"')) {
    errors.push('update_manager_kde_neon.html : navigation Discover absente');
}
if (!template.includes('data-discover-home-mount')) {
    errors.push('update_manager_kde_neon.html : montage accueil absent');
}

const binding = presentation.bindings && presentation.bindings['linux-kde-neon'];
if (!binding || binding.storeCatalogStatus !== 'active') {
    errors.push('presentation-bindings.json : linux-kde-neon storeCatalogStatus doit être active');
}

let catalog;
try {
    catalog = JSON.parse(catalogJson);
} catch (e) {
    errors.push('discover-catalog.json : JSON invalide');
}
if (catalog && (!catalog.homeSections || !catalog.homeSections.length)) {
    errors.push('discover-catalog.json : homeSections vide');
}

const storeEntries = buildStoreCatalogEntries('linux-kde-neon');
if (!storeEntries.length) {
    errors.push('catalogue magasin linux-kde-neon : 0 entrée storeInstallable');
}

if (!discoverJs.includes('getStoreDiscoverApps')) {
    errors.push('discover-kde.js : branchement catalogue magasin absent');
}
if (!discoverJs.includes('À découvrir')) {
    errors.push('discover-kde.js : section À découvrir absente');
}

try {
    const { spawnSync } = await import('child_process');
    const syntax = spawnSync(process.execPath, ['--check', path.join(ROOT, 'usr/lib/capsuleos/shells/linux/discover-kde.js')], {
        encoding: 'utf8',
    });
    if (syntax.status !== 0) {
        errors.push(`discover-kde.js : syntaxe invalide — ${(syntax.stderr || '').trim()}`);
    }
} catch (e) {
    errors.push(`discover-kde.js : vérif syntaxe impossible — ${e.message || e}`);
}

if (!discoverJs.includes('runInstallSimulation')) {
    errors.push('discover-kde.js : runInstallSimulation absent');
}

if (errors.length) {
    console.error('smoke-discover-kde-neon — ÉCHEC');
    errors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

console.log(`smoke-discover-kde-neon — OK (${storeEntries.length} apps magasin linux-kde-neon)`);
