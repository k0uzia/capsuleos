#!/usr/bin/env node
/**
 * Smoke clôture campagne v7 — calendrier · captures dérivés · Cred* échantillon · Π ≥ 98.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const env = {
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
};
const errors = [];

const run = (rel, extraArgs = []) => {
  const r = spawnSync('node', [rel, ...extraArgs], { cwd: ROOT, encoding: 'utf8', env });
  if (r.status !== 0) {
    errors.push(`${rel} exit ${r.status}`);
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
  }
};

run('usr/lib/capsuleos/tools/lab/smoke-kde-neon-calendar.mjs');
run('usr/lib/capsuleos/tools/lab/smoke-kde-v6-derived.mjs');
run('usr/lib/capsuleos/tools/lab/smoke-kde-derived-cred-sample.mjs');
run('usr/lib/capsuleos/tools/lab/capture-derived-kde-baselines.mjs', ['--write-baseline']);
run('usr/lib/capsuleos/tools/lab/refresh-kde-neon-parity-v7.mjs', ['--write']);

const parity = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-parity-index.json'), 'utf8'),
);
if ((parity.pi_global ?? 0) < 98) {
  errors.push(`Π_global=${parity.pi_global} < 98`);
}

const baselines = ['linux-opensuse', 'linux-mx-kde', 'linux-debian-kde'];
baselines.forEach((id) => {
  const dir = path.join(ROOT, 'root/docs/inventaires/captures', id, 'baseline');
  if (!fs.existsSync(dir) || !fs.readdirSync(dir).some((f) => f.endsWith('.png'))) {
    errors.push(`${id} : baseline captures absente`);
  }
});

if (errors.length) {
  console.error('✗ smoke-kde-v7-closure');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  pi_global: parity.pi_global,
  derivedBaselines: baselines,
}, null, 2));
console.log('✓ smoke-kde-v7-closure OK');
