#!/usr/bin/env node
/**
 * Gate release CapsuleOS — assets + liens/médias + registre + qualité code.
 * Usage : node usr/lib/capsuleos/tools/validate-all.mjs
 *
 * Voir root/docs/parcours-agent.md (phase H2 / clôture H6).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
  { label: 'assets', script: 'validate-assets-all.mjs' },
  { label: 'links', script: 'validate-links-all.mjs' },
  { label: 'portal', script: 'validate-portal-contracts.mjs' },
  { label: 'capsule', script: 'validate-capsule.mjs' },
  { label: 'quality', script: 'validate-quality-all.mjs' },
];

if (process.env.CAPSULE_VALIDATE_CLONE === '1') {
  steps.push({ label: 'clone-checkpoints', script: 'validate-clone-checkpoints.mjs' });
}

let failed = false;

console.log('CapsuleOS validate-all —', steps.map((s) => s.label).join(' + '));

for (const { label, script } of steps) {
  console.log(`\n── ${label} (${script}) ──`);
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    failed = true;
    console.error(`✗ validate-all : échec sur ${script}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log('\n✓ validate-all OK — assets + capsule + quality');
