#!/usr/bin/env node
/**
 * Vérifie que les overview.js GNOME résolvent les icônes de recherche via CapsuleResource.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images');

const OVERVIEWS = [
    'home/RedHat/Rocky/js/overview.js',
    'home/RedHat/Fedora/js/overview.js',
    'home/RedHat/Alma/js/overview.js',
    'home/Debian/Ubuntu/js/overview.js',
];

const errors = [];

for (const rel of OVERVIEWS) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
        errors.push(`${rel}: fichier introuvable`);
        continue;
    }
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('resolveSearchIcon')) {
        errors.push(`${rel}: resolveSearchIcon manquant`);
    }
    if (!src.includes('resolveSearchIcon(item.icon)')) {
        errors.push(`${rel}: img.src doit utiliser resolveSearchIcon(item.icon)`);
    }

    const icons = [...src.matchAll(/icon:\s*'(\.\/assets\/[^']+)'/g)].map((m) => m[1]);
    icons.forEach((icon) => {
        const relPath = icon.replace('./assets/images/', '');
        const physical = path.join(ASSETS, relPath);
        if (!fs.existsSync(physical)) {
            errors.push(`${rel}: asset introuvable — ${relPath}`);
        }
    });
}

if (errors.length) {
    console.error(`✗ validate-gnome-overview-search-icons — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-gnome-overview-search-icons OK — ${OVERVIEWS.length} overview(s)`);
