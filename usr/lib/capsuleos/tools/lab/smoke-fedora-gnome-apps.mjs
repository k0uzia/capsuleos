#!/usr/bin/env node
/**
 * Smoke statique Fedora GNOME — parité apps dash/dock/overview.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-fedora-gnome-apps.mjs
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

const indexHtml = read('home/RedHat/Fedora/index.html');
const overviewJs = read('home/RedHat/Fedora/js/overview.js');
const profile = read('etc/capsuleos/profiles/linux-fedora.json');

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
if (!indexHtml.includes('CAPSULE_SKIN_PROFILE_ID = \'linux-fedora\'')) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-fedora absent');
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
if (!profile.includes('CAPSULE_WINDOW_CONTEXT')) {
    errors.push('profil : CAPSULE_WINDOW_CONTEXT manquant');
}
if (!profile.includes('nemo-gnome')) {
    errors.push('profil : template explorateur nemo-gnome attendu');
}
if (indexHtml.includes('fileExplorerInfo.js')) {
    errors.push('index.html : fileExplorerInfo.js legacy interdit (utiliser explorer-registry)');
}
if (!indexHtml.includes('explorer-registry.js')) {
    errors.push('index.html : explorer-registry.js absent');
}

if (errors.length) {
    console.error('smoke-fedora-gnome-apps — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ smoke-fedora-gnome-apps OK');
