#!/usr/bin/env node
/**
 * Suite lab applications — calquée sur run-gnome-settings-lab.mjs (structure → runtime → VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky --playwright
 *   node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky --vm
 *   node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky --shell
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordAppsLabState } from './apps-replication-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const LAB = path.join(ROOT, 'usr/lib/capsuleos/tools/lab');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');

const args = process.argv.slice(2);
const withPlaywright = args.includes('--playwright');
const withVm = args.includes('--vm');
const withShell = args.includes('--shell');
const registryIdx = args.indexOf('--id');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-rocky';

const run = (script, extraArgs = [], cwd = LAB) => {
  const res = spawnSync(process.execPath, [path.join(cwd, script), ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (res.status !== 0) process.exit(res.status || 1);
};

process.stdout.write(`=== run-apps-lab ${registry} ===\n`);

// Couche 1 — structure (équivalent smoke-gnome-settings-playbook + parity chain)
run('generate-apps-catalog.mjs', ['--id', registry, '--write']);
run('smoke-apps-catalog.mjs', ['--id', registry]);
run('smoke-apps-matrix.mjs', ['--id', registry]);
run('smoke-apps-interaction-playbook.mjs', ['--id', registry]);
run('smoke-apps-snapshot.mjs', ['--id', registry]);
run('smoke-visual-fidelity.mjs', ['--id', registry]);
run('../linux/validate-os-facade-fidelity.mjs', ['--id', registry], LAB);

if (registry === 'linux-rocky') {
  run('smoke-rocky-gnome-ref.mjs');
}

run('validate-gnome-chrome-apps.mjs', [], TOOLS);

// Couche 2 — runtime Playwright (équivalent smoke-gsettings-snapshot / interactions)
if (withPlaywright) {
  if (!process.env.CAPSULE_HTTP_BASE) {
    console.error('CAPSULE_HTTP_BASE requis pour --playwright');
    process.exit(1);
  }
  run('smoke-os-facade-rocky.mjs');
  run('smoke-apps-interactions.mjs', ['--id', registry]);
  run('smoke-apps-snapshot.mjs', ['--id', registry]);
  run('smoke-gnome-nautilus-routing.mjs');
  if (registry === 'linux-rocky') {
    run('smoke-rocky-overview-search-icons.mjs');
    run('smoke-window-resize-left.mjs');
  }
}

// Shell GNOME (post-catalogue, pré-parité visuelle app)
if (withShell && registry === 'linux-rocky') {
  if (!process.env.CAPSULE_HTTP_BASE) {
    console.error('CAPSULE_HTTP_BASE requis pour --shell');
    process.exit(1);
  }
  run('smoke-rocky-shell-polish.mjs', ['--playwright']);
  run('smoke-rocky-shell-polish-phase2.mjs', ['--playwright']);
}

// Couche 3 — VM (équivalent collect playbook VM)
if (withVm) {
  run('collect-vm-apps-inventory.mjs', ['--id', registry, '--write', '--ssh']);
  run('generate-apps-catalog.mjs', ['--id', registry, '--write']);
  run('smoke-apps-catalog.mjs', ['--id', registry]);
}

recordAppsLabState(registry, 'done', {
  playwright: withPlaywright,
  vm: withVm,
  shell: withShell,
});

console.log(`✓ run-apps-lab ${registry} terminé — gate AppL`);
