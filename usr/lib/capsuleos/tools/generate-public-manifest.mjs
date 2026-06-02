#!/usr/bin/env node
/**
 * Génère home/public/.capsule-manifest.json et .capsule-finder-manifest.json
 * à partir du contenu présent sous home/public/.
 *
 * Usage : node usr/lib/capsuleos/tools/generate-public-manifest.mjs
 * Option : --prefix=../../../home/public  (défaut : chemins skins Linux depth 3)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'home/public');

const SKIP = new Set([
    '.capsule-manifest.json',
    '.capsule-finder-manifest.json',
    '.gitkeep',
    'README.md'
]);

function parseArgs() {
    const prefixArg = process.argv.find((a) => a.startsWith('--prefix='));
    const prefix = prefixArg
        ? prefixArg.slice('--prefix='.length).replace(/\/+$/, '')
        : '../../../home/public';
    return prefix.replace(/\/+$/, '');
}

function listEntries(absDir) {
    if (!fs.existsSync(absDir)) {
        return [];
    }
    return fs.readdirSync(absDir, { withFileTypes: true })
        .filter((e) => !SKIP.has(e.name) && !e.name.startsWith('.'))
        .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
}

function getExtension(name) {
    const i = name.lastIndexOf('.');
    if (i <= 0) {
        return '';
    }
    return name.slice(i + 1).toLowerCase();
}

function scanFolder(absDir, relPath, folders) {
    const entries = listEntries(absDir);
    const items = [];

    for (const entry of entries) {
        const childAbs = path.join(absDir, entry.name);
        const childRel = `${relPath}/${entry.name}`;

        if (entry.isDirectory) {
            items.push({
                type: 'folder',
                name: entry.name,
                path: childRel
            });
            if (!folders[childRel]) {
                scanFolder(childAbs, childRel, folders);
            }
        } else {
            items.push({
                type: 'file',
                name: entry.name,
                extension: getExtension(entry.name),
                href: childRel
            });
        }
    }

    items.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });

    folders[relPath] = {
        label: path.basename(relPath) || 'Dossier personnel',
        items
    };
}

function buildManifest(relRoot) {
    if (!fs.existsSync(PUBLIC_DIR)) {
        throw new Error(`Répertoire absent : ${PUBLIC_DIR}`);
    }

    const folders = {};
    scanFolder(PUBLIC_DIR, relRoot, folders);

    if (!folders[relRoot]) {
        folders[relRoot] = { label: 'Dossier personnel', items: [] };
    } else {
        folders[relRoot].label = 'Dossier personnel';
    }

    return {
        root: relRoot,
        rootLabel: 'Dossier personnel',
        folders
    };
}

function main() {
    const relRoot = parseArgs();
    const manifest = buildManifest(relRoot);
    const linuxPath = path.join(PUBLIC_DIR, '.capsule-manifest.json');
    const finderPath = path.join(PUBLIC_DIR, '.capsule-finder-manifest.json');

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(linuxPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    fs.writeFileSync(finderPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    const folderCount = Object.keys(manifest.folders).length;
    console.log(`Écrit ${linuxPath} (${folderCount} dossiers, root=${relRoot})`);
    console.log(`Écrit ${finderPath}`);
}

main();
