#!/usr/bin/env node
/**
 * Effets de bord fenêtres — contexte profil, ancrage object#desktop, scripts Mint.
 * Usage : node usr/lib/capsuleos/tools/validate-window-side-effects.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

function mustInclude(fileRel, needles, label) {
    const full = path.join(ROOT, fileRel);
    if (!fs.existsSync(full)) {
        errors.push(`${label}: fichier introuvable ${fileRel}`);
        return;
    }
    const text = fs.readFileSync(full, 'utf8');
    needles.forEach((n) => {
        if (!text.includes(n)) {
            errors.push(`${label}: attendu « ${n} » dans ${fileRel}`);
        }
    });
}

const profilesPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-skin-profiles.js');
if (fs.existsSync(profilesPath)) {
    const text = fs.readFileSync(profilesPath, 'utf8');
    if (!text.includes('CAPSULE_WINDOW_CONTEXT')) {
        errors.push('capsule-skin-profiles.js: CAPSULE_WINDOW_CONTEXT absent (build-skin-profiles.mjs)');
    }
    if (!text.includes('"subtractFooter": false')) {
        warnings.push('mint/linux: subtractFooter:false non trouvé dans profils générés');
    }
    if (!text.includes('object#desktop')) {
        errors.push('profils: mainSelector/desktopSelector object#desktop manquant');
    }
}

mustInclude('usr/lib/capsuleos/tools/build-capsule-window.mjs', ["'positioning.js'"], 'build-capsule-window');
mustInclude('usr/lib/capsuleos/common/window/drag.js', [
    'CapsuleWindowPositioning.applyViewportPosition',
    '.nemo-app__toolbar',
], 'drag.js');
mustInclude('usr/share/capsuleos/linux/apps/style/nemo.base.css', [
    'div.windowElement[data-link="nemo"]',
    'min-height: var(--z)',
], 'nemo.base.css');
mustInclude('home/Debian/Mint/style/style.css', [
    'object#desktop > .windowElement',
    'position: absolute',
], 'mint style');
mustInclude('home/Debian/Mint/index.html', [
    'cinnamon-window-effects.js',
    'cinnamon-window-behaviors.js',
    'edge-tiling.js',
    'CapsuleUserHome.resolveRelative',
], 'mint index');
mustInclude('usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerHeader.js', [
    "getComputedStyle(menubar).display === 'none'",
], 'fileExplorerHeader');

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'etc/capsuleos/os-registry.json'), 'utf8'));
const linuxP0 = registry.entries.filter((e) => e.status === 'active' && e.family === 'linux' && e.tier === 'P0');
for (const entry of linuxP0) {
    const htmlPath = entry.facade || entry.skin;
    if (!htmlPath) {
        continue;
    }
    const full = path.join(ROOT, htmlPath);
    if (!fs.existsSync(full)) {
        continue;
    }
    const html = fs.readFileSync(full, 'utf8');
    if (html.includes('fromRepoDepth(3)')) {
        errors.push(`${entry.id}: utiliser CapsuleUserHome.resolveRelative() (pas fromRepoDepth(3)) dans ${htmlPath}`);
    }
}

if (errors.length) {
    console.error(`✗ validate-window-side-effects — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    if (warnings.length) {
        warnings.forEach((w) => console.warn('  ⚠', w));
    }
    process.exit(1);
}

console.log('✓ validate-window-side-effects OK');
if (warnings.length) {
    warnings.forEach((w) => console.warn('  ⚠', w));
}
process.exit(0);
