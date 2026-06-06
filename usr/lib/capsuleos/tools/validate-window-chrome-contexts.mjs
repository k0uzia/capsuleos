#!/usr/bin/env node
/**
 * Contrat window-chrome-contexts — toolkit DE, providers explorateur, profils skin.
 * Usage : node usr/lib/capsuleos/tools/validate-window-chrome-contexts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

const buildPath = path.join(ROOT, 'usr/lib/capsuleos/tools/build-capsule-window.mjs');
const profilesDir = path.join(ROOT, 'etc/capsuleos/profiles');

function mustExist(rel, label) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`${label}: fichier introuvable ${rel}`);
        return null;
    }
    return full;
}

const contractFull = mustExist('etc/capsuleos/contracts/window-chrome-contexts.json', 'contract');
const headerFull = mustExist('usr/lib/capsuleos/common/window/header-context.js', 'header-context');
mustExist('usr/lib/capsuleos/common/window/chrome.js', 'chrome.js');
mustExist('home/Debian/Mint/style/cinnamon-window-chrome.css', 'cinnamon-window-chrome.css');

if (contractFull && headerFull) {
    const contract = JSON.parse(fs.readFileSync(contractFull, 'utf8'));
    const headerSrc = fs.readFileSync(headerFull, 'utf8');
    const buildSrc = fs.readFileSync(buildPath, 'utf8');
    const chromeSrc = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/common/window/chrome.js'), 'utf8');

    if (!buildSrc.includes("'header-context.js'")) {
        errors.push('build-capsule-window.mjs: header-context.js absent du bundle');
    }
    if (!headerSrc.includes('CapsuleWindowHeaderContext')) {
        errors.push('header-context.js: API CapsuleWindowHeaderContext manquante');
    }
    if (!chromeSrc.includes('providers.cinnamon')) {
        errors.push('chrome.js: provider cinnamon manquant (barre titre Muffin)');
    }
    if (!chromeSrc.includes('data-window-chrome-toolkit')) {
        errors.push('chrome.js: doit poser data-window-chrome-toolkit sur .windowElement');
    }

    Object.entries(contract.toolkits || {}).forEach(([toolkitId, spec]) => {
        if (!headerSrc.includes(`'${toolkitId}'`) && !headerSrc.includes(`"${toolkitId}"`)) {
            warnings.push(`header-context.js: toolkit « ${toolkitId} » absent des défauts runtime`);
        }
        const clusterRel = spec.chromeCssCluster;
        if (clusterRel && !fs.existsSync(path.join(ROOT, clusterRel))) {
            errors.push(`toolkit ${toolkitId}: chromeCssCluster introuvable — ${clusterRel}`);
        }
    });

    const gnomeTemplates = contract.toolkits.gnome && contract.toolkits.gnome.explorerTemplates;
    const kdeTemplates = contract.toolkits.kde && contract.toolkits.kde.explorerTemplates;
    if (gnomeTemplates && kdeTemplates) {
        const overlap = gnomeTemplates.filter((t) => kdeTemplates.indexOf(t) !== -1);
        if (overlap.length) {
            errors.push(`templates explorateur partagés GNOME/KDE: ${overlap.join(', ')}`);
        }
    }

    for (const file of fs.readdirSync(profilesDir).filter((f) => f.endsWith('.json'))) {
        const profile = JSON.parse(fs.readFileSync(path.join(profilesDir, file), 'utf8'));
        if (profile.status !== 'active') {
            continue;
        }
        const profileId = profile.id || file.replace('.json', '');
        const toolkitId = profile.toolkit && profile.toolkit.id;
        const globals = profile.capsuleGlobals || {};
        const chromeCtx = globals.CAPSULE_WINDOW_CHROME_CONTEXT;
        const explorerTemplate = globals.CAPSULE_EXPLORER_TEMPLATE;

        if (!chromeCtx || typeof chromeCtx !== 'object') {
            errors.push(`${profileId}: CAPSULE_WINDOW_CHROME_CONTEXT manquant`);
            continue;
        }
        if (toolkitId && chromeCtx.toolkitId !== toolkitId) {
            errors.push(`${profileId}: toolkitId chrome (${chromeCtx.toolkitId}) ≠ profile.toolkit.id (${toolkitId})`);
        }
        if (explorerTemplate && chromeCtx.explorerTemplate !== explorerTemplate) {
            errors.push(`${profileId}: explorerTemplate chrome (${chromeCtx.explorerTemplate}) ≠ CAPSULE_EXPLORER_TEMPLATE (${explorerTemplate})`);
        }
        const toolkitContract = contract.toolkits && contract.toolkits[chromeCtx.toolkitId];
        if (!toolkitContract) {
            errors.push(`${profileId}: toolkit « ${chromeCtx.toolkitId} » absent du contrat`);
            continue;
        }
        const allowedTemplates = toolkitContract.explorerTemplates || [];
        if (chromeCtx.explorerTemplate
            && allowedTemplates.indexOf(chromeCtx.explorerTemplate) === -1) {
            errors.push(`${profileId}: template « ${chromeCtx.explorerTemplate} » hors contrat ${chromeCtx.toolkitId}`);
        }
        if (chromeCtx.explorerDragMode
            && toolkitContract.explorerDragMode
            && chromeCtx.explorerDragMode !== toolkitContract.explorerDragMode) {
            warnings.push(`${profileId}: explorerDragMode diverge du contrat ${chromeCtx.toolkitId}`);
        }
    }
}

if (errors.length) {
    console.error(`✗ validate-window-chrome-contexts — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    if (warnings.length) {
        warnings.forEach((w) => console.warn('  ⚠', w));
    }
    process.exit(1);
}

console.log('✓ validate-window-chrome-contexts OK');
if (warnings.length) {
    warnings.forEach((w) => console.warn('  ⚠', w));
}
process.exit(0);
