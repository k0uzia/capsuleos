#!/usr/bin/env node
/**
 * Vérifie que chaque skin actif charge le chrome depuis le cluster toolkit DE,
 * sans héritage Mint (window-chrome.base.css) hors Cinnamon.
 * Usage : node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const CLUSTERS_DIR = path.join(ROOT, 'usr/share/capsuleos/themes/clusters');

const TOOLKIT_CHROME_REL = {
    gnome: 'usr/share/capsuleos/themes/clusters/toolkit-gnome/chrome.css',
    cinnamon: 'usr/share/capsuleos/themes/clusters/toolkit-cinnamon/chrome.css',
    cosmic: 'usr/share/capsuleos/themes/clusters/toolkit-cosmic/chrome.css',
    kde: 'usr/share/capsuleos/themes/clusters/toolkit-kde/chrome.css',
};

/** Motifs interdits dans imports.css selon le toolkit (héritage croisé). */
const FORBIDDEN_PATTERNS = {
    gnome: [
        'themes/linux/window-chrome.base.css',
        'toolkit-cinnamon/chrome.css',
    ],
    cosmic: [
        'themes/linux/window-chrome.base.css',
        'themes/linux/window-chrome.gnome.base.css',
        'toolkit-cinnamon/chrome.css',
        'toolkit-gnome/chrome.css',
    ],
    kde: [
        'themes/linux/window-chrome.base.css',
        'themes/linux/window-chrome.gnome.base.css',
        'toolkit-cinnamon/chrome.css',
        'toolkit-gnome/chrome.css',
        'toolkit-cosmic/chrome.css',
    ],
    cinnamon: [
        'themes/linux/window-chrome.gnome.base.css',
        'toolkit-gnome/chrome.css',
        'toolkit-cosmic/chrome.css',
        'toolkit-kde/chrome.css',
    ],
};

const errors = [];

Object.entries(TOOLKIT_CHROME_REL).forEach(([toolkitId, rel]) => {
    if (!fs.existsSync(path.join(ROOT, rel))) {
        errors.push(`cluster chrome manquant : ${rel}`);
    }
});

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'));

for (const file of profileFiles) {
    const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
    if (profile.status !== 'active') {
        continue;
    }
    const profileId = profile.id || file.replace('.json', '');
    const toolkitId = profile.toolkit && profile.toolkit.id;
    if (!toolkitId || !TOOLKIT_CHROME_REL[toolkitId]) {
        continue;
    }

    const skinRel = (profile.paths && profile.paths.skin)
        || (profile.referencePaths && profile.referencePaths.skin);
    if (!skinRel) {
        errors.push(`${profileId}: paths.skin manquant`);
        continue;
    }

    const importsPath = path.join(ROOT, skinRel.replace(/index\.html$/, 'style/imports.css'));
    if (!fs.existsSync(importsPath)) {
        errors.push(`${profileId}: imports.css introuvable — ${importsPath}`);
        continue;
    }

    const importsSrc = fs.readFileSync(importsPath, 'utf8');
    const expectedChrome = TOOLKIT_CHROME_REL[toolkitId];
    const expectedNeedle = `themes/clusters/toolkit-${toolkitId}/chrome.css`;

    if (!importsSrc.includes(expectedNeedle)) {
        errors.push(
            `${profileId} (${toolkitId}): imports.css doit importer ${expectedNeedle}`
        );
    }

    (FORBIDDEN_PATTERNS[toolkitId] || []).forEach((pattern) => {
        if (importsSrc.includes(pattern)) {
            errors.push(
                `${profileId} (${toolkitId}): imports.css contient motif interdit « ${pattern} »`
            );
        }
    });

    if (toolkitId !== 'cinnamon' && importsSrc.includes('cinnamon-window-chrome.css')) {
        errors.push(
            `${profileId} (${toolkitId}): cinnamon-window-chrome.css réservé au toolkit Cinnamon`
        );
    }
}

const clusterChromeFiles = fs.readdirSync(CLUSTERS_DIR)
    .filter((d) => d.startsWith('toolkit-') && fs.statSync(path.join(CLUSTERS_DIR, d)).isDirectory())
    .map((d) => path.join(CLUSTERS_DIR, d, 'chrome.css'))
    .filter((f) => fs.existsSync(f));

if (clusterChromeFiles.length < 4) {
    errors.push(`clusters toolkit : ${clusterChromeFiles.length}/4 chrome.css présents`);
}

if (errors.length) {
    console.error(`✗ validate-toolkit-chrome-isolation — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-toolkit-chrome-isolation OK — ${profileFiles.filter((f) => {
    const p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), 'utf8'));
    return p.status === 'active' && p.toolkit && TOOLKIT_CHROME_REL[p.toolkit.id];
}).length} profil(s) actif(s), ${clusterChromeFiles.length} hub(s) chrome`);
