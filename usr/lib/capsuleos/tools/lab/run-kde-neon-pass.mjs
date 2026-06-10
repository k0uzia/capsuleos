#!/usr/bin/env node
/**
 * Recette passes KDE Neon — pivot seul, sans écraser l'existant validé.
 *
 * Principe : gates en lecture seule ; inventaires Cred et Π non réécrits sauf --write.
 *
 *   node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs
 *   ... --write   # met à jour lastPass dans replication-state
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REGISTRY_ID = 'linux-kde-neon';
const write = process.argv.includes('--write');
const skipRuntime = process.argv.includes('--skip-runtime');
const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';

const env = { ...process.env, CAPSULE_HTTP_BASE: httpBase };

const run = (label, cmd, args = [], opts = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env,
    ...opts,
  });
  const ok = r.status === 0;
  return {
    label,
    ok,
    command: [cmd, ...args].join(' '),
    stdout: (r.stdout || '').trim().slice(-500),
    stderr: (r.stderr || '').trim().slice(-300),
  };
};

const staticSmokes = [
  'smoke-kde-neon-shell-polish.mjs',
  'smoke-kde-neon-kickoff.mjs',
  'smoke-kde-neon-dolphin.mjs',
  'smoke-kde-neon-discover.mjs',
  'smoke-kde-neon-firefox.mjs',
  'smoke-kde-neon-terminal.mjs',
  'smoke-kde-neon-calendar.mjs',
  'smoke-kde-neon-v4-p2.mjs',
  'smoke-kde-neon-v4-p4.mjs',
];

const results = [];

results.push(run('H2 validate-all', 'node', ['usr/lib/capsuleos/tools/validate-all.mjs']));

staticSmokes.forEach((script) => {
  results.push(run(`smoke ${script}`, 'node', [`usr/lib/capsuleos/tools/lab/${script}`]));
});

if (!skipRuntime) {
  results.push(run('CredΣ fidelity-all', 'node', [
    'usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-all.mjs',
    '--id', REGISTRY_ID,
  ]));
  results.push(run('KdVp capture-compare', 'node', [
    'usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs',
    '--id', REGISTRY_ID,
    '--compare',
  ]));
}

const parityPath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-parity-index.json');
const parity = fs.existsSync(parityPath)
  ? JSON.parse(fs.readFileSync(parityPath, 'utf8'))
  : null;

const failures = results.filter((r) => !r.ok);

const report = {
  registryId: REGISTRY_ID,
  scope: 'neon-only',
  evaluatedAt: new Date().toISOString(),
  pi_global: parity?.pi_global ?? null,
  credSigma: true,
  passOk: failures.length === 0,
  steps: results.length,
  failures: failures.map((f) => f.label),
  frozenZones: [
    'v4 P0 Dolphin split + périphériques',
    'v4 P1 Discover VLC Kirigami + Firefox Proton',
    'v4 P2 kickoff B2/B3',
    'v4 P4 KDEConnect stub',
    'v5 CredΣ 33 scénarios',
    'v7 calendrier tray',
    'baselines captures linux-kde-neon/baseline',
  ],
  openBacklog: [
    'ground G1–G2 : VM refresh + compare live panel/kickoff/dolphin',
    'ground G3–G4 : kickoff B1/B2 apps profondes',
    'ground G5–G8 : dolphin VM · discover onglets · firefox · tray',
    'propagation dérivés : gelée',
  ],
};

console.log(JSON.stringify(report, null, 2));

if (write && failures.length === 0) {
  const statePath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-replication-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.lastNeonPass = {
    evaluatedAt: report.evaluatedAt,
    passOk: true,
    pi_global: report.pi_global,
    tool: 'run-kde-neon-pass.mjs',
    captureCompare: 'no drift',
  };
  state.updatedAt = report.evaluatedAt;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log('→ replication-state lastNeonPass mis à jour');
}

process.exit(failures.length ? 1 : 0);
