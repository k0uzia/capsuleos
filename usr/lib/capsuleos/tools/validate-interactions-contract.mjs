#!/usr/bin/env node
/**
 * Contrat interactions UX — hover/active/focus/drag (CSS + contexte fenêtres).
 * Usage : node usr/lib/capsuleos/tools/validate-interactions-contract.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];

function mustInclude(rel, needles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`${rel}: fichier manquant`);
        return;
    }
    const text = fs.readFileSync(full, 'utf8');
    needles.forEach((n) => {
        if (!text.includes(n)) {
            errors.push(`${rel}: attendu « ${n} »`);
        }
    });
}

const interactions = 'usr/share/capsuleos/themes/global/interactions-window.base.css';
mustInclude(interactions, [
    'cursor: grab',
    'cursor: grabbing',
    ':focus-visible',
    ':active',
]);

mustInclude('usr/share/capsuleos/themes/linux/window-chrome.base.css', [
    'interactions-window.base.css',
]);

mustInclude('usr/lib/capsuleos/shells/common/capsule-window-context.js', [
    'requireHeader: true',
]);

mustInclude('home/Debian/Mint/style/imports.css', ['mint-interactions.css']);
mustInclude('home/Debian/Mint/skin.profile.json', ['"requireHeader": true']);
mustInclude('usr/lib/capsuleos/shells/linux/cinnamon-alt-tab.js', [
    "event.target.closest('.cinnamon-alt-tab__item')",
]);

mustInclude('usr/lib/capsuleos/common/window/chrome.js', [
    "header.setAttribute('data-window-drag-handle', '')",
    "providerId === 'firefox-gnome'",
    "providerId === 'nemo-gnome'",
    'data-window-drag-passthrough',
]);

mustInclude('usr/lib/capsuleos/common/window/drag-targets.js', [
    'data-window-drag-region',
    'isTitlebarPointerTarget',
]);

mustInclude('usr/share/capsuleos/themes/global/window-drag-regions.css', [
    'data-window-drag-region',
    'window-drag-region--header-fill',
]);

const linuxSkins = [
    { home: 'home/Debian/PopOS/style/imports.css', a11y: 'a11y-popos.css' },
    { home: 'home/Debian/AnduinOS/style/imports.css', a11y: 'a11y-anduin.css' },
    { home: 'home/Debian/Ubuntu/style/imports.css', a11y: 'a11y-ubuntu.css' },
    { home: 'home/RedHat/Fedora/style/imports.css', a11y: 'a11y-fedora.css' },
    { home: 'home/Debian/Mint/style/imports.css', a11y: 'a11y-overrides.css' },
];

linuxSkins.forEach((row) => {
    mustInclude(row.home, [row.a11y.indexOf('a11y-') === 0 ? row.a11y : row.a11y]);
});

mustInclude('OS/windows/11/style/imports.css', ['interactions-window.base.css']);
mustInclude('OS/macos/sonoma/style/imports.css', ['interactions-window.base.css']);

if (errors.length) {
    console.error(`✗ validate-interactions-contract — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log('✓ validate-interactions-contract OK');
process.exit(0);
