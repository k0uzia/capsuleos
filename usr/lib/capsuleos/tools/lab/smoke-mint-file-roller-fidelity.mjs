#!/usr/bin/env node
/**
 * Smoke App P1 — File Roller (campagne + gate legacy).
 *
 * Usage :
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html \
 *     node usr/lib/capsuleos/tools/lab/smoke-mint-file-roller-fidelity.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const run = (rel, args) => {
  const script = path.join(ROOT, rel);
  const res = spawnSync('node', [script, ...(args || [])], {
    encoding: 'utf8',
    env: process.env,
    cwd: ROOT,
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  return res.status || 0;
};

const campaign = run('usr/lib/capsuleos/tools/lab/run-mint-file-roller-campaign.mjs', ['--write']);
if (campaign !== 0) {
  process.exit(campaign);
}

process.exit(0);
