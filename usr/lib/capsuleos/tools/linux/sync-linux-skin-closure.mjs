#!/usr/bin/env node
/**
 * Clôture tâche skin Linux : façades pick-os + embed gabarits.
 * Usage : node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs [linux-mint|all]
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const steps = [
    ['../build-skin-profiles.mjs', 'Profils embed capsule-skin-profiles.js'],
    ['../generate-store-catalog.mjs', 'Catalogue magasin capsule-store-catalog.js'],
    ['build-linux-embed.mjs', 'Embed capsule-app-embed.js'],
    ['build-linux-facades.mjs', 'Façades OS/linux/families → home/']
];

let failed = false;
steps.forEach(([script, label]) => {
    const scriptPath = path.join(__dirname, script);
    console.log(`\n── ${label} (${script}) ──`);
    const result = spawnSync(process.execPath, [scriptPath], {
        cwd: ROOT,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        failed = true;
        console.error(`Échec: ${script}`);
    }
});

if (failed) {
    process.exit(1);
}
console.log('\n✓ sync-linux-skin-closure OK — pick-os et embed alignés sur home/');
