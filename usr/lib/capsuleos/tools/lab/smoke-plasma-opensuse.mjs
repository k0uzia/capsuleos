#!/usr/bin/env node
/**
 * Smoke statique openSUSE Plasma P1 — profil, boot, panel, façade sans drift.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-plasma-opensuse.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const HOME = path.join(ROOT, 'home/SUSE/openSUSE');
const FACADE_DIR = path.join(ROOT, 'OS/linux/families/suse/opensuse');
const PROFILE_ETC = path.join(ROOT, 'etc/capsuleos/profiles/linux-opensuse.json');
const PLASMA_PANEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/plasma-panel-mode.js');

const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        errors.push(`Fichier manquant: ${rel}`);
        return '';
    }
    return fs.readFileSync(abs, 'utf8');
}

const indexHtml = read('home/SUSE/openSUSE/index.html');
const mainMenuData = read('home/SUSE/openSUSE/content/mainMenu-data.js');
const skinProfile = read('home/SUSE/openSUSE/skin.profile.json');
const etcProfile = read('etc/capsuleos/profiles/linux-opensuse.json');

if (!indexHtml.includes("window.CAPSULE_SKIN_PROFILE_ID = 'linux-opensuse'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-opensuse absent');
}
if (!indexHtml.includes('mainMenu.skin.css')) {
    errors.push('index.html : mainMenu.skin.css non lié dans <head>');
}
if (!indexHtml.includes('plasma-panel-mode.js')) {
    errors.push('index.html : plasma-panel-mode.js absent');
}
if (!indexHtml.includes('explorer-registry.js')) {
    errors.push('index.html : explorer-registry.js absent');
}
if (!indexHtml.includes('explorer-icon-base.js')) {
    errors.push('index.html : explorer-icon-base.js absent');
}
if (indexHtml.includes('fileExplorerInfo.js')) {
    errors.push('index.html : fileExplorerInfo.js (Cinnamon) ne doit pas être chargé sur Plasma/KDE');
}
if (mainMenuData.includes('./apps/system/')) {
    errors.push('mainMenu-data.js : chemins legacy ./apps/system/ interdits');
}
if (!mainMenuData.includes("name: 'Kate'") || !mainMenuData.includes("dataLink: 'text_editor'")) {
    errors.push('mainMenu-data.js : Kate doit pointer vers text_editor');
}
if (!mainMenuData.includes("name: 'Découvrir'") || !mainMenuData.includes("plasmadiscover.svg")) {
    errors.push('mainMenu-data.js : Discover (update_manager) manquant');
}
if (!indexHtml.includes('data-link="text_editor"')) {
    errors.push('index.html : slot text_editor manquant');
}
const dolphinBase = read('usr/share/capsuleos/linux/explorers/dolphin/base.css');
if (dolphinBase.includes('toolkits/cinnamon')) {
    errors.push('explorers/dolphin/base.css : chemins Cinnamon obsolètes (attendu toolkits/kde)');
}
if (!indexHtml.includes('data-link="update_manager"') || !indexHtml.includes('plasmadiscover.svg')) {
    errors.push('index.html : pin Discover / update_manager manquant');
}
if (!indexHtml.includes('data-link="terminal"') || !indexHtml.includes('konsole.svg')) {
    errors.push('index.html : pin Konsole manquant');
}
if (!indexHtml.includes('menu-burger.svg')) {
    errors.push('index.html : icône show-desktop (menu-burger) manquante');
}
if (indexHtml.includes('mainMenu-kde-chrome.js')) {
    errors.push('index.html : référence legacy mainMenu-kde-chrome.js');
}

const plasmaIdx = indexHtml.indexOf('plasma-panel-mode.js');
const shellIdx = indexHtml.indexOf('capsule-window-shell.js');
if (plasmaIdx === -1 || shellIdx === -1 || plasmaIdx > shellIdx) {
    errors.push('index.html : plasma-panel-mode.js doit précéder capsule-window-shell.js');
}

const dolphinIdx = indexHtml.indexOf('dolphin-icon-map.js');
const resourceIdx = indexHtml.indexOf('capsule-resource-url.js');
const windowJsIdx = indexHtml.indexOf('capsule-window.js');
if (dolphinIdx === -1 || resourceIdx === -1 || dolphinIdx > windowJsIdx || resourceIdx > windowJsIdx) {
    errors.push('index.html : dolphin-icon-map + capsule-resource-url avant capsule-window.js');
}

const mainMenuPlasma = read('home/SUSE/openSUSE/js/mainMenu-plasma.js');
if (!mainMenuPlasma.includes('resolveCapsuleResourceUrl')) {
    errors.push('mainMenu-plasma.js : resolveCapsuleResourceUrl non utilisé');
}

if (fs.existsSync(path.join(HOME, 'js/mainMenu-kde-chrome.js'))) {
    errors.push('home : mainMenu-kde-chrome.js encore présent (dead code)');
}

if (!fs.existsSync(PLASMA_PANEL)) {
    errors.push('Noyau plasma-panel-mode.js introuvable');
}

for (const src of [skinProfile, etcProfile]) {
    if (src.includes('"CAPSULE_TERMINAL_PROFILE": "debian"')) {
        errors.push('Profil : CAPSULE_TERMINAL_PROFILE doit être suse');
    }
    if (!src.includes('update_manager_kde')) {
        errors.push('Profil : override update_manager_kde manquant');
    }
}

const importsCss = read('home/SUSE/openSUSE/style/imports.css');
if (!importsCss.includes('plasma-panel-dock.css')) {
    errors.push('imports.css : plasma-panel-dock.css non importé');
}

if (!fs.existsSync(FACADE_DIR)) {
    errors.push('Façade OS/linux/families/suse/opensuse/ introuvable');
} else {
    const allowed = new Set(['index.html', 'skin.profile.json']);
    for (const entry of fs.readdirSync(FACADE_DIR, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            errors.push(`Façade drift : sous-dossier interdit ${entry.name}/`);
            continue;
        }
        if (!allowed.has(entry.name)) {
            errors.push(`Façade drift : fichier fantôme ${entry.name}`);
        }
    }
}

if (errors.length) {
    console.error('smoke-plasma-opensuse — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ smoke-plasma-opensuse OK');
