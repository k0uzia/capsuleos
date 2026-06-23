#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Wrapper REUSE 3 — exécute `reuse lint` (pip) depuis la racine du dépôt.
 * Usage : node usr/lib/capsuleos/tools/run-reuse-lint.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const resolveReuseBin = () => {
  const fromPath = spawnSync('sh', ['-c', 'command -v reuse'], { encoding: 'utf8' });
  if (fromPath.status === 0 && fromPath.stdout.trim()) {
    return fromPath.stdout.trim();
  }
  return null;
};

const installReuse = () => {
  const pip = spawnSync('pip', ['install', '--user', 'reuse'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (pip.status !== 0) {
    const pip3 = spawnSync('pip3', ['install', '--user', 'reuse'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return pip3.status === 0;
  }
  return true;
};

let reuseBin = resolveReuseBin();
if (!reuseBin && process.env.CAPSULE_REUSE_SKIP_INSTALL !== '1') {
  process.stderr.write('○ reuse absent — tentative pip install reuse\n');
  if (installReuse()) {
    reuseBin = resolveReuseBin();
  }
}

if (!reuseBin) {
  console.error('  ✗ reuse lint : binaire `reuse` introuvable (pip install reuse)');
  process.exit(1);
}

const result = spawnSync(reuseBin, ['lint'], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: 'pipe',
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  console.error('  ✗ reuse lint — échec');
  process.exit(result.status ?? 1);
}

console.log('✓ run-reuse-lint OK — REUSE 3 conforme');
