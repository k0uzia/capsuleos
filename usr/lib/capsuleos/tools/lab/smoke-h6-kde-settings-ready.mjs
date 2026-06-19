#!/usr/bin/env node
/**
 * Smoke H6 KDE — Paramètres prêts (SeΣ + front inventory).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs --id linux-kde-neon
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const errors = [];

const run = (label, script, args = []) => {
  const r = spawnSync('node', [script, ...args], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    errors.push(`${label} — échec`);
    const out = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-3).join(' ');
    if (out) errors.push(`  ${out}`);
  }
};

run('verify-kde-settings', 'usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs', ['--id', registry]);
run('front-inventory', 'usr/lib/capsuleos/tools/lab/smoke-kde-settings-front-inventory.mjs', ['--id', registry]);

if (errors.length) {
  console.error('✗ smoke-h6-kde-settings-ready');
  errors.forEach((e) => console.error(e));
  process.exit(1);
}

console.log(`✓ smoke-h6-kde-settings-ready OK — ${registry}`);
process.exit(0);
