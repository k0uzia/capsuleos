#!/usr/bin/env node
/**
 * Gate checkpoints post-clonage (assets référencés par skin).
 * Appelé par validate-all si CAPSULE_VALIDATE_CLONE=1, ou en CI directement.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-clone-checkpoints.mjs
 *   node usr/lib/capsuleos/tools/validate-clone-checkpoints.mjs --tier P0
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

const args = process.argv.slice(2);
const tierIdx = args.indexOf('--tier');
const tier = tierIdx >= 0 ? args[tierIdx + 1] : (process.env.CAPSULE_VALIDATE_CLONE_TIER || 'P0');
const cmd = [path.join(__dirname, 'validate-clone-assets.mjs'), '--all', '--tier', tier];

const r = spawnSync(process.execPath, cmd, { cwd: ROOT, stdio: 'inherit' });
process.exit(r.status === 0 ? 0 : 1);
