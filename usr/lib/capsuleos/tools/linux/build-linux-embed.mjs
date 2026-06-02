#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-app-embed.js (Linux offline embed).
 * Usage : node scripts/build-linux-embed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const APPS_DIR = path.join(ROOT, 'usr/share/capsuleos/linux/apps');
const STYLE_DIR = path.join(APPS_DIR, 'style');
const KDE_COMMON_SKIN = path.join(STYLE_DIR, 'skins/kde/update_manager.skin.css');
const KDE_UPDATE_MANAGER_HTML = path.join(APPS_DIR, 'update_manager_kde.html');
const UBUNTU_UPDATE_MANAGER_HTML = path.join(APPS_DIR, 'update_manager_ubuntu.html');
const OUT_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');
const MANIFEST_PATH = path.join(ROOT, 'home/public/.capsule-manifest.json');

const FAMILY_APP_HTML_DIRS = {
    opensuse: path.join(ROOT, 'home/SUSE/openSUSE/apps'),
    anduinos: path.join(ROOT, 'home/Debian/AnduinOS/apps'),
    'debian-kde': path.join(ROOT, 'home/Debian/Debian-KDE/apps')
};

const SKIN_DIRS = [
    { key: 'mint', dir: path.join(ROOT, 'home/Debian/Mint/style/apps'), strings: path.join(ROOT, 'home/Debian/Mint/content/strings.json') },
    { key: 'ubuntu', dir: path.join(ROOT, 'home/Debian/Ubuntu/style/apps'), strings: path.join(ROOT, 'home/Debian/Ubuntu/content/strings.json') },
    { key: 'anduinos', dir: path.join(ROOT, 'home/Debian/AnduinOS/style/apps'), strings: path.join(ROOT, 'home/Debian/AnduinOS/content/strings.json') },
    { key: 'popos', dir: path.join(ROOT, 'home/Debian/PopOS/style/apps'), strings: path.join(ROOT, 'home/Debian/PopOS/content/strings.json') },
    { key: 'mxkde', dir: path.join(ROOT, 'home/Debian/MX-KDE/style/apps'), strings: path.join(ROOT, 'home/Debian/MX-KDE/content/strings.json') },
    { key: 'opensuse', dir: path.join(ROOT, 'home/SUSE/openSUSE/style/apps'), strings: path.join(ROOT, 'home/SUSE/openSUSE/content/strings.json') },
    { key: 'fedora', dir: path.join(ROOT, 'home/RedHat/Fedora/style/apps'), strings: path.join(ROOT, 'home/RedHat/Fedora/content/strings.json') },
    { key: 'debian-kde', dir: path.join(ROOT, 'home/Debian/Debian-KDE/style/apps'), strings: path.join(ROOT, 'home/Debian/Debian-KDE/content/strings.json') }
];

function readUtf8(p) {
    return fs.readFileSync(p, 'utf8');
}

function listTemplateIds() {
    const names = fs.readdirSync(APPS_DIR);
    return names
        .filter((n) => n.endsWith('.html') && !fs.statSync(path.join(APPS_DIR, n)).isDirectory())
        .map((n) => path.basename(n, '.html'));
}

function listSkinIds(skinDir) {
    if (!fs.existsSync(skinDir)) {
        return [];
    }
    return fs.readdirSync(skinDir)
        .filter((n) => n.endsWith('.skin.css') && !fs.statSync(path.join(skinDir, n)).isDirectory())
        .map((n) => n.slice(0, -'.skin.css'.length));
}

function buildCssBase(templateId) {
    const cssBaseId = ['nemo-gnome', 'nemo-cosmic', 'nautilus', 'nautilus-cosmic'].includes(templateId)
        ? 'nemo'
        : templateId;
    const baseFile = path.join(STYLE_DIR, `${cssBaseId}.base.css`);
    let text = readUtf8(baseFile);
    if (templateId === 'dolphin') {
        const nemoBase = path.join(STYLE_DIR, 'nemo.base.css');
        text = `${readUtf8(nemoBase)}\n${text}`;
    }
    return text;
}

