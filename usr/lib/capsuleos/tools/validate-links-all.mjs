#!/usr/bin/env node
/**
 * Gate intégrité liens & médias (statique file:// + registre + CSS + data-link).
 * Usage : node usr/lib/capsuleos/tools/validate-links-all.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
  'validate-static-html-assets.mjs',
  'validate-link-integrity.mjs',
  'validate-css-asset-urls.mjs',
  'audit-asset-paths.mjs',
  'audit-data-links.mjs',
];

let failed = false;
console.log('CapsuleOS validate-links-all');

for (const script of steps) {
  console.log(`\n── ${script} ──`);
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
