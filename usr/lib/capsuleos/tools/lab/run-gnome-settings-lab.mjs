#!/usr/bin/env node
/**
 * Suite lab Paramètres GNOME — smokes statiques, baseline, chaîne de parité.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --playwright
 *   node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --vm --id linux-rocky
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');

const args = process.argv.slice(2);
const withPlaywright = args.includes('--playwright');
const withVm = args.includes('--vm');
const registryIdx = args.indexOf('--id');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-rocky';

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

run('generate-gsettings-bindings.mjs');
run('generate-vm-settings-baseline.mjs', ['--registry', registry]);
run('smoke-gnome-settings-playbook.mjs');
run('smoke-gnome-settings-interaction-playbook.mjs');
run('smoke-gnome-settings-interactions.mjs');
run('smoke-gsettings-mappers.mjs');
run('compare-vm-parity-defaults.mjs', ['--registry', registry, '--strict']);
run('verify-gnome-settings-parity-chain.mjs', ['--strict']);

if (withPlaywright) {
  if (!process.env.CAPSULE_HTTP_BASE) {
    console.error('CAPSULE_HTTP_BASE requis pour --playwright');
    process.exit(1);
  }
  run('smoke-gnome-settings-interactions.mjs');
}

if (withVm) {
  run('collect-vm-gnome-settings-playbook.mjs', ['--id', registry]);
  run('collect-vm-gnome-settings-interaction.mjs', ['--id', registry]);
  run('generate-gsettings-bindings.mjs');
  run('generate-vm-settings-baseline.mjs', ['--registry', registry]);
  run('verify-gnome-settings-parity-chain.mjs', ['--strict']);
}

console.log('✓ run-gnome-settings-lab terminé');
