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
const registryPath = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const cinnamonActive = registry.entries.filter(
    (e) => e.status === 'active' && (e.toolkit === 'cinnamon' || e.toolkit?.id === 'cinnamon'),
);
const isFrozen = registry.stats?.frozen === true || registry.entries.every((e) => e.status !== 'active');
if (fs.existsSync(profilesPath)) {
    const text = fs.readFileSync(profilesPath, 'utf8');
    if (cinnamonActive.length > 0 && !text.includes('CAPSULE_WINDOW_CONTEXT')) {
        errors.push('capsule-skin-profiles.js: CAPSULE_WINDOW_CONTEXT absent (skin Cinnamon actif)');
    } else if (cinnamonActive.length === 0 && !text.includes('CAPSULE_WINDOW_CONTEXT')) {
        warnings.push('linux-mint absent: CAPSULE_WINDOW_CONTEXT sera requis après recréation clone');
    }
    if (cinnamonActive.length > 0 && !text.includes('"subtractFooter": false')) {
        warnings.push('mint/linux: subtractFooter:false non trouvé dans profils générés');
    }
}
let desktopAnchorFound = false;
const linuxEntries = isFrozen
    ? registry.entries.filter((e) => e.family === 'linux' && e.referencePaths)
    : registry.entries.filter((e) => e.status === 'active' && e.family === 'linux');
linuxEntries.forEach((entry) => {
    const rel = entry.referencePaths?.skin || entry.referencePaths?.facade || entry.skin || entry.facade;
    if (!rel) return;
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return;
    const html = fs.readFileSync(full, 'utf8');
    if (html.includes('id="desktop"') || html.includes("id='desktop'")
        || html.includes('id=desktop')) {
        desktopAnchorFound = true;
    }
});
if (!desktopAnchorFound && !isFrozen) {
    errors.push('aucun skin Linux actif avec object#desktop / id="desktop"');
} else if (!desktopAnchorFound && isFrozen) {
    warnings.push('gel catalogue : desktop anchor vérifié via referencePaths au réactivation');
}

mustInclude('usr/lib/capsuleos/tools/build-capsule-window.mjs', ["'positioning.js'"], 'build-capsule-window');
mustInclude('usr/lib/capsuleos/common/window/bounds.js', [
    'resolveBoundsOptions',
    'CAPSULE_WINDOW_CONTEXT',
], 'bounds.js');
mustInclude('usr/lib/capsuleos/common/window/maximize.js', [
    'resolveBoundsOptions',
    'applyViewportBox',
], 'maximize.js');
mustInclude('usr/lib/capsuleos/common/window/drag.js', [
    'CapsuleWindowPositioning.applyViewportPosition',
    'CapsuleWindowDragTargets',
], 'drag.js');
mustInclude('usr/lib/capsuleos/common/window/drag-targets.js', [
    '.nemo-app__toolbar',
    'BLOCKED_APP_SELECTOR',
], 'drag-targets.js');
mustInclude('usr/share/capsuleos/linux/apps/style/nemo.base.css', [
    'div.windowElement[data-link="nemo"]',
    'min-height: var(--z)',
], 'nemo.base.css');
mustInclude('home/Debian/Mint/style/style.css', [
    '#desktop > .windowElement',
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
