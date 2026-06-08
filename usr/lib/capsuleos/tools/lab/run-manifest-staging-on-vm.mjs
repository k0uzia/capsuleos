#!/usr/bin/env node
/**
 * Envoie le playbook minimal sur la VM et exécute le staging centralisé.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-manifest-staging-on-vm.mjs --id linux-ubuntu --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  loadPlaybook,
  writePlaybook,
  itemsToPull,
  stagingRemoteDir,
} from './manifest-playbook-lib.mjs';
import { loadManifest, loadLabHost, identitiesForHost } from './vm-manifest-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const STAGING_SCRIPT = 'root/tools/lab/vm-manifest-staging-collect.sh';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, force: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--force') opts.force = true;
  }
  return opts;
};

const shellQuote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

const main = () => {
  const opts = parseArgs();
  const playbook = loadPlaybook(opts.id);
  if (!playbook) {
    console.error('Playbook absent — generate-manifest-replication-playbook.mjs --write');
    process.exit(1);
  }

  const manifest = loadManifest(opts.id);
  const approved = manifest?.validation?.approved || manifest?.validation?.status === 'approved';
  if (!approved && !opts.force) {
    console.error('Manifeste non approuvé — approve-vm-distribution-manifest.mjs --write ou --force');
    process.exit(1);
  }

  const host = loadLabHost(opts.id);
  const scriptBody = fs.readFileSync(path.join(ROOT, STAGING_SCRIPT), 'utf8');
  const minimal = JSON.stringify({
    registryId: opts.id,
    items: itemsToPull(playbook),
  });

  const remoteCmd = [
    `export CAPSULE_PLAYBOOK_JSON=${shellQuote(minimal)}`,
    `export REGISTRY_ID=${shellQuote(opts.id)}`,
    'bash -s',
  ].join('; ');

  const identities = identitiesForHost(host);
  let lastErr = '';
  let stdout = '';

  for (const identity of identities) {
    const res = spawnSync(
      'ssh',
      [
        '-o', 'BatchMode=yes',
        '-o', 'IdentitiesOnly=yes',
        '-i', identity,
        host.ssh,
        remoteCmd,
      ],
      { input: scriptBody, encoding: 'utf8', timeout: 180000 },
    );
    if (res.status === 0) {
      stdout = (res.stdout || '').trim();
      break;
    }
    lastErr = (res.stderr || res.stdout || '').trim();
  }

  if (!stdout) {
    console.error(`Staging VM échec: ${lastErr}`);
    process.exit(1);
  }

  console.log(`✓ staging VM → ${stagingRemoteDir(opts.id)}`);
  console.log(`  ${stdout}`);

  if (opts.write) {
    playbook.staging.status = 'completed';
    playbook.staging.completedAt = new Date().toISOString();
    playbook.phases = (playbook.phases || []).map((p) => (
      p.id === 'stage-vm' ? { ...p, status: 'done' } : p
    ));
    writePlaybook(opts.id, playbook);
  }
};

main();
