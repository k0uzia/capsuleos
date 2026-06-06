#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-app-embed.js (Linux offline embed).
 * Usage : node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const APPS_DIR = path.join(ROOT, 'usr/share/capsuleos/linux/apps');
const EXPLORERS_DIR = path.join(ROOT, 'usr/share/capsuleos/linux/explorers');
const STYLE_DIR = path.join(APPS_DIR, 'style');

/** Aligné sur explorer-registry.js — gabarits sous explorers/, pas sous apps/*.html */
const EXPLORER_TEMPLATES = {
    nautilus: {
        shellRelative: 'nautilus/shell-gnome.html',
        cssBaseStack: ['nemo/base.css', 'nautilus/header-gnome.css']
    },
    'nemo-gnome': {
        shellRelative: 'nautilus/shell-gnome.html',
        cssBaseStack: ['nemo/base.css', 'nautilus/header-gnome.css']
    },
    'nemo-cosmic': {
        shellRelative: 'nautilus/shell-cosmic.html',
        cssBaseStack: ['nemo/base.css']
    },
    'nautilus-cosmic': {
        shellRelative: 'nautilus/shell-cosmic.html',
        cssBaseStack: ['nemo/base.css']
    },
    dolphin: {
        shellRelative: 'dolphin/shell.html',
        cssBaseStack: ['nemo/base.css', 'dolphin/base.css']
    }
};
const KDE_COMMON_SKIN = path.join(STYLE_DIR, 'skins/kde/update_manager.skin.css');
const KDE_UPDATE_MANAGER_HTML = path.join(APPS_DIR, 'update_manager_kde.html');
const UBUNTU_UPDATE_MANAGER_HTML = path.join(APPS_DIR, 'update_manager_ubuntu.html');
const GNOME_UPDATE_MANAGER_HTML = path.join(APPS_DIR, 'update_manager_gnome.html');
const GNOME_THEMES_HTML = path.join(APPS_DIR, 'themes_gnome.html');
const OUT_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');
const MANIFEST_PATH = path.join(ROOT, 'home/public/.capsule-manifest.json');

const FAMILY_APP_HTML_DIRS = {
    opensuse: path.join(ROOT, 'home/SUSE/openSUSE/apps'),
    anduinos: path.join(ROOT, 'home/Debian/AnduinOS/apps'),
    'debian-kde': path.join(ROOT, 'home/Debian/Debian-KDE/apps'),
    'kde-neon': path.join(ROOT, 'home/Debian/KDE-Neon/apps')
};

const SKIN_DIRS = [
    { key: 'mint', dir: path.join(ROOT, 'home/Debian/Mint/style/apps'), strings: path.join(ROOT, 'home/Debian/Mint/content/strings.json') },
    { key: 'ubuntu', dir: path.join(ROOT, 'home/Debian/Ubuntu/style/apps'), strings: path.join(ROOT, 'home/Debian/Ubuntu/content/strings.json') },
    { key: 'anduinos', dir: path.join(ROOT, 'home/Debian/AnduinOS/style/apps'), strings: path.join(ROOT, 'home/Debian/AnduinOS/content/strings.json') },
    { key: 'popos', dir: path.join(ROOT, 'home/Debian/PopOS/style/apps'), strings: path.join(ROOT, 'home/Debian/PopOS/content/strings.json') },
    { key: 'mxkde', dir: path.join(ROOT, 'home/Debian/MX-KDE/style/apps'), strings: path.join(ROOT, 'home/Debian/MX-KDE/content/strings.json') },
    { key: 'opensuse', dir: path.join(ROOT, 'home/SUSE/openSUSE/style/apps'), strings: path.join(ROOT, 'home/SUSE/openSUSE/content/strings.json') },
    { key: 'fedora', dir: path.join(ROOT, 'home/RedHat/Fedora/style/apps'), strings: path.join(ROOT, 'home/RedHat/Fedora/content/strings.json') },
    { key: 'rocky', dir: path.join(ROOT, 'home/RedHat/Rocky/style/apps'), strings: path.join(ROOT, 'home/RedHat/Rocky/content/strings.json') },
    { key: 'alma', dir: path.join(ROOT, 'home/RedHat/Alma/style/apps'), strings: path.join(ROOT, 'home/RedHat/Alma/content/strings.json') },
    { key: 'debian-kde', dir: path.join(ROOT, 'home/Debian/Debian-KDE/style/apps'), strings: path.join(ROOT, 'home/Debian/Debian-KDE/content/strings.json') },
    { key: 'kde-neon', dir: path.join(ROOT, 'home/Debian/KDE-Neon/style/apps'), strings: path.join(ROOT, 'home/Debian/KDE-Neon/content/strings.json') }
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
    if (templateId === 'themes') {
        const gnomeBase = path.join(STYLE_DIR, 'themes_gnome.base.css');
        if (fs.existsSync(gnomeBase)) {
            text = `${text}\n${readUtf8(gnomeBase)}`;
        }
    }
    return text;
}

