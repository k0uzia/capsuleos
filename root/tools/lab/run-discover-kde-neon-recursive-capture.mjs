#!/usr/bin/env node
/**
 * Campagne récursive Discover KDE Neon — VM ground truth → assets → captures → Capsule.
 *
 *   KDE_NEON_SSH=goupil@192.168.123.52 CAPSULE_HTTP_BASE=http://127.0.0.1:5500 \
 *     node root/tools/lab/run-discover-kde-neon-recursive-capture.mjs
 *
 *   ... --skip-vm          # inventaires + Capsule seulement
 *   ... --skip-capsule     # VM + inventaires seulement
 *   ... --write            # replication-state discoverRecursiveLastRun
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REGISTRY_ID = 'linux-kde-neon';
const args = process.argv.slice(2);
const write = args.includes('--write');
const skipVm = args.includes('--skip-vm');
const skipCapsule = args.includes('--skip-capsule');
const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';
const ssh = process.env.KDE_NEON_SSH || 'goupil@192.168.123.52';
const env = { ...process.env, CAPSULE_HTTP_BASE: httpBase, KDE_NEON_SSH: ssh };

const run = (label, cmd, cmdArgs = [], opts = {}) => {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...env, ...(opts.env || {}) },
    ...opts,
  });
  return {
    label,
    ok: r.status === 0,
    command: [cmd, ...cmdArgs].join(' '),
    stdout: (r.stdout || '').trim().slice(-800),
    stderr: (r.stderr || '').trim().slice(-400),
  };
};

const results = [];

results.push(run('inventaire sidebar VM', 'bash', [
  'root/tools/lab/vm-kde-neon-discover-sidebar-inventory.sh',
]));

results.push(run('pull sidebar icons', 'bash', [
  'root/tools/lab/pull-kde-neon-discover-sidebar-icons.sh',
]));

results.push(run('pull installed icons', 'bash', [
  'root/tools/lab/pull-kde-neon-discover-icons.sh',
]));

results.push(run('inventaire store icons', 'node', [
  'root/tools/lab/inventory-kde-neon-discover-store-icons.mjs',
  '--write',
]));

results.push(run('inventaire catégories VM', 'bash', [
  'root/tools/lab/vm-kde-neon-discover-category-apps-inventory.sh',
]));

results.push(run('pull catégories icons', 'bash', [
  'root/tools/lab/pull-kde-neon-discover-category-icons.sh',
]));

results.push(run('merge catalog catégories', 'node', [
  'root/tools/lab/merge-discover-catalog-categories.mjs',
]));

if (!skipVm) {
  results.push(run('VM discover-recursive', 'bash', [
    'root/tools/lab/vm-kde-neon-capture-host.sh',
    '--discover-recursive',
  ], { env: { ...env, KDE_NEON_SSH: ssh } }));
}

if (!skipCapsule) {
  results.push(run('Capsule discover-only', 'node', [
    'root/tools/lab/capture-capsule-kde-neon.mjs',
    '--discover-only',
  ]));
}

[
  'smoke-discover-neon-sidebar-icons.mjs',
  'smoke-discover-neon-store-icons.mjs',
  'smoke-discover-neon-icons.mjs',
  'smoke-discover-vm-parity.mjs',
  'smoke-discover-kde-neon.mjs',
  'smoke-kde-neon-discover.mjs',
  'smoke-discover-neon-categories.mjs',
].forEach((script) => {
  results.push(run(`smoke ${script}`, 'node', [`usr/lib/capsuleos/tools/lab/${script}`]));
});

const dest = path.join(ROOT, 'home/public/Images/screen_KDE-Neon');
const vmDiscoverFiles = fs.existsSync(dest)
  ? fs.readdirSync(dest).filter((f) => f.startsWith('vm-discover') && f.endsWith('.png'))
  : [];
const capsuleDiscoverFiles = fs.existsSync(dest)
  ? fs.readdirSync(dest).filter((f) => f.startsWith('capsule-discover') && f.endsWith('.png'))
  : [];

const failures = results.filter((r) => !r.ok);
const report = {
  registryId: REGISTRY_ID,
  campaign: 'discover-recursive-capture',
  evaluatedAt: new Date().toISOString(),
  passOk: failures.length === 0,
  ssh,
  httpBase,
  vmCaptures: vmDiscoverFiles.length,
  capsuleCaptures: capsuleDiscoverFiles.length,
  vmFiles: vmDiscoverFiles.sort(),
  capsuleFiles: capsuleDiscoverFiles.sort(),
  failures: failures.map((f) => f.label),
  steps: results.map((r) => ({ label: r.label, ok: r.ok })),
};

console.log(JSON.stringify(report, null, 2));

if (write) {
  const statePath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-replication-state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.discoverRecursiveLastRun = {
      evaluatedAt: report.evaluatedAt,
      passOk: report.passOk,
      vmCaptures: report.vmCaptures,
      capsuleCaptures: report.capsuleCaptures,
      failures: report.failures,
      tool: 'run-discover-kde-neon-recursive-capture.mjs',
    };
    state.updatedAt = report.evaluatedAt;
    if (state.groundProgress) {
      state.groundProgress.G6_discoverRecursiveAt = report.evaluatedAt;
    }
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    console.log('→ replication-state discoverRecursiveLastRun mis à jour');
  }
}

if (failures.length) {
  failures.forEach((f) => {
    console.error(`\n✗ ${f.label}`);
    if (f.stderr) console.error(f.stderr);
    if (f.stdout) console.error(f.stdout);
  });
}

process.exit(failures.length ? 1 : 0);
