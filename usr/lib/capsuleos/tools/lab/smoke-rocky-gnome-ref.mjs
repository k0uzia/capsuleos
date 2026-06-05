#!/usr/bin/env node
/**
 * Smoke statique Rocky GNOME — référence toolkit GNOME (Nautilus, overview, dock).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-rocky-gnome-ref.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const indexHtml = read('home/RedHat/Rocky/index.html');
const overviewJs = read('home/RedHat/Rocky/js/overview.js');
const profile = read('etc/capsuleos/profiles/linux-rocky.json');
const override = read('etc/capsuleos/overrides/linux-rocky.json');
const registry = read('etc/capsuleos/os-registry.json');

if (!indexHtml.includes('data-link="text_editor"')) {
    errors.push('index.html : slot text_editor manquant');
}
if (!indexHtml.includes('data-overview-link="update_manager"')) {
    errors.push('index.html : dash Logiciels → update_manager manquant');
}
if (!indexHtml.includes('data-overview-link="text_editor"')) {
    errors.push('index.html : dash Éditeur de texte → text_editor manquant');
}
if (indexHtml.includes('data-overview-link="checklist"') && indexHtml.includes('Calendar')) {
    errors.push('index.html : Calendrier ne doit pas ouvrir checklist');
}
if (!indexHtml.includes("CAPSULE_SKIN_PROFILE_ID = 'linux-rocky'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-rocky absent');
}
if (!overviewJs.includes("dataLink: 'update_manager'")) {
    errors.push('overview.js : GNOME Software absent du catalogue recherche');
}
if (!overviewJs.includes("dataLink: 'text_editor'")) {
    errors.push('overview.js : Éditeur de texte absent du catalogue recherche');
}
if (!overviewJs.includes('openWindowByDataLink')) {
    errors.push('overview.js : fallback openWindowByDataLink manquant');
}
if (!profile.includes('"CAPSULE_EXPLORER_SKIN_KEY": "nautilus"')) {
    errors.push('profil : CAPSULE_EXPLORER_SKIN_KEY nautilus attendu');
}
if (!indexHtml.includes("CAPSULE_SKIN_PROFILE_ID = 'linux-rocky'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID doit être défini avant capsule-skin-boot');
}
if (!profile.includes('nemo-gnome')) {
    errors.push('profil : template explorateur nemo-gnome attendu');
}
if (!override.includes('CAPSULE_WINDOW_CONTEXT')) {
    errors.push('override : CAPSULE_WINDOW_CONTEXT manquant');
}
if (!override.includes('"nautilus"')) {
    errors.push('override : CAPSULE_EXPLORER_SKIN_KEY nautilus manquant');
}
if (indexHtml.includes('fileExplorerInfo.js')) {
    errors.push('index.html : fileExplorerInfo.js legacy interdit (utiliser explorer-registry)');
}
if (!indexHtml.includes('explorer-registry.js')) {
    errors.push('index.html : explorer-registry.js absent');
}
if (!indexHtml.includes('cluster-registry.js')) {
    errors.push('index.html : cluster-registry.js absent');
}
if (!registry.includes('"id": "linux-rocky"') || !registry.includes('"upstreamId": null')) {
    errors.push('os-registry : linux-rocky doit être racine GNOME (upstreamId null)');
}
if (!registry.includes('"id": "linux-fedora"') || !registry.includes('"upstreamId": "linux-rocky"')) {
    errors.push('os-registry : linux-fedora doit dériver de linux-rocky');
}

if (errors.length) {
    console.error('smoke-rocky-gnome-ref — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ smoke-rocky-gnome-ref OK');
