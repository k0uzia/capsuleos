#!/usr/bin/env node
/**
 * Lance les validateurs qualité code (JSON + vanilla JS + contrats UI bureau).
 * Usage : node usr/lib/capsuleos/tools/validate-quality-all.mjs
 *
 * Validateur général futur : validate-all.mjs = assets + capsule + quality.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
  'validate-json.mjs',
  'validate-vanilla-js.mjs',
  'validate-ui-contracts-all.mjs',
];

let failed = false;
for (const script of steps) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
