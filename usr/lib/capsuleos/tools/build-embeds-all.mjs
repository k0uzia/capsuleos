#!/usr/bin/env node
/**
 * Regénère tous les embeds offline CapsuleOS (sans npm).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/build-embeds-all.mjs
 *   node usr/lib/capsuleos/tools/build-embeds-all.mjs --linux-only
 *   node usr/lib/capsuleos/tools/build-embeds-all.mjs --android-only
 *
 * Enchaîne :
 *   1. generate-public-manifest.mjs (home/public → manifest Nemo)
 *   2. linux/build-linux-embed.mjs → var/lib/capsuleos/generated/capsule-app-embed.js
 *   3. build-android-embed.mjs → OS/android/js/capsule-android-embed.js
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');

const args = new Set(process.argv.slice(2));
const linuxOnly = args.has('--linux-only');
const androidOnly = args.has('--android-only');

const steps = [];

if (!androidOnly) {
    steps.push(
        { label: 'manifest public', script: 'generate-public-manifest.mjs' },
        { label: 'embed Linux', script: path.join('linux', 'build-linux-embed.mjs') },
    );
}
if (!linuxOnly) {
    steps.push({ label: 'embed Android', script: 'build-android-embed.mjs' });
}

let failed = false;

for (const step of steps) {
    const scriptPath = path.join(TOOLS, step.script);
    if (!fs.existsSync(scriptPath)) {
        console.error(`✗ ${step.label}: script introuvable (${step.script})`);
        failed = true;
        continue;
    }
    console.log(`── ${step.label} (${step.script}) ──`);
    const rel = path.relative(ROOT, scriptPath);
    const result = spawnSync(process.execPath, [rel], { cwd: ROOT, stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`✗ ${step.label} — exit ${result.status}`);
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

console.log('\n✓ build-embeds-all OK');
process.exit(0);
