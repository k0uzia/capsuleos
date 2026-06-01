#!/usr/bin/env node
/**
 * Détecte les url() CSS invalides (guillemets échappés type JS : \").
 * Usage : node js/verify-css-urls.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_ROOTS = [
    path.join(ROOT, 'OS'),
    path.join(ROOT, 'modules'),
    path.join(ROOT, 'style')
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'visuel']);

const PATTERNS = [
    { re: /url\s*\(\s*\\["']/g, label: 'url() avec guillemet échappé (\\" ou \\\')' },
    { re: /url\s*\(\s*["'][^"')]*\\["']/g, label: 'guillemet échappé à l’intérieur de url()' },
    { re: /-(?:webkit-)?mask-image\s*:[^;]*\\["']/g, label: 'mask-image avec \\"' }
];

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) {
        return out;
    }
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) {
            continue;
        }
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            walk(full, out);
        } else if (/\.css$/i.test(name)) {
            out.push(full);
        }
    }
    return out;
}

const issues = [];

for (const root of SCAN_ROOTS) {
    for (const file of walk(root)) {
        const text = fs.readFileSync(file, 'utf8');
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                return;
            }
            PATTERNS.forEach(({ re, label }) => {
                re.lastIndex = 0;
                if (re.test(line)) {
                    issues.push(`${path.relative(ROOT, file)}:${index + 1} — ${label}`);
                }
            });
        });
    }
}

if (issues.length) {
    console.error('CSS url() suspects :\n' + [...new Set(issues)].join('\n'));
    process.exit(1);
}

console.log(`verify-css-urls: OK (${walk(SCAN_ROOTS[0]).length}+ fichiers .css sans guillemets échappés dans url())`);
