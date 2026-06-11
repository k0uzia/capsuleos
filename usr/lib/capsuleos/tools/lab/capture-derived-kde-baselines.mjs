#!/usr/bin/env node
/**
 * Baselines captures Capsule — skins KDE dérivés (post v6 Discover).
 *
 *   python3 -m http.server 5500 --bind 127.0.0.1
 *   node usr/lib/capsuleos/tools/lab/capture-derived-kde-baselines.mjs [--write-baseline]
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DERIVED = ['linux-opensuse', 'linux-mx-kde', 'linux-debian-kde'];
const writeBaseline = process.argv.includes('--write-baseline');
const errors = [];

for (const id of DERIVED) {
  const args = ['usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs', '--id', id];
  if (writeBaseline) args.push('--write-baseline');

  const r = spawnSync('node', args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500' },
  });

  if (r.status !== 0) {
    errors.push(`${id} : capture échouée`);
    if (r.stderr) process.stderr.write(r.stderr);
  } else {
    console.log(`✓ captures ${id}`);
  }
}

if (errors.length) {
  console.error('✗ capture-derived-kde-baselines');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('✓ capture-derived-kde-baselines OK');