function readSkinCss(skinDir, templateId) {
    const f = path.join(skinDir, `${templateId}.skin.css`);
    if (!fs.existsSync(f)) {
        return '';
    }
    return readUtf8(f);
}

function readSkinStrings(stringsPath) {
    if (!fs.existsSync(stringsPath)) {
        return {};
    }
    try {
        return JSON.parse(readUtf8(stringsPath));
    } catch (error) {
        console.warn(`Chaînes ignorées (${stringsPath}): ${error.message}`);
        return {};
    }
}

function readTemplateHtml(templateId) {
    const htmlPath = path.join(APPS_DIR, `${templateId}.html`);
    return readUtf8(htmlPath);
}

function main() {
    const templateIds = listTemplateIds().sort();
    const templates = {};
    for (const id of templateIds) {
        templates[id] = {
            html: readTemplateHtml(id),
            cssBase: buildCssBase(id)
        };
    }

    const skinTemplates = {};
    for (const [skinKey, familyAppsDir] of Object.entries(FAMILY_APP_HTML_DIRS)) {
        if (!fs.existsSync(familyAppsDir)) {
            continue;
        }
        skinTemplates[skinKey] = {};
        for (const id of templateIds) {
            const overridePath = path.join(familyAppsDir, `${id}.html`);
            if (fs.existsSync(overridePath)) {
                skinTemplates[skinKey][id] = { html: readUtf8(overridePath) };
            }
        }
    }

    if (fs.existsSync(KDE_UPDATE_MANAGER_HTML)) {
        for (const skinKey of ['opensuse', 'mxkde']) {
            skinTemplates[skinKey] = skinTemplates[skinKey] || {};
            skinTemplates[skinKey].update_manager = { html: readUtf8(KDE_UPDATE_MANAGER_HTML) };
        }
    }

    if (fs.existsSync(UBUNTU_UPDATE_MANAGER_HTML)) {
        skinTemplates.ubuntu = skinTemplates.ubuntu || {};
        skinTemplates.ubuntu.update_manager = { html: readUtf8(UBUNTU_UPDATE_MANAGER_HTML) };
    }

    const skins = {};
    const embedStrings = {};
    for (const { key, dir, strings } of SKIN_DIRS) {
        skins[key] = {};
        embedStrings[key] = readSkinStrings(strings);
        const skinIds = Array.from(new Set([...templateIds, ...listSkinIds(dir)])).sort();
        for (const id of skinIds) {
            let css = readSkinCss(dir, id);
            const isKdeFamily = key === 'opensuse' || key === 'mxkde' || key === 'debian-kde';
            if (isKdeFamily && id === 'update_manager' && fs.existsSync(KDE_COMMON_SKIN)) {
                css = `${readUtf8(KDE_COMMON_SKIN)}\n${css}`;
            }
            skins[key][id] = css;
        }
    }

    const manifest = JSON.parse(readUtf8(MANIFEST_PATH));

    const header = `/* Généré par scripts/build-linux-embed.mjs — ne pas éditer à la main */
(function () {
'use strict';
`;

    const body = `window.CAPSULE_APP_EMBED = ${JSON.stringify({ templates, skinTemplates, skins })};
window.CAPSULE_EMBED_STRINGS = ${JSON.stringify(embedStrings)};
window.CAPSULE_FILE_EXPLORER_MANIFEST_EMBED = ${JSON.stringify(manifest)};
window.CAPSULE_NEMO_MANIFEST_EMBED = window.CAPSULE_FILE_EXPLORER_MANIFEST_EMBED;
})();`;

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, `${header}\n${body}\n`, 'utf8');
    console.log(`Écrit ${OUT_FILE} (${templateIds.length} templates, ${SKIN_DIRS.length} skins)`);
}

main();
