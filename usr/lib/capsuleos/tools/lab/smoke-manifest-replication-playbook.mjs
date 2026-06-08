#!/usr/bin/env node
/**
 * Smoke playbook manifest — gate PbM avant staging/import.
 */
import { loadPlaybook, itemsToPull } from './manifest-playbook-lib.mjs';
import { loadManifest } from './vm-manifest-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const errors = [];
  const manifest = loadManifest(opts.id);
  const playbook = loadPlaybook(opts.id);

  if (!manifest) errors.push('distribution-manifest.json absent');
  if (!playbook) errors.push('manifest-playbook absent — generate-manifest-replication-playbook.mjs --write');
  if (playbook) {
    if (!playbook.items?.length) errors.push('playbook.items vide');
    if (playbook.summary.pull === 0 && playbook.summary.drift === 0 && itemsToPull(playbook).length === 0) {
      console.warn(`  ⚠ aucun pull/drift — clone déjà aligné ou manifeste médias incomplet`);
    }
    if (!playbook.staging?.remoteDir) errors.push('staging.remoteDir manquant');
  }

  if (errors.length) {
    console.error(`✗ smoke-manifest-replication-playbook (${opts.id})`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-manifest-replication-playbook OK — pull=${playbook.summary.pull} drift=${playbook.summary.drift}`);
};

main();
