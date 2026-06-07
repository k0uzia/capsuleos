#!/usr/bin/env node
/**
 * Approuve un manifeste distribution (chaîne agentique) — débloque import rsync.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/approve-vm-distribution-manifest.mjs --id linux-ubuntu --write
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadManifest, writeManifest } from './vm-manifest-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, by: 'agent' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--by' && args[i + 1]) opts.by = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const smoke = spawnSync(process.execPath, [
    path.join(__dirname, 'smoke-vm-distribution-manifest.mjs'),
    '--id', opts.id,
  ], { encoding: 'utf8' });
  if (smoke.status !== 0) {
    console.error((smoke.stderr || smoke.stdout || '').trim());
    process.exit(1);
  }

  const manifest = loadManifest(opts.id);
  if (!manifest) {
    console.error('Manifeste absent');
    process.exit(1);
  }

  manifest.validation = {
    ...manifest.validation,
    status: 'approved',
    smokeOk: true,
    approved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: opts.by,
  };

  if (opts.write) {
    writeManifest(opts.id, manifest);
    console.log(`✓ manifeste approuvé: proc/${opts.id}/`);
    console.log('  → import-vm-manifest-assets.mjs --id', opts.id, '--write');
  } else {
    process.stdout.write(`${JSON.stringify(manifest.validation, null, 2)}\n`);
  }
};

main();
