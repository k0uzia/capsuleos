#!/usr/bin/env node
/**
 * Checkpoints assets clone VM — profil, zones, paradigme toolkit.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --all --tier P0
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint --hash
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCloneTargets } from './clone-checkpoints-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const args = process.argv.slice(2);
const idIdx = args.indexOf('--id');
const tierIdx = args.indexOf('--tier');
const runAll = args.includes('--all');
const tier = tierIdx >= 0 ? args[tierIdx + 1] : null;

const runOne = (registryId) => {
  const steps = [
    ['validate-asset-zones.mjs', []],
    ['validate-skin-profiles.mjs', []],
    ['validate-toolkit-paradigm.mjs', ['--id', registryId]],
    ['linux/sync-cinnamon-app-icons.mjs', []],
    ['validate-skin-icon-paths.mjs', ['--id', registryId]],
  ];

  let failed = false;

  console.log(`CapsuleOS validate-clone-assets — ${registryId}`);

  for (const [script, stepArgs] of steps) {
    const scriptPath = path.join(__dirname, script);
    console.log(`\n── ${script} ${stepArgs.join(' ')} ──`);
    const r = spawnSync(process.execPath, [scriptPath, ...stepArgs], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      failed = true;
      console.error(`✗ échec: ${script}`);
    }
  }

  if (failed) {
    return false;
  }
  console.log(`\n✓ validate-clone-assets OK — ${registryId}`);
  return true;
};

if (runAll) {
  const targets = listCloneTargets(ROOT, { tier });
  if (!targets.length) {
    console.error(`✗ validate-clone-assets --all : aucune cible${tier ? ` (tier ${tier})` : ''}`);
    process.exit(1);
  }
  console.log(`CapsuleOS validate-clone-assets --all — ${targets.length} skin(s)${tier ? `, tier ${tier}` : ''}`);
  let failed = false;
  for (const entry of targets) {
    if (!runOne(entry.id)) {
      failed = true;
    }
  }
  if (failed) {
    process.exit(1);
  }
  console.log('\n✓ validate-clone-assets --all OK');
  process.exit(0);
}

const registryId = idIdx >= 0 ? args[idIdx + 1] : 'linux-mint';

if (!registryId) {
  console.error('Usage: validate-clone-assets.mjs --id <registryId> | --all [--tier P0] [--hash]');
  process.exit(1);
}

if (args.includes('--hash')) {
  console.log('\n── hash optionnel (manifest) — non implémenté, ignoré ──');
}

process.exit(runOne(registryId) ? 0 : 1);
