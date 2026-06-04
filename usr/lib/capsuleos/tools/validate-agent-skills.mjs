#!/usr/bin/env node
/**
 * Vérifie que chaque entrée active du registre a ses skills vendor + distribution.
 * Usage : node usr/lib/capsuleos/tools/validate-agent-skills.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const SKILLS = path.join(ROOT, 'root/skills');

const errors = [];

function skillPath(...parts) {
    return path.join(SKILLS, ...parts, 'SKILL.md');
}

function exists(...parts) {
    return fs.existsSync(skillPath(...parts));
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const active = registry.entries.filter((e) => e.status === 'active');

for (const entry of active) {
    const vendor = entry.vendor || 'unknown';
    if (!exists('vendors', vendor)) {
        errors.push(`${entry.id}: skill vendor manquant vendors/${vendor}/`);
    }
    if (!exists('distributions', entry.id)) {
        errors.push(`${entry.id}: skill distribution manquant distributions/${entry.id}/`);
    }
}

const LANGS = ['javascript', 'json', 'css', 'html', 'markdown', 'node-mjs'];
for (const lang of LANGS) {
    if (!exists('languages', lang)) {
        errors.push(`langage: languages/${lang}/ manquant`);
    }
}

if (!exists('_index')) {
    errors.push('index: root/skills/_index/ manquant — seed-agent-skills.mjs --write');
}

if (errors.length) {
    console.error(`✗ validate-agent-skills — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    console.error('\nCorriger : node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write');
    process.exit(1);
}

console.log(`✓ validate-agent-skills OK — ${active.length} entrées actives, ${LANGS.length} langages`);
process.exit(0);
