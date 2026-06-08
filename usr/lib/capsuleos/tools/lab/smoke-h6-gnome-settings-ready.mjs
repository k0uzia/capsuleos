#!/usr/bin/env node
/**
 * Gate pré-H6 — contrat τ (h6Ready) + smokes critiques Paramètres GNOME Rocky.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-h6-gnome-settings-ready.mjs
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');
const registry = process.argv.includes('--id')
  ? process.argv[process.argv.indexOf('--id') + 1]
  : 'linux-rocky';

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

const scripts = [
  'verify-gnome-settings-parity-chain.mjs',
  'smoke-h5-p0-shell.mjs',
  'smoke-h5-p1-appearance.mjs',
];

const env = {
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765',
};

for (const script of scripts) {
  const extra = script === 'verify-gnome-settings-parity-chain.mjs' ? ['--strict'] : [];
  const res = spawnSync(process.execPath, [path.join(LAB, script), ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

const statePath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-h6-ready.json`);
fs.writeFileSync(statePath, `${JSON.stringify({
  registryId: registry,
  h6Ready: true,
  pbSigma: true,
  h5Completed: tail.h5Completed || [],
  gate: 'smoke-h6-gnome-settings-ready.mjs',
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

process.stdout.write(`✓ smoke-h6-gnome-settings-ready OK — ${statePath}\n`);
