#!/usr/bin/env node
/**
 * Variables CSS fenêtres / explorateur : var(--*) définie dans la chaîne thème ou le même arbre scan.
 * Usage : node usr/lib/capsuleos/tools/validate-css-variables-contract.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    readJson,
    collectByGlobs,
    extractCssVarDefinitions,
    extractCssVarUses,
} from './lib/ui-contract-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const contract = readJson(ROOT, 'etc/capsuleos/contracts/css-variable-sources.json');
const defined = new Set(Object.keys(contract.aliases || {}));
const errors = [];
const warnings = [];

for (const rel of contract.definitionFiles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`Définitions CSS introuvables: ${rel}`);
        continue;
    }
    extractCssVarDefinitions(fs.readFileSync(full, 'utf8')).forEach((v) => defined.add(v));
}

const files = collectByGlobs(ROOT, contract.scanGlobs);
for (const file of files) {
    extractCssVarDefinitions(fs.readFileSync(file, 'utf8')).forEach((v) => defined.add(v));
}

const used = new Map();
for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    extractCssVarUses(text).forEach((name) => {
        if (!used.has(name)) {
            used.set(name, []);
        }
        used.get(name).push(path.relative(ROOT, file));
    });
}

for (const [name, refs] of used) {
    if (!defined.has(name)) {
        const sample = refs.slice(0, 3).join(', ');
        errors.push(`var(${name}) non définie — ex. ${sample}`);
    }
}

const winVars = [...used.keys()].filter((k) => k.startsWith('--win-'));
winVars.forEach((v) => {
    if (!defined.has(v)) {
        warnings.push(`${v} utilisée mais absente des fichiers définition (peut être skin inline)`);
    }
});

if (errors.length) {
    console.error(`✗ validate-css-variables-contract — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    if (warnings.length) {
        warnings.forEach((w) => console.warn('  ⚠', w));
    }
    process.exit(1);
}

console.log(
    `✓ validate-css-variables-contract OK — ${defined.size} variables, ${used.size} utilisées (${files.length} fichiers)`,
);
if (warnings.length) {
    warnings.forEach((w) => console.warn('  ⚠', w));
}
process.exit(0);
