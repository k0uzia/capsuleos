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
if (!overviewJs.includes("dataLink: 'visionneur_images'")) {
    errors.push('overview.js : Loupe absent du catalogue recherche');
}
if (!indexHtml.includes('data-overview-link="visionneur_images"')) {
    errors.push('index.html : Loupe absent de la grille Aperçu');
}
if (!overviewJs.includes('org.gnome.Loupe.svg')) {
    errors.push('overview.js : icône Loupe VM manquante');
}
if (!indexHtml.includes('data-overview-link="snapshot"')) {
    errors.push('index.html : Snapshot absent de la grille Aperçu');
}
if (!overviewJs.includes("dataLink: 'snapshot'")) {
    errors.push('overview.js : Snapshot absent du catalogue recherche');
}
if (!indexHtml.includes('data-link="screenshot"')) {
    errors.push('index.html : slot screenshot manquant');
}
if (!indexHtml.includes('data-overview-link="visionneur_pdf"')) {
    errors.push('index.html : Papers (visionneur_pdf) absent de la grille Aperçu');
}
if (!overviewJs.includes("dataLink: 'visionneur_pdf'")) {
    errors.push('overview.js : Papers absent du catalogue recherche');
}
if (indexHtml.includes('aria-label="Contacts"') && !indexHtml.includes('org.gnome.Papers.svg')) {
    errors.push('index.html : Contacts doit être remplacé par Papers (RL10 VM)');
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

const dashOrder = [
    'data-overview-link="firefox"',
    'data-overview-link="calendar"',
    'data-overview-link="nemo"',
    'data-overview-link="update_manager"',
    'data-overview-link="terminal"',
    'data-overview-link="text_editor"',
    'data-overview-link="calculator"'
];
const dashBlock = indexHtml.match(/<nav class="fedora-overview__dash"[\s\S]*?<\/nav>/);
if (!dashBlock) {
    errors.push('index.html : nav.fedora-overview__dash introuvable');
} else {
    const dashHtml = dashBlock[0];
    const links = [...dashHtml.matchAll(/data-overview-link="([^"]+)"/g)].map((m) => m[1]);
    const expected = dashOrder.map((s) => s.replace('data-overview-link="', '').replace('"', ''));
    if (links.join(',') !== expected.join(',')) {
        errors.push(`index.html : ordre dash VM attendu ${expected.join(' → ')}, obtenu ${links.join(' → ')}`);
    }
}
if (indexHtml.includes('Fedora Media Writer')) {
    errors.push('index.html : Fedora Media Writer interdit sur Rocky (app Fedora-only)');
}
for (const wm of [
    'usr/share/capsuleos/assets/images/vendors/rocky/watermark/fedora_logo_darkbackground.svg',
    'usr/share/capsuleos/assets/images/vendors/rocky/watermark/fedora_logo_lightbackground.svg'
]) {
    if (!fs.existsSync(path.join(ROOT, wm))) {
        errors.push(`Asset watermark manquant: ${wm}`);
    }
}
if (!read('home/RedHat/Rocky/style/gnome-shell/tokens.css').includes('--rocky-watermark')) {
    errors.push('tokens.css : --rocky-watermark absent');
}
if (!indexHtml.includes('gnome-gsettings-store.js')) {
    errors.push('index.html : gnome-gsettings-store.js absent');
}
if (!indexHtml.includes('gnome-settings-parity.js')) {
    errors.push('index.html : gnome-settings-parity.js absent');
}
if (!indexHtml.includes('gnome-settings-vm-baseline-linux-rocky.js')) {
    errors.push('index.html : baseline VM Rocky absente');
}
if (!read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js').includes('filterSettingsSearch')) {
    errors.push('gnome-settings-parity.js : filterSettingsSearch absent');
}

if (errors.length) {
    console.error('smoke-rocky-gnome-ref — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ smoke-rocky-gnome-ref OK');