const EXPLORER_SKIN_ALIASES = {
    'nemo-gnome': 'nautilus',
    files: 'nautilus'
};

function readSkinCss(skinDir, templateId) {
    const f = path.join(skinDir, `${templateId}.skin.css`);
    if (fs.existsSync(f)) {
        return readUtf8(f);
    }
    const alias = EXPLORER_SKIN_ALIASES[templateId];
    if (alias) {
        const aliasFile = path.join(skinDir, `${alias}.skin.css`);
        if (fs.existsSync(aliasFile)) {
            return readUtf8(aliasFile);
        }
    }
    return '';
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

function readExplorerTemplate(templateId) {
    const profile = EXPLORER_TEMPLATES[templateId];
    if (!profile) {
        return null;
    }
    const htmlPath = path.join(EXPLORERS_DIR, profile.shellRelative);
    const html = readUtf8(htmlPath);
    const cssBase = profile.cssBaseStack
        .map((rel) => readUtf8(path.join(EXPLORERS_DIR, rel)))
        .join('\n');
    return { html, cssBase };
}

function main() {
    const templateIds = Array.from(new Set([
        ...listTemplateIds(),
        ...Object.keys(EXPLORER_TEMPLATES)
    ])).sort();
    const templates = {};
    for (const id of templateIds) {
        const explorer = readExplorerTemplate(id);
        if (explorer) {
            templates[id] = explorer;
            continue;
        }
        const appsHtml = path.join(APPS_DIR, `${id}.html`);
        if (!fs.existsSync(appsHtml)) {
            continue;
        }
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
        for (const skinKey of ['opensuse', 'mxkde', 'kde-neon']) {
            skinTemplates[skinKey] = skinTemplates[skinKey] || {};
            skinTemplates[skinKey].update_manager = { html: readUtf8(KDE_UPDATE_MANAGER_HTML) };
        }
    }

    if (fs.existsSync(UBUNTU_UPDATE_MANAGER_HTML)) {
        skinTemplates.ubuntu = skinTemplates.ubuntu || {};
        skinTemplates.ubuntu.update_manager = { html: readUtf8(UBUNTU_UPDATE_MANAGER_HTML) };
    }

    if (fs.existsSync(GNOME_UPDATE_MANAGER_HTML)) {
        for (const skinKey of ['rocky', 'fedora', 'alma', 'anduinos']) {
            skinTemplates[skinKey] = skinTemplates[skinKey] || {};
            skinTemplates[skinKey].update_manager = { html: readUtf8(GNOME_UPDATE_MANAGER_HTML) };
        }
    }

    if (fs.existsSync(GNOME_THEMES_HTML)) {
        for (const skinKey of ['rocky', 'fedora', 'alma', 'anduinos', 'ubuntu']) {
            skinTemplates[skinKey] = skinTemplates[skinKey] || {};
            skinTemplates[skinKey].themes = { html: readUtf8(GNOME_THEMES_HTML) };
        }
    }

    const skins = {};
    const embedStrings = {};
    for (const { key, dir, strings } of SKIN_DIRS) {
        skins[key] = {};
        embedStrings[key] = readSkinStrings(strings);
        const skinIds = Array.from(new Set([...templateIds, ...listSkinIds(dir)])).sort();
        for (const id of skinIds) {
            let css = readSkinCss(dir, id);
            const isKdeFamily = key === 'opensuse' || key === 'mxkde' || key === 'debian-kde' || key === 'kde-neon';
            if (isKdeFamily && id === 'update_manager' && fs.existsSync(KDE_COMMON_SKIN)) {
                css = `${readUtf8(KDE_COMMON_SKIN)}\n${css}`;
            }
            skins[key][id] = css;
        }
    }

    const manifest = JSON.parse(readUtf8(MANIFEST_PATH));

    const header = `/* Généré par usr/lib/capsuleos/tools/linux/build-linux-embed.mjs — ne pas éditer à la main */
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
    const explorerIds = Object.keys(EXPLORER_TEMPLATES).filter((id) => templates[id]);
    console.log(`Écrit ${OUT_FILE} (${Object.keys(templates).length} templates dont ${explorerIds.length} explorateurs, ${SKIN_DIRS.length} skins)`);
}

main();
