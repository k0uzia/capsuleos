#!/usr/bin/env node
/**
 * Passe v10 — propagation dérivés post-pivot Neon (Π=100).
 *
 *   python3 -m http.server 5500 --bind 127.0.0.1
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-v10-derived-pass.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DERIVED = ['linux-opensuse', 'linux-mx-kde', 'linux-debian-kde'];
const env = {
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
};
const errors = [];

const run = (label, rel, extraArgs = []) => {
  const r = spawnSync('node', [rel, ...extraArgs], { cwd: ROOT, encoding: 'utf8', env });
  if (r.status !== 0) {
    errors.push(`${label} exit ${r.status}`);
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
  }
  return r.status === 0;
};

run('P4 propagation', 'usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs');
run('V6 derived', 'usr/lib/capsuleos/tools/lab/smoke-kde-v6-derived.mjs');
run('Cred sample', 'usr/lib/capsuleos/tools/lab/smoke-kde-derived-cred-sample.mjs');

for (const id of DERIVED) {
  const rel = 'usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs';
  const args = ['--id', id, '--compare'];
  let ok = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const r = spawnSync('node', [rel, ...args], { cwd: ROOT, encoding: 'utf8', env });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    ok = r.status === 0;
    if (ok) break;
  }
  if (!ok) {
    errors.push(`capture-compare ${id} failed after 3 attempts`);
    break;
  }
}

const report = {
  ok: errors.length === 0,
  scope: 'derived-kde-post-pivot',
  derived: DERIVED,
  evaluatedAt: new Date().toISOString(),
  errors,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length) {
  console.error('✗ smoke-kde-v10-derived-pass');
  process.exit(1);
}

console.log('✓ smoke-kde-v10-derived-pass OK');
