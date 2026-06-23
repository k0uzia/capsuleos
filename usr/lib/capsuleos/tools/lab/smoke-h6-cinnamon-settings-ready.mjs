#!/usr/bin/env node
/**
 * Gate pré-H6 Cinnamon — contrat τ (h6Ready) + chaîne Paramètres CS + smoke Playwright.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-h6-cinnamon-settings-ready.mjs --id linux-mint
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-mint').trim();

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

const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';
const env = {
  ...process.env,
  CAPSULE_HTTP_BASE: httpBase,
  CAPSULE_MINT_URL: process.env.CAPSULE_MINT_URL || `${httpBase}/home/Debian/Mint/index.html`,
};

const run = (script, extra = []) => {
  const res = spawnSync(process.execPath, [path.join(LAB, script), '--id', registry, ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  if (res.status !== 0) process.exit(res.status || 1);
};

run('verify-cinnamon-settings-parity-chain.mjs');
run('smoke-mint-cinnamon-settings.mjs');

const statePath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-h6-ready.json`);
fs.writeFileSync(statePath, `${JSON.stringify({
  registryId: registry,
  domain: 'cinnamon-settings-playbook',
  h6Ready: true,
  pbSigma: true,
  seSigma: true,
  h5Completed: tail.h5Completed || [],
  gate: 'smoke-h6-cinnamon-settings-ready.mjs',
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

process.stdout.write(`✓ smoke-h6-cinnamon-settings-ready ${registry} OK — ${statePath.replace(`${ROOT}/`, '')}\n`);
