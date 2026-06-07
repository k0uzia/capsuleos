#!/usr/bin/env node
/**
 * Étend la matrice VΣ avec les applications détectées sur la VM (AppV → Va).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --id linux-ubuntu --write
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --id linux-ubuntu --ensure-apps
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  mergeMatrixWithApps,
  writeRegistryMatrix,
  hasAppCatalog,
  registryMatrixPath,
} from './ui-state-effects-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, ensureApps: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--ensure-apps') opts.ensureApps = true;
  }
  return opts;
};

const ensureAppChain = (registryId) => {
  if (hasAppCatalog(registryId)) return { ok: true, skipped: true };
  process.stderr.write(`  → chaîne AppV/AppC (${registryId})\n`);
  const inv = spawnSync('node', [
    path.join(__dirname, 'collect-vm-apps-inventory.mjs'),
    '--id', registryId, '--write', '--ssh',
  ], { cwd: ROOT, encoding: 'utf8' });
  if (inv.status !== 0) {
    return { ok: false, error: (inv.stderr || inv.stdout || '').trim() };
  }
  const cat = spawnSync('node', [
    path.join(__dirname, 'generate-apps-catalog.mjs'),
    '--id', registryId, '--write',
  ], { cwd: ROOT, encoding: 'utf8' });
  if (cat.status !== 0) {
    return { ok: false, error: (cat.stderr || cat.stdout || '').trim() };
  }
  return { ok: true, skipped: false };
};

const main = () => {
  const opts = parseArgs();
  if (opts.ensureApps) {
    const apps = ensureAppChain(opts.id);
    if (!apps.ok) {
      console.error(apps.error);
      process.exit(1);
    }
  }

  const matrix = mergeMatrixWithApps(opts.id);
  if (opts.write) {
    const out = writeRegistryMatrix(opts.id, matrix);
    process.stdout.write(`OK ${out}\n`);
    process.stdout.write(`  base=${matrix.summary.baseTransitions} discovered=${matrix.summary.discoveredTransitions} total=${matrix.summary.totalTransitions}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(matrix.summary, null, 2)}\n`);
    process.stdout.write(`path=${registryMatrixPath(opts.id)}\n`);
  }
};

main();
