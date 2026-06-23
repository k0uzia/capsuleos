#!/usr/bin/env node
/**
 * @deprecated — utiliser pull-kde-neon-settings-theme-previews.sh (preview.png LnF, pas crop écran).
 * Redirige vers le pull VM pour compatibilité scripts existants.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/extract-kde-neon-settings-theme-previews.mjs --write
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const write = process.argv.includes('--write');

if (!write) {
  console.log('[dry-run] → bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh');
  process.exit(0);
}

const script = path.join(ROOT, 'root/tools/lab/pull-kde-neon-settings-theme-previews.sh');
const res = spawnSync('bash', [script], { cwd: ROOT, stdio: 'inherit', env: process.env });
process.exit(res.status || 0);
