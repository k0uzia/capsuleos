#!/usr/bin/env node
/**
 * Contrat IDs sélecteurs bureau / Nemo / chrome ↔ HTML ↔ JS.
 * Usage : node usr/lib/capsuleos/tools/validate-css-selectors-contract.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    readJson,
    extractHtmlIds,
    extractJsSelectorLiterals,
} from './lib/ui-contract-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const contract = readJson(ROOT, 'etc/capsuleos/contracts/desktop-selectors.json');
const errors = [];

const htmlIds = new Set();
for (const rel of contract.htmlSources) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`HTML source introuvable: ${rel}`);
        continue;
    }
    extractHtmlIds(fs.readFileSync(full, 'utf8')).forEach((id) => htmlIds.add(id));
}

contract.ids.nemoShell.forEach((id) => {
    if (!htmlIds.has(id)) {
        errors.push(`Contrat Nemo « ${id} » absent des gabarits (${contract.htmlSources.join(', ')})`);
    }
});

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'etc/capsuleos/os-registry.json'), 'utf8'));
const linuxP0 = registry.entries.filter((e) => e.status === 'active' && e.family === 'linux' && e.tier === 'P0');
for (const entry of linuxP0) {
    for (const rel of [entry.skin, entry.facade].filter(Boolean)) {
        const full = path.join(ROOT, rel);
        if (!fs.existsSync(full)) {
            continue;
        }
        extractHtmlIds(fs.readFileSync(full, 'utf8')).forEach((id) => htmlIds.add(id));
    }
}

if (!htmlIds.has('nemo')) {
    errors.push('ID slot « nemo » absent des index Linux P0 (skin/façade)');
}

const jsIds = new Set();
for (const relDir of contract.jsScanDirs) {
    const dir = path.join(ROOT, relDir);
    if (!fs.existsSync(dir)) {
        continue;
    }
    const stack = [dir];
    while (stack.length) {
        const current = stack.pop();
        for (const name of fs.readdirSync(current)) {
            const full = path.join(current, name);
            const st = fs.statSync(full);
            if (st.isDirectory()) {
                stack.push(full);
            } else if (name.endsWith('.js')) {
                const { ids } = extractJsSelectorLiterals(fs.readFileSync(full, 'utf8'));
                ids.forEach((id) => jsIds.add(id));
            }
        }
    }
}

contract.ids.windowChrome.forEach((id) => {
    if (!jsIds.has(id)) {
        errors.push(`Chrome WM: #${id} non référencé en JS (${contract.jsScanDirs.join(', ')})`);
    }
});

const criticalJsIds = [
    'gestionnaire',
    'voletContainer',
    'precedent',
    'suivant',
];

criticalJsIds.forEach((id) => {
    if (!jsIds.has(id)) {
        errors.push(`JS explorateur: aucune référence #${id} dans ${contract.jsScanDirs.join(', ')}`);
    }
});

const explorerSlotMarkers = ['getExplorerWindowSlot', 'EXPLORER_WINDOW_SLOT_SELECTOR'];
let hasExplorerSlotJs = false;
for (const relDir of contract.jsScanDirs) {
    const dir = path.join(ROOT, relDir);
    if (!fs.existsSync(dir)) {
        continue;
    }
    const stack = [dir];
    while (stack.length) {
        const current = stack.pop();
        for (const name of fs.readdirSync(current)) {
            const full = path.join(current, name);
            const st = fs.statSync(full);
            if (st.isDirectory()) {
                stack.push(full);
            } else if (name.endsWith('.js')) {
                const text = fs.readFileSync(full, 'utf8');
                if (explorerSlotMarkers.some((marker) => text.includes(marker))) {
                    hasExplorerSlotJs = true;
                }
            }
        }
    }
}
if (!hasExplorerSlotJs) {
    errors.push(`JS explorateur: ${explorerSlotMarkers.join(' / ')} absent dans ${contract.jsScanDirs.join(', ')}`);
}

if (errors.length) {
    console.error(`✗ validate-css-selectors-contract — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(
    `✓ validate-css-selectors-contract OK — ${contract.ids.nemoShell.length} IDs Nemo HTML, ${jsIds.size} IDs JS`,
);
process.exit(0);
