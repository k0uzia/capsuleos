#!/usr/bin/env node
/**
 * Clôture LabShell COSMIC — revalide Shell₁/Shell₂ sans smokes GNOME Rocky.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-cosmic-lab-shell.mjs --id linux-popos
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-popos' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const run = (script, extra = []) => {
  const res = spawnSync(process.execPath, [path.join(LAB, script), '--id', opts.id, ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500' },
  });
  if (res.status !== 0) process.exit(res.status || 1);
};

const opts = parseArgs();
const shell1 = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-shell-polish.json`);
const shell2 = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-shell-polish-phase2.json`);

run('smoke-cosmic-shell-polish.mjs');
run('smoke-cosmic-shell-polish-phase2.mjs');

const s1 = JSON.parse(fs.readFileSync(shell1, 'utf8'));
const s2 = JSON.parse(fs.readFileSync(shell2, 'utf8'));
if (s1.status !== 'done' || s2.status !== 'done') {
  console.error('✗ LabShell COSMIC : Shell₁/Shell₂ non clos');
  process.exit(1);
}

console.log(`✓ smoke-cosmic-lab-shell OK — ${opts.id}`);
