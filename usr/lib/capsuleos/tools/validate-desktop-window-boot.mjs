#!/usr/bin/env node
/**
 * Chaîne scripts fenêtres (référence macOS Sonoma) — linux, macos, windows, android actifs.
 * Usage : node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const KERNEL = [
    'capsule-window.js',
    'resizeWindow.js',
    'window-drag.js',
];

const SHELL_COMMON = [
    'capsule-window-context.js',
    'capsule-window-shell.js',
    'capsule-desktop-shell.js',
    'capsule-window-header-buttons.js',
];

const FAMILY_SHELL = {
    linux: ['windowContainer.js'],
    macos: ['windowContainer.js'],
    windows: ['windowManager.js'],
    android: ['windowContainer.js'],
};

const errors = [];
const registryPath = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const targets = registry.entries.filter(
    (e) => e.status === 'active' && ['linux', 'macos', 'windows', 'android'].includes(e.family)
);

function checkHtml(label, relPath, family) {
    const full = path.join(ROOT, relPath);
    if (!fs.existsSync(full)) {
        errors.push(`${label}: introuvable (${relPath})`);
        return;
    }
    const html = fs.readFileSync(full, 'utf8');
    KERNEL.forEach((s) => {
        if (!html.includes(s)) {
            errors.push(`${label}: ${s} absent (${relPath})`);
        }
    });
    SHELL_COMMON.forEach((s) => {
        if (!html.includes(s)) {
            errors.push(`${label}: ${s} absent (${relPath})`);
        }
    });
    const familyScripts = FAMILY_SHELL[family] || [];
    familyScripts.forEach((s) => {
        if (!html.includes(s)) {
            errors.push(`${label}: ${s} absent (${relPath})`);
        }
    });
    const idxKernel = html.indexOf('capsule-window.js');
    const idxShell = html.indexOf('capsule-window-shell.js');
    if (idxKernel >= 0 && idxShell >= 0 && idxKernel > idxShell) {
        errors.push(`${label}: capsule-window.js doit précéder capsule-window-shell.js (${relPath})`);
    }
}

targets.forEach((entry) => {
    const pathToCheck = entry.facade || entry.skin;
    if (!pathToCheck) {
        return;
    }
    checkHtml(entry.id, pathToCheck, entry.family);
    if (entry.skin && entry.facade && entry.skin !== entry.facade) {
        checkHtml(`${entry.id} (skin)`, entry.skin, entry.family);
    }
});

if (errors.length) {
    console.error(`✗ validate-desktop-window-boot — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-desktop-window-boot OK — ${targets.length} entrée(s) bureau`);
process.exit(0);
