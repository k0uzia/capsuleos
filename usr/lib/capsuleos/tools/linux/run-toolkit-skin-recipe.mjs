#!/usr/bin/env node
/**
 * Recette déterministe skin/toolkit — rien au hasard.
 * Lit etc/capsuleos/contracts/skin-toolkit-recipe.json
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/linux/run-toolkit-skin-recipe.mjs
 *   node usr/lib/capsuleos/tools/linux/run-toolkit-skin-recipe.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/linux/run-toolkit-skin-recipe.mjs --purge-first
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');
const RECIPE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/skin-toolkit-recipe.json');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');

const args = process.argv.slice(2);
const registryFilter = args.includes('--id') ? args[args.indexOf('--id') + 1] : null;
const purgeFirst = args.includes('--purge-first');

function loadRecipe() {
    return JSON.parse(fs.readFileSync(RECIPE_PATH, 'utf8'));
}

function loadProfileToolkit(registryId) {
    const file = path.join(PROFILES_DIR, `${registryId}.json`);
    if (!fs.existsSync(file)) {
        return null;
    }
    const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
    return profile.toolkit?.id || null;
}

function runStep(scriptRel, label) {
    const scriptPath = path.join(ROOT, scriptRel);
    if (!fs.existsSync(scriptPath)) {
        console.error(`✗ Script introuvable : ${scriptRel}`);
        return false;
    }
    console.log(`\n── ${label} ──`);
    console.log(`   ${scriptRel}`);
    const r = spawnSync(process.execPath, [scriptPath], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) {
        console.error(`✗ Échec : ${label}`);
        return false;
    }
    return true;
}

const recipe = loadRecipe();
console.log(`run-toolkit-skin-recipe — ${recipe.phases.length} phase(s)`);
if (registryFilter) {
    console.log(`Filtre registry : ${registryFilter} (toolkit=${loadProfileToolkit(registryFilter) || '?'})`);
}

if (purgeFirst) {
    if (!runStep('usr/lib/capsuleos/tools/purge-repo-hygiene.mjs', 'Purge hygiène')) {
        process.exit(1);
    }
}

let failed = false;
const toolkitId = registryFilter ? loadProfileToolkit(registryFilter) : null;

for (const phase of recipe.phases) {
    if (phase.when?.toolkitId && toolkitId && phase.when.toolkitId !== toolkitId) {
        console.log(`\n── ${phase.id} — ignoré (toolkit ${toolkitId} ≠ ${phase.when.toolkitId})`);
        continue;
    }
    if (!runStep(phase.script, phase.label)) {
        if (phase.required !== false) {
            failed = true;
            break;
        }
    }
}

if (failed) {
    console.error('\n✗ run-toolkit-skin-recipe — échec');
    process.exit(1);
}

console.log('\n✓ run-toolkit-skin-recipe OK — recette skin/toolkit complète');
