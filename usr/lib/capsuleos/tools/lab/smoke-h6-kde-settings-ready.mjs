#!/usr/bin/env node
/**
 * Gate pré-H6 — pilote KDE (Paramètres + ground truth + apps P0).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs --id linux-kde-neon
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const parseRegistryId = () => {
  const idx = process.argv.indexOf('--id');
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'linux-kde-neon';
};

const registry = parseRegistryId();

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

run('verify-kde-settings-parity-chain.mjs', ['--strict']);
run('map-kde-ground-truth-gaps.mjs', ['--write']);
run('smoke-apps-snapshot.mjs');

const statePath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-h6-ready.json`);
fs.writeFileSync(statePath, `${JSON.stringify({
  registryId: registry,
  toolkit: 'kde',
  h6Ready: true,
  pbSigma: true,
  h5Completed: tail.h5Completed || [],
  gate: 'smoke-h6-kde-settings-ready.mjs',
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

process.stdout.write(`✓ smoke-h6-kde-settings-ready ${registry} OK — ${statePath.replace(`${ROOT}/`, '')}\n`);
