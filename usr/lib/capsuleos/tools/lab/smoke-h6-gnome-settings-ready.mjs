#!/usr/bin/env node
/**
 * Gate pré-H6 — contrat τ (h6Ready) + smokes critiques Paramètres GNOME.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-h6-gnome-settings-ready.mjs --id linux-ubuntu
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { h6Profile, parseRegistryId } from './h6-gnome-settings-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const registry = parseRegistryId();
const profile = h6Profile(registry);

const tailPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-playbook-tail.json`);
if (!fs.existsSync(tailPath)) {
  console.error(`✗ playbook-tail manquant: ${tailPath}`);
  process.exit(1);
}
const tail = JSON.parse(fs.readFileSync(tailPath, 'utf8'));
if (!tail.h6Ready) {
  console.error(`✗ h6Ready=false — nextH5 restants: ${(tail.nextH5 || []).map((n) => n.target).join(', ') || '—'}`);
  process.exit(1);
}

const env = {
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765',
};

const run = (script, extra = []) => {
  const res = spawnSync(process.execPath, [path.join(LAB, script), '--id', registry, ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  if (res.status !== 0) process.exit(res.status || 1);
};

run('verify-gnome-settings-parity-chain.mjs', ['--strict']);
run('smoke-h5-p0-shell.mjs');
if (!profile.skipH5P1) {
  run('smoke-h5-p1-appearance.mjs');
} else {
  process.stdout.write(`○ smoke-h5-p1-appearance ${registry} ignoré (playbook τ P0-only)\n`);
}

const statePath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-h6-ready.json`);
fs.writeFileSync(statePath, `${JSON.stringify({
  registryId: registry,
  h6Ready: true,
  pbSigma: true,
  h5Completed: tail.h5Completed || [],
  skipH5P1: profile.skipH5P1,
  gate: 'smoke-h6-gnome-settings-ready.mjs',
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

process.stdout.write(`✓ smoke-h6-gnome-settings-ready ${registry} OK — ${statePath.replace(`${ROOT}/`, '')}\n`);
