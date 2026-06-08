#!/usr/bin/env node
/**
 * Pipeline assets VM — pull, WebP, miniatures fonds, optim. inventory, gates (prérequis VΣ).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-vendor-assets-pipeline.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/run-vendor-assets-pipeline.mjs --id linux-ubuntu --skip-pull
 *
 * R-PWD1 : préférer lab-capture-session si ssh-add / sudo requis sur l'hôte.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-ubuntu',
    skipPull: false,
    skipInventory: false,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--skip-pull') opts.skipPull = true;
    else if (args[i] === '--skip-inventory') opts.skipInventory = true;
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const vendorFromId = (id) => {
  const map = {
    'linux-rocky': 'rocky',
    'linux-fedora': 'fedora',
    'linux-ubuntu': 'ubuntu',
    'linux-alma': 'alma',
    'linux-mint': 'mint',
  };
  return map[id] || id.replace(/^linux-/, '');
};

const run = (label, cmd, cmdArgs, extra = {}) => {
  process.stderr.write(`--- ${label} ---\n`);
  if (extra.dryRun) {
    process.stdout.write(`  (dry-run) ${cmd} ${cmdArgs.join(' ')}\n`);
    return true;
  }
  const res = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    timeout: extra.timeout || 600000,
  });
  if (res.status !== 0) {
    process.stderr.write(`  ✗ ${label} (code ${res.status})\n`);
    return false;
  }
  return true;
};

const main = () => {
  const opts = parseArgs();
  const vendor = vendorFromId(opts.id);
  const pullSh = path.join(ROOT, 'root/tools/lab/pull-vm-assets.sh');
  const prepare = path.join(ROOT, 'usr/lib/capsuleos/tools/prepare-web-media.mjs');
  const invDir = `usr/share/capsuleos/assets/images/vendors/${vendor}/inventory`;

  process.stderr.write(`=== Pipeline assets ${opts.id} (${vendor}) ===\n`);

  if (!opts.skipPull) {
    if (!run('Pull VM (SCP)', 'bash', [pullSh, '--id', opts.id], opts)) {
      process.exit(1);
    }
  }

  if (!run(
    'WebP vendor (fonds + raster)',
    'node',
    [prepare, '--vendor', vendor, '--rewrite-refs', '--wallpaper-thumbnails'],
    opts,
  )) {
    process.exit(1);
  }

  if (!opts.skipInventory) {
    run(
      'Inventory WebP (miniatures lab, PNG conservé)',
      'node',
      [prepare, '--dir', invDir, '--profile', 'inventory-optimize', '--keep-source'],
      { ...opts, timeout: 900000 },
    );
  }

  const gates = [
    ['Gate web-media', 'node', [path.join(ROOT, 'usr/lib/capsuleos/tools/validate-web-media-prepare.mjs')]],
    ['Gate extensions raster', 'node', [path.join(ROOT, 'usr/lib/capsuleos/tools/validate-vendor-image-extensions.mjs')]],
    ['Gate zones assets', 'node', [path.join(ROOT, 'usr/lib/capsuleos/tools/validate-asset-zones.mjs')]],
  ];

  for (const [label, cmd, cmdArgs] of gates) {
    if (!run(label, cmd, cmdArgs, opts)) {
      process.exit(1);
    }
  }

  process.stdout.write(`OK run-vendor-assets-pipeline ${opts.id}\n`);
};

main();
