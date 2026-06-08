#!/usr/bin/env node
/**
 * Chaîne manifeste → playbook → staging → import (tous registryId avec VM lab).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-rocky --auto --write
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateManifestGates } from './manifest-gates-lib.mjs';
import { vendorIdForRegistry, toolkitIdForRegistry } from './vm-manifest-media-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STEPS = [
  {
    id: 'ensure-vendor-catalog',
    gate: () => true,
    cmd: ['ensure-vm-manifest-vendor.mjs', '--write'],
    optional: true,
  },
  {
    id: 'collect-manifest',
    gate: (g) => !g.ManV,
    cmd: ['collect-vm-distribution-manifest.mjs', '--write', '--ssh'],
  },
  {
    id: 'smoke-manifest',
    gate: (g) => g.ManV && !g.ManS,
    cmd: ['smoke-vm-distribution-manifest.mjs'],
  },
  {
    id: 'generate-playbook',
    gate: (g) => g.ManV && g.ManS && (!g.PbM || !g.ManA),
    cmd: ['generate-manifest-replication-playbook.mjs', '--write'],
  },
  {
    id: 'smoke-playbook',
    gate: (g) => g.PbM,
    cmd: ['smoke-manifest-replication-playbook.mjs'],
    optional: true,
  },
  {
    id: 'derive-appv',
    gate: (g) => g.ManV,
    cmd: ['collect-vm-apps-inventory.mjs', '--write'],
    optional: true,
  },
  {
    id: 'approve',
    gate: (g) => g.ManS && !g.ManA,
    cmd: ['approve-vm-distribution-manifest.mjs', '--write'],
    manual: true,
  },
  {
    id: 'staging-vm',
    gate: (g) => g.ManA && !g.ManSt,
    cmd: ['run-manifest-staging-on-vm.mjs', '--write'],
  },
  {
    id: 'import-staging',
    gate: (g) => g.ManSt && !g.ManI,
    cmd: ['import-manifest-staging.mjs', '--write'],
  },
  {
    id: 'apply-manifest-refs',
    gate: (g) => g.ManI && !g.ManInt,
    cmd: ['apply-manifest-refs.mjs', '--write'],
  },
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', auto: false, write: false, maxSteps: 14 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--auto') opts.auto = true;
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
  }
  return opts;
};

const runStep = (script, argv, write) => {
  const args = [...argv];
  if (write && !args.includes('--write')) args.push('--write');
  const res = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return res.status === 0;
};

const main = () => {
  const opts = parseArgs();
  const vendor = vendorIdForRegistry(opts.id);
  const toolkit = toolkitIdForRegistry(opts.id);
  console.log(`\n── Chaîne manifeste ${opts.id} (vendor=${vendor}, toolkit=${toolkit}) ──\n`);

  let stepsRun = 0;
  for (const step of STEPS) {
    if (stepsRun >= opts.maxSteps) break;
    const gates = evaluateManifestGates(opts.id);
    if (!step.gate(gates)) continue;
    if (step.manual && !opts.auto) {
      console.log(`⏸ ${step.id} — approbation manuelle requise`);
      console.log(`   node usr/lib/capsuleos/tools/lab/${step.cmd[0]} --id ${opts.id} --write`);
      break;
    }
    console.log(`→ ${step.id}`);
    const ok = runStep(step.cmd[0], ['--id', opts.id, ...step.cmd.slice(1)], opts.write);
    if (!ok && !step.optional) {
      console.error(`✗ échec: ${step.id}`);
      process.exit(1);
    }
    stepsRun += 1;
  }

  const final = evaluateManifestGates(opts.id);
  console.log('\nÉtat:', JSON.stringify(final, null, 2));
  if (final.ManΣ) {
    console.log('✓ ManΣ — manifeste + import terminés');
  }
};

main();
