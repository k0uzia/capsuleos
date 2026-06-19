#!/usr/bin/env node
/**
 * Suite lab Paramètres KDE Plasma — KdΣ (pilote + dérivés Plasma).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-kde-settings-lab.mjs --id linux-kde-neon
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const args = process.argv.slice(2);
const registryIdx = args.indexOf('--id');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-kde-neon';

function run(script, extraArgs = [], opts = {}) {
  const scriptPath = opts.tools
    ? path.join(ROOT, 'usr/lib/capsuleos/tools', script)
    : path.join(LAB, script);
  const res = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
    env: {
      ...process.env,
      CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(registry),
    },
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

const writeLabState = (ok) => {
  const out = path.join(ROOT, 'root/docs/inventaires', `${registry}-kde-settings-lab-state.json`);
  fs.writeFileSync(out, `${JSON.stringify({
    registryId: registry,
    gates: { L: { ok, at: new Date().toISOString() } },
  }, null, 2)}\n`);
};

run('verify-playbook-assets.mjs', ['--registry', registry, '--strict']);
run('verify-kde-settings-parity-chain.mjs', ['--id', registry]);
run('run-kde-ui-state-effects-pass.mjs', ['--id', registry]);
run('map-kde-ground-truth-gaps.mjs', ['--id', registry, '--write']);

if (registry === 'linux-kde-neon') {
  run('smoke-kde-p4-propagation.mjs');
  run('smoke-kde-v4-p3-propagation.mjs');
  run('smoke-kde-settings-front-inventory.mjs', ['--id', registry]);
  run('validate-kde-settings-user-scenarios.mjs', [], { tools: true });
  run('smoke-kde-v15-propagation.mjs');
}

writeLabState(true);
console.log(`✓ run-kde-settings-lab ${registry}`);
