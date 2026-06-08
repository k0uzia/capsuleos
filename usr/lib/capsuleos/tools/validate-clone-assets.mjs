#!/usr/bin/env node
/**
 * Checkpoints assets clone VM — profil, zones, paradigme toolkit.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint --hash
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const idIdx = process.argv.indexOf('--id');
const registryId = idIdx >= 0 ? process.argv[idIdx + 1] : 'linux-mint';

if (!registryId) {
  console.error('Usage: validate-clone-assets.mjs --id <registryId> [--hash]');
  process.exit(1);
}

const steps = [
  ['validate-asset-zones.mjs', []],
  ['validate-skin-profiles.mjs', []],
  ['validate-toolkit-paradigm.mjs', ['--id', registryId]],
  ['linux/sync-cinnamon-app-icons.mjs', []],
];

let failed = false;

console.log(`CapsuleOS validate-clone-assets — ${registryId}`);

for (const [script, args] of steps) {
  const scriptPath = script.includes('/')
    ? path.join(__dirname, script)
    : path.join(__dirname, script);
  console.log(`\n── ${script} ${args.join(' ')} ──`);
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    failed = true;
    console.error(`✗ échec: ${script}`);
  }
}

if (process.argv.includes('--hash')) {
  console.log('\n── hash optionnel (manifest) — non implémenté, ignoré ──');
}

if (failed) {
  process.exit(1);
}
console.log(`\n✓ validate-clone-assets OK — ${registryId}`);
