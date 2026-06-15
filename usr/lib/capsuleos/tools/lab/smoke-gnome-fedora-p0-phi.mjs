#!/usr/bin/env node
/**
 * Smoke Φ P0 Fedora — Nautilus + Calculatrice (fenêtre + recadrage VM).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const res = spawnSync(
  'node',
  ['usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs', '--id', 'linux-fedora', '--filter', 'P0'],
  { cwd: ROOT, encoding: 'utf8' },
);
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(1);
}
const json = JSON.parse(res.stdout);
const byId = Object.fromEntries((json.results || []).map((r) => [r.controlId, r]));
const nemo = byId.nemo?.phiNormalized ?? 0;
const calc = byId.calculator?.phiNormalized ?? 0;
const errors = [];
if (calc < 85) errors.push(`calculator Φ_norm=${calc} < 85`);
if (nemo < 84.5) errors.push(`nemo Φ_norm=${nemo} < 84.5 (cible 85 — recadrage VM)`);
if (errors.length) {
  console.error('smoke-gnome-fedora-p0-phi — échec');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ smoke-gnome-fedora-p0-phi — nemo=${nemo} calculator=${calc}`);
