#!/usr/bin/env node
/**
 * Orchestrateur contrats UI (fenêtres, sélecteurs, variables CSS, interactivité JS).
 * Usage : node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
    'validate-window-side-effects.mjs',
    'validate-window-chrome-contexts.mjs',
    'validate-css-selectors-contract.mjs',
    'validate-css-variables-contract.mjs',
    'validate-vanilla-interactivity.mjs',
    'validate-interactions-contract.mjs',
];

let failed = false;
console.log('CapsuleOS validate-ui-contracts —', steps.length, 'validateurs');

for (const script of steps) {
    console.log(`\n── ${script} ──`);
    const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
        cwd: ROOT,
        stdio: 'inherit',
    });
    if (r.status !== 0) {
        failed = true;
    }
}

process.exit(failed ? 1 : 0);
