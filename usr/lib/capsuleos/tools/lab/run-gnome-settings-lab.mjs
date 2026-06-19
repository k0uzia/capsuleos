#!/usr/bin/env node
/**
 * Suite lab Paramètres GNOME — smokes statiques, baseline, chaîne de parité.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --id linux-ubuntu --profile visual-prereq
 *   node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --vm --id linux-rocky
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { h6Profile } from './h6-gnome-settings-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const args = process.argv.slice(2);
const withPlaywright = args.includes('--playwright');
const withVm = args.includes('--vm');
const registryIdx = args.indexOf('--id');
const profileIdx = args.indexOf('--profile');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-rocky';
const profile = profileIdx >= 0 ? args[profileIdx + 1] : 'full';
const h6 = h6Profile(registry);

function run(script, extraArgs = []) {
  const res = spawnSync(process.execPath, [path.join(LAB, script), ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

const writeLabState = (ok) => {
  const out = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-lab-state.json`);
  fs.writeFileSync(out, `${JSON.stringify({
    registryId: registry,
    profile,
    gates: { L: { ok, at: new Date().toISOString() } },
  }, null, 2)}\n`);
};

if (profile === 'visual-prereq') {
  run('verify-playbook-assets.mjs', ['--registry', registry, '--strict']);
  run('smoke-gnome-settings-visual-matrix.mjs', ['--id', registry]);
  run('smoke-gnome-settings-interactions.mjs');
  writeLabState(true);
  console.log(`✓ run-gnome-settings-lab [visual-prereq] ${registry}`);
  process.exit(0);
}

run('generate-gsettings-bindings.mjs');
run('verify-playbook-assets.mjs', ['--registry', registry, '--strict']);
if (h6.requiresPlaybook || h6.requiresBaseline) {
  run('generate-vm-settings-baseline.mjs', ['--registry', registry]);
}
run('smoke-gnome-settings-playbook.mjs');
run('smoke-gnome-settings-interaction-playbook.mjs');
run('smoke-gnome-settings-interactions.mjs');
run('smoke-gsettings-mappers.mjs');
run('smoke-gnome-settings-visual-matrix.mjs', ['--id', registry]);
if (h6.requiresPlaybook) {
  run('compare-playbook-gsettings-capsule.mjs', ['--registry', registry, '--strict']);
}
run('enrich-visual-investigation-gsettings-pass.mjs', ['--id', registry]);
run('collect-capsule-visual-investigation.mjs', ['--id', registry]);
run('enrich-visual-investigation-capsule-parity.mjs', ['--id', registry]);
if (h6.requiresPlaybook) {
  run('compare-vm-parity-defaults.mjs', ['--registry', registry, '--strict']);
}
run('verify-gnome-settings-parity-chain.mjs', ['--id', registry]);
if (!h6.skipH5P1) {
  run('smoke-h5-p1-appearance.mjs');
}
run('smoke-h5-p0-shell.mjs');
writeLabState(true);

if (withPlaywright) {
  if (!process.env.CAPSULE_HTTP_BASE) {
    console.error('CAPSULE_HTTP_BASE requis pour --playwright');
    process.exit(1);
  }
  run('smoke-gnome-settings-interactions.mjs');
  run('smoke-gsettings-snapshot.mjs');
}

if (withVm) {
  run('collect-vm-gnome-settings-assets.mjs', ['--id', registry]);
  run('verify-playbook-assets.mjs', ['--registry', registry, '--strict']);
  run('collect-vm-gnome-settings-visual-investigation.mjs', ['--id', registry, '--filter', 'P0']);
  run('enrich-visual-investigation-gsettings-pass.mjs', ['--id', registry]);
  if (h6.requiresPlaybook) {
    run('collect-vm-gnome-settings-playbook.mjs', ['--id', registry]);
    run('collect-vm-gnome-settings-interaction.mjs', ['--id', registry]);
  }
  run('generate-gsettings-bindings.mjs');
  if (h6.requiresPlaybook || h6.requiresBaseline) {
    run('generate-vm-settings-baseline.mjs', ['--registry', registry]);
  }
  run('verify-gnome-settings-parity-chain.mjs', ['--id', registry, '--strict']);
}

console.log('✓ run-gnome-settings-lab terminé');
