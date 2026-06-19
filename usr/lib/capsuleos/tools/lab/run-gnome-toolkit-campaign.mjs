#!/usr/bin/env node
/**
 * Orchestrateur campagne reproduction GNOME toolkit.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-gnome-toolkit-campaign.mjs --id linux-rocky --phase v0
 *   node usr/lib/capsuleos/tools/lab/run-gnome-toolkit-campaign.mjs --phase v1 --id linux-fedora
 *   node usr/lib/capsuleos/tools/lab/run-gnome-toolkit-campaign.mjs --phase v2 --id linux-rocky --dry-run
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DERIVED_ORDER = ['linux-fedora', 'linux-ubuntu', 'linux-alma', 'linux-anduinos'];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', phase: 'v0', dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--phase' && args[i + 1]) opts.phase = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const run = (rel, extra = [], dryRun = false) => {
  const cmd = `node ${rel} ${extra.join(' ')}`.trim();
  console.log(`\n→ ${cmd}`);
  if (dryRun) return { status: 0 };
  const res = spawnSync('node', [path.join(ROOT, rel), ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  return res;
};

const phaseV0 = (id, dryRun) => {
  const steps = [
    ['usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/validate-all.mjs', []],
    ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs', ['--id', id, '--write']],
    ['usr/lib/capsuleos/tools/lab/generate-vm-settings-baseline.mjs', ['--registry', id]],
    ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs', ['--id', id, '--strict']],
    ['usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/lab/smoke-h6-gnome-settings-ready.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/validate-gnome-settings-pbsigma.mjs', []],
    ['usr/lib/capsuleos/tools/lab/smoke-gnome-themes-scenarios.mjs', []],
    ['usr/lib/capsuleos/tools/lab/generate-gnome-campaign-state.mjs', ['--id', id, '--write']],
    ['usr/lib/capsuleos/tools/lab/smoke-gnome-campaign-state.mjs', ['--id', id]],
  ];
  for (const [script, extra] of steps) {
    const res = run(script, extra, dryRun);
    if (res.status !== 0) {
      console.error(`\n✗ Campagne V0 interrompue — ${script}`);
      process.exit(res.status || 1);
    }
  }
  console.log(`\n✓ Campagne V0 ${id} terminée`);
};

const phaseV1 = (id, dryRun) => {
  const targets = id ? [id] : DERIVED_ORDER;
  for (const registryId of targets) {
    const steps = [
      ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs', ['--id', registryId, '--write']],
      ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs', ['--id', registryId]],
      ['usr/lib/capsuleos/tools/lab/generate-vm-settings-baseline.mjs', ['--registry', registryId]],
      ['usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs', ['--id', registryId]],
      ['usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs', ['--id', registryId]],
      ['usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs', ['--id', registryId, '--strict']],
      ['usr/lib/capsuleos/tools/lab/smoke-h6-gnome-settings-ready.mjs', ['--id', registryId]],
      ['usr/lib/capsuleos/tools/lab/generate-gnome-campaign-state.mjs', ['--id', registryId, '--write']],
      ['usr/lib/capsuleos/tools/lab/smoke-gnome-campaign-state.mjs', ['--id', registryId, '--no-v0']],
    ];
    for (const [script, extra] of steps) {
      const res = run(script, extra, dryRun);
      if (res.status !== 0) {
        console.error(`\n✗ Campagne V1 interrompue — ${registryId} — ${script}`);
        process.exit(res.status || 1);
      }
    }
    const syncScripts = [
      ['usr/lib/capsuleos/tools/linux/sync-gnome-workstation-skin.mjs', []],
      ['usr/lib/capsuleos/tools/linux/sync-gnome-utility-app-skins.mjs', []],
    ];
    if (registryId !== 'linux-anduinos') {
      syncScripts.push(['usr/lib/capsuleos/tools/linux/sync-gnome-nautilus-skin.mjs', []]);
    }
    for (const [script, extra] of syncScripts) {
      run(script, extra, dryRun);
    }
    console.log(`\n✓ Campagne V1 ${registryId} terminée`);
  }
};

const phaseV2 = (id, dryRun) => {
  const steps = [
    ['usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs', ['--id', id, '--auto']],
    ['usr/lib/capsuleos/tools/lab/run-apps-lab.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/linux/sync-gnome-nautilus-skin.mjs', []],
    ['usr/lib/capsuleos/tools/linux/sync-gnome-workstation-skin.mjs', []],
    ['usr/lib/capsuleos/tools/linux/sync-gnome-utility-app-skins.mjs', []],
    ['usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', ['--id', id]],
  ];
  for (const [script, extra] of steps) {
    const res = run(script, extra, dryRun);
    if (res.status !== 0) {
      console.error(`\n✗ Campagne V2 interrompue — ${script}`);
      process.exit(res.status || 1);
    }
  }
  console.log(`\n✓ Campagne V2 apps P0 ${id} terminée`);
};

const phaseV3 = (id, dryRun) => {
  const steps = [
    ['usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/lab/generate-overview-apps-grid.mjs', ['--id', id, '--write']],
    ['usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs', ['--id', id, '--auto']],
    ['usr/lib/capsuleos/tools/linux/sync-gnome-utility-app-skins.mjs', []],
    ['usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', ['--id', id]],
  ];
  for (const [script, extra] of steps) {
    run(script, extra, dryRun);
  }
  console.log(`\n✓ Campagne V3 apps P1 ${id} terminée`);
};

const phaseV4 = (id, dryRun) => {
  const steps = [
    ['usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs', ['--id', id, '--auto']],
    ['usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs', ['--id', id]],
    ['usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', ['--id', id]],
  ];
  for (const [script, extra] of steps) {
    run(script, extra, dryRun);
  }
  console.log(`\n✓ Campagne V4 apps P2 ${id} terminée`);
};

const main = () => {
  const opts = parseArgs();
  console.log(`Campagne GNOME toolkit — phase ${opts.phase} — ${opts.id}${opts.dryRun ? ' (dry-run)' : ''}`);

  switch (opts.phase) {
    case 'v0':
      phaseV0(opts.id, opts.dryRun);
      break;
    case 'v1':
      phaseV1(opts.id === 'linux-rocky' ? null : opts.id, opts.dryRun);
      break;
    case 'v2':
      phaseV2(opts.id, opts.dryRun);
      break;
    case 'v3':
      phaseV3(opts.id, opts.dryRun);
      break;
    case 'v4':
      phaseV4(opts.id, opts.dryRun);
      break;
    default:
      console.error(`Phase inconnue: ${opts.phase} — v0|v1|v2|v3|v4`);
      process.exit(1);
  }
};

main();
