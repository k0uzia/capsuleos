#!/usr/bin/env node
/**
 * Concatène usr/lib/capsuleos/common/window/*.js → capsule-window.js
 * Usage : node usr/lib/capsuleos/tools/build-capsule-window.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const WINDOW_DIR = path.join(ROOT, 'usr/lib/capsuleos/common/window');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/common/capsule-window.js');

const PARTS = [
    'bounds.js',
    'positioning.js',
    'stack.js',
    'maximize.js',
    'drag.js',
    'resize.js',
    'chrome.js',
    'manager.js',
];

const chunks = PARTS.map((name) => {
    const filePath = path.join(WINDOW_DIR, name);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Module manquant: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf8').trim();
});

const banner = `/**
 * CapsuleOS window kernel (bundle généré).
 * Source : usr/lib/capsuleos/common/window/
 * Regénérer : node usr/lib/capsuleos/tools/build-capsule-window.mjs
 */\n`;

fs.writeFileSync(OUT, `${banner}${chunks.join('\n')}\n`, 'utf8');
console.log(`Écrit ${OUT} (${PARTS.length} modules)`);
