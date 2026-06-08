#!/usr/bin/env node
/**
 * Régénère toutes les vues dérivées CapsuleOS avant commit/push.
 *
 * Périmètre :
 *   - manifest public (home/public → Nemo)
 *   - profils skin + façades pick-os Linux (home/ → OS/linux/families/)
 *   - embed offline Linux (capsule-app-embed.js, capsule-skin-profiles.js)
 *   - embed Android (capsule-android-embed.js)
 *   - validation façades Linux
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/sync-all-views.mjs
 *
 * Voir contrib.md § Embeds offline · convention-manifest-vm.md (push).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');

const steps = [
    { label: 'manifest public', script: 'generate-public-manifest.mjs' },
    { label: 'Linux pick-os + embed', script: path.join('linux', 'sync-linux-skin-closure.mjs') },
    { label: 'embed Android', script: 'build-android-embed.mjs' },
    { label: 'validation façades Linux', script: path.join('linux', 'validate-linux-facades.mjs') },
];

let failed = false;

console.log('CapsuleOS sync-all-views — régénération des vues dérivées\n');

for (const step of steps) {
    const scriptPath = path.join(TOOLS, step.script);
    const rel = path.relative(ROOT, scriptPath);
    console.log(`── ${step.label} (${rel}) ──`);
    const result = spawnSync(process.execPath, [rel], { cwd: ROOT, stdio: 'inherit' });
    if (result.status !== 0) {
        failed = true;
        console.error(`✗ ${step.label} — exit ${result.status}`);
    }
}

if (failed) {
    process.exit(1);
}

console.log('\n✓ sync-all-views OK — façades pick-os et embeds alignés');
