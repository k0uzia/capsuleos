#!/usr/bin/env node
/**
 * Lance tous les validateurs assets (zones, profils, audit chemins).
 * Usage : node usr/lib/capsuleos/tools/validate-assets-all.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
  'validate-asset-zones.mjs',
  'validate-skin-profiles.mjs',
  'audit-asset-paths.mjs',
  'validate-css-asset-urls.mjs',
  'validate-vendor-image-extensions.mjs',
  'validate-link-integrity.mjs',
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
