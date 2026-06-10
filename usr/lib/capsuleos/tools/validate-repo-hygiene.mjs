#!/usr/bin/env node
/**
 * Hygiène dépôt — legacy, doublons, profils désynchronisés.
 * Usage : node usr/lib/capsuleos/tools/validate-repo-hygiene.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { ROOT, loadAppsCatalog, buildExpectedTemplateOverrides } from './linux/slot-variant-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const APPS_VISUAL = path.join(ROOT, 'root/docs/inventaires/captures/linux-rocky/apps-visual');

const LEGACY_PATHS = [
    'usr/lib/capsuleos/tools/build-capsule-embed.mjs',
    'OS/linux/kernel/js/capsule-app-embed.js',
    'root/docs/toolkit-cloisonnement-audit.md',
    'OS/linux/shared/apps',
    'OS/linux/shared/content',
];

const errors = [];
const warnings = [];

for (const rel of LEGACY_PATHS) {
    if (fs.existsSync(path.join(ROOT, rel))) {
        errors.push(`Fichier legacy à purger : ${rel}`);
    }
}

const catalog = loadAppsCatalog(ROOT);
for (const file of fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'))) {
    const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
    if (profile.status !== 'active') {
        continue;
    }
    const profileId = profile.id || file.replace('.json', '');
    const skinRel = profile.paths?.skin;
    if (!skinRel) {
        continue;
    }
    const mirror = path.join(ROOT, skinRel.replace(/index\.html$/, 'skin.profile.json'));
    if (!fs.existsSync(mirror)) {
        warnings.push(`${profileId}: skin.profile.json miroir absent`);
        continue;
    }
    const expected = buildExpectedTemplateOverrides(catalog, profile);
    const mirrorJson = JSON.parse(fs.readFileSync(mirror, 'utf8'));
    const mirrorOverrides = mirrorJson.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES || {};
    for (const [slotId, templatePath] of Object.entries(expected)) {
        if (mirrorOverrides[slotId] !== templatePath) {
            errors.push(`${profileId}: skin.profile.json désynchronisé — ${slotId}`);
        }
    }
}

function md5File(filePath) {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(buf).digest('hex');
}

if (fs.existsSync(APPS_VISUAL)) {
    const emptyTree = path.join(APPS_VISUAL, 'capsuleos-apps-visual');
    if (fs.existsSync(emptyTree)) {
        const files = [];
        const walk = (dir) => {
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, ent.name);
                if (ent.isDirectory()) {
                    walk(p);
                } else {
                    files.push(p);
                }
            }
        };
        walk(emptyTree);
        if (files.length === 0) {
            errors.push('Arborescence vide parasite : apps-visual/capsuleos-apps-visual/');
        }
    }

    for (const ent of fs.readdirSync(APPS_VISUAL, { withFileTypes: true })) {
        if (!ent.isDirectory() || ent.name === 'capsuleos-apps-visual') {
            continue;
        }
        const appId = ent.name;
        const defaultVm = path.join(APPS_VISUAL, `${appId}-vm.png`);
        if (!fs.existsSync(defaultVm)) {
            continue;
        }
        const defaultHash = md5File(defaultVm);
        const subDir = path.join(APPS_VISUAL, appId);
        for (const shot of fs.readdirSync(subDir).filter((n) => n.endsWith('.png'))) {
            const shotPath = path.join(subDir, shot);
            if (md5File(shotPath) === defaultHash) {
                warnings.push(`Capture dupliquée (virsh bureau) : ${path.relative(ROOT, shotPath)}`);
            }
        }
    }
}

if (warnings.length) {
    console.warn(`validate-repo-hygiene — ${warnings.length} avertissement(s)`);
    warnings.forEach((w) => console.warn('  ⚠', w));
}

if (errors.length) {
    console.error(`✗ validate-repo-hygiene — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    console.error('\nPurge : node usr/lib/capsuleos/tools/purge-repo-hygiene.mjs');
    process.exit(1);
}

console.log('✓ validate-repo-hygiene OK');
