#!/usr/bin/env node
/**
 * Cycle scénarios/captures KDE Neon — VM → Capsule → compare → smokes → baseline.
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-scenarios-capture-cycle.mjs
 *   KDE_NEON_SSH=<lab-inventory:linux-kde-neon> ... --write-baseline --write
 *   ... --skip-vm
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { resolveInventoryField } from './lab-inventory-resolve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REGISTRY_ID = 'linux-kde-neon';
const args = process.argv.slice(2);
const write = args.includes('--write');
const writeBaseline = args.includes('--write-baseline');
const skipVm = args.includes('--skip-vm');
const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';
const env = { ...process.env, CAPSULE_HTTP_BASE: httpBase };

const run = (label, cmd, cmdArgs = [], opts = {}) => {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    env,
    ...opts,
  });
  return {
    label,
    ok: r.status === 0,
    command: [cmd, ...cmdArgs].join(' '),
    stdout: (r.stdout || '').trim().slice(-600),
    stderr: (r.stderr || '').trim().slice(-400),
  };
};

const results = [];

if (!skipVm) {
  const ssh = process.env.KDE_NEON_SSH || resolveInventoryField('linux-kde-neon', 'ssh');
  results.push(run(
    'VM discover-vm-100',
    'bash',
    ['root/tools/lab/vm-kde-neon-capture-host.sh', '--discover-vm-100'],
    { env: { ...env, KDE_NEON_SSH: ssh } },
  ));
}

results.push(run('Capsule discover public', 'node', ['root/tools/lab/capture-capsule-kde-neon.mjs']));

const compareOnce = () => run('KdVp compare', 'node', [
  'usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs',
  '--id', REGISTRY_ID,
  '--compare',
]);
let compareResult = compareOnce();
for (let attempt = 0; !compareResult.ok && attempt < 3; attempt += 1) {
  compareResult = compareOnce();
}
results.push(compareResult);

if (writeBaseline && compareResult.ok) {
  results.push(run('KdVp write-baseline', 'node', [
    'usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs',
    '--id', REGISTRY_ID,
    '--write-baseline',
  ]));
}

[
  'smoke-discover-vm-parity.mjs',
  'smoke-discover-kde-neon.mjs',
  'smoke-kde-neon-discover.mjs',
].forEach((script) => {
  results.push(run(`smoke ${script}`, 'node', [`usr/lib/capsuleos/tools/lab/${script}`]));
});

results.push(run('CredΣ fidelity-all', 'node', [
  'usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-all.mjs',
  '--id', REGISTRY_ID,
]));

results.push(run('H2 validate-all', 'node', ['usr/lib/capsuleos/tools/validate-all.mjs']));

const failures = results.filter((r) => !r.ok);
const report = {
  registryId: REGISTRY_ID,
  campaign: 'scenarios-capture-cycle',
  evaluatedAt: new Date().toISOString(),
  passOk: failures.length === 0,
  steps: results.length,
  failures: failures.map((f) => f.label),
  piTarget: 100,
};

console.log(JSON.stringify(report, null, 2));

if (write) {
  const statePath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-replication-state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.campaignScenariosCapture = 'scenarios-capture-kde-neon';
    state.campaignScenariosCaptureStatus = failures.length === 0 ? 'closed' : 'in_progress';
    state.scenariosCaptureLastCycle = {
      evaluatedAt: report.evaluatedAt,
      passOk: report.passOk,
      failures: report.failures,
      tool: 'run-kde-neon-scenarios-capture-cycle.mjs',
    };
    if (failures.length === 0) {
      state.campaignScenariosCaptureClosedAt = report.evaluatedAt;
    }
    state.updatedAt = report.evaluatedAt;
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    console.log('→ replication-state scenariosCaptureLastCycle mis à jour');
  }
}

process.exit(failures.length ? 1 : 0);
