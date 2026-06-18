#!/usr/bin/env node
/**
 * Gate P13 — interdit le tiret cadratin (U+2014) dans les textes portail / parcours.
 * Usage : node usr/lib/capsuleos/tools/validate-no-em-dash.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const EM_DASH = '\u2014';

const TARGETS = [
    'parcours-pedagogique.md',
    'index.html',
    'etc/capsuleos/contracts/portal-offers.json',
    'etc/capsuleos/contracts/portal-legal.json',
];

const walk = (dir, out = []) => {
    if (!fs.existsSync(dir)) {
        return out;
    }
    for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const st = fs.statSync(abs);
        if (st.isDirectory()) {
            walk(abs, out);
        } else if (/\.(php|html|json|md)$/i.test(name)) {
            out.push(abs);
        }
    }
    return out;
};

const portalViews = walk(path.join(ROOT, 'usr/share/capsuleos/portal'));

const files = [...new Set([
    ...TARGETS.map((rel) => path.join(ROOT, rel)),
    ...portalViews,
])].filter((p) => fs.existsSync(p));

const errors = [];

for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
        if (!line.includes(EM_DASH)) {
            return;
        }
        const rel = path.relative(ROOT, file).split(path.sep).join('/');
        errors.push(`${rel}:${idx + 1}: tiret cadratin interdit (P13)`);
    });
}

if (errors.length) {
    console.error('validate-no-em-dash — ÉCHEC');
    errors.forEach((e) => console.error('  ✗', e));
    process.exit(1);
}

console.log(`✓ validate-no-em-dash OK (${files.length} fichiers)`);
