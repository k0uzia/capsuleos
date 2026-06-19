#!/usr/bin/env node
/**
 * Campagne Φ P0 Fedora — Nautilus + Calculatrice (fenêtre + recadrage VM).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-fedora-p0-phi-pass.mjs
 *   ... --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { closeRealSigmaSlot } from './content-gaps-lib.mjs';
import { vendorPrefix } from './apps-parity-capture-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY_ID = 'linux-fedora';
const SLOTS = ['nemo', 'calculator'];
const PHI_OK = 85;

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write') };
};

const run = (cmd, cmdArgs) => {
  const res = spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${cmdArgs.join(' ')} → exit ${res.status}`);
  }
};

const updateCapsuleCaptures = (prefix) => {
  const paths = appsPathsForRegistry(REGISTRY_ID);
  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  const capDir = `root/docs/inventaires/captures/${REGISTRY_ID}/apps-visual-capsule`;
  for (const slot of SLOTS) {
    const item = inv.investigations.find((i) => i.controlId === slot);
    if (!item) continue;
    const app = slot === 'nemo' ? 'nautilus' : 'calculator';
    item.capsuleCaptures = [
      {
        path: `${capDir}/${prefix}-capsule-dark-${app}-window.png`,
        shot: 'window',
      },
      {
        path: `${capDir}/${prefix}-capsule-dark-${app}.png`,
        shot: 'default',
      },
    ];
    item.vmCaptures = [{
      path: `usr/share/capsuleos/assets/images/vendors/fedora/inventory/fedora-vm/fedora-dark-${app}.png`,
      shot: 'vendor',
    }];
  }
  inv.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
};

const main = () => {
  const opts = parseArgs();
  const prefix = vendorPrefix(REGISTRY_ID);
  const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';

  process.stdout.write(`=== run-fedora-p0-phi-pass (${REGISTRY_ID}) ===\n`);
  run('node', [
    'usr/lib/capsuleos/tools/lab/capture-capsule-nautilus-views.mjs',
    '--id', REGISTRY_ID,
  ]);
  run('node', [
    'usr/lib/capsuleos/tools/lab/capture-capsule-calculator-views.mjs',
    '--id', REGISTRY_ID,
  ]);

  updateCapsuleCaptures(prefix);

  const compare = spawnSync(
    'node',
    ['usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs', '--id', REGISTRY_ID, '--filter', 'P0', '--write'],
    { cwd: ROOT, encoding: 'utf8' },
  );
  if (compare.status !== 0) {
    process.stderr.write(compare.stderr || '');
    throw new Error('compare-apps-visual-investigation échec');
  }
  const compareJson = JSON.parse(compare.stdout);
  const results = {};
  for (const row of compareJson.results || []) {
    if (SLOTS.includes(row.controlId)) {
      results[row.controlId] = row;
    }
  }

  const closed = [];
  if (opts.write) {
    for (const slot of SLOTS) {
      const row = results[slot];
      if (!row || row.visualMatch !== 'ok') continue;
      const out = closeRealSigmaSlot(REGISTRY_ID, slot, {
        visualMatch: 'ok',
        note: `Φ_norm=${row.phiNormalized} ≥ ${PHI_OK} — fenêtre Capsule + recadrage VM vendor (${new Date().toISOString().slice(0, 10)})`,
      });
      if (out.ok) closed.push(slot);
    }
    run('node', ['usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs', '--id', REGISTRY_ID, '--write']);
  }

  process.stdout.write('\n── Résultats Φ ──\n');
  for (const slot of SLOTS) {
    const row = results[slot] || {};
    const ok = (row.phiNormalized || 0) >= PHI_OK ? '✓' : '✗';
    process.stdout.write(`  ${ok} ${slot} : Φ_norm=${row.phiNormalized ?? '—'} visualMatch=${row.visualMatch ?? '—'}\n`);
  }
  if (closed.length) {
    process.stdout.write(`\n✓ RealΣ clôturé : ${closed.join(', ')}\n`);
  }
  const allOk = SLOTS.every((s) => (results[s]?.phiNormalized || 0) >= PHI_OK);
  if (!allOk) {
    process.exitCode = 1;
  }
};

main();
