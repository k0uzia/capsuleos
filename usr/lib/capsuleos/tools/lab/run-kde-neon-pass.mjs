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
  'smoke-discover-kde-neon.mjs',
  'smoke-h6-kde-settings-ready.mjs',
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

results.push(run('SeΣ verify-kde-settings', 'node', [
  'usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs',
  '--id', REGISTRY_ID,
]));

staticSmokes.forEach((script) => {
  results.push(run(`smoke ${script}`, 'node', [`usr/lib/capsuleos/tools/lab/${script}`]));
});

if (!skipRuntime) {
  results.push(run('CredΣ fidelity-all', 'node', [
    'usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-all.mjs',
    '--id', REGISTRY_ID,
  ]));
  const captureCompare = () => run('KdVp capture-compare', 'node', [
    'usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs',
    '--id', REGISTRY_ID,
    '--compare',
  ]);
  let captureResult = captureCompare();
  for (let attempt = 0; !captureResult.ok && attempt < 4; attempt += 1) {
    captureResult = captureCompare();
  }
  results.push(captureResult);
}

const parityPath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-parity-index.json');
const parity = fs.existsSync(parityPath)
  ? JSON.parse(fs.readFileSync(parityPath, 'utf8'))
  : null;

const statePath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-replication-state.json');
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : null;

const failures = results.filter((r) => !r.ok);

const openBacklog = [];
if (state?.nextStep) {
  openBacklog.push(state.nextStep);
}
if (state?.campaignGCoherenceStatus === 'in_progress' || state?.campaignGCoherenceStatus === 'pending') {
  const nextPhase = state.gCoherenceNextPallier ?? 0;
  openBacklog.push(`G-coherence : pallier ${nextPhase} — run-kde-coherence-campaign.mjs --run-next`);
} else if (state?.campaignGCoherenceStatus !== 'closed') {
  openBacklog.push('G-coherence : campagne disponible — linux-kde-neon-roadmap-g-coherence.md');
}
openBacklog.push(state?.groundTruth?.propagationPolicy || 'propagation dérivés : gelée');

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
  openBacklog,
};

console.log(JSON.stringify(report, null, 2));

if (write && state) {
  state.lastNeonPass = {
    evaluatedAt: report.evaluatedAt,
    passOk: failures.length === 0,
    pi_global: report.pi_global,
    tool: 'run-kde-neon-pass.mjs',
    captureCompare: failures.some((f) => f.label === 'KdVp capture-compare') ? 'drift' : 'no drift',
    failures: failures.map((f) => f.label),
  };
  state.updatedAt = report.evaluatedAt;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  console.log('→ replication-state lastNeonPass mis à jour');
}

process.exit(failures.length ? 1 : 0);
