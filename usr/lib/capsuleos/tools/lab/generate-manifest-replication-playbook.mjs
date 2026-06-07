#!/usr/bin/env node
/**
 * Génère le playbook de réplication personnalisé depuis le manifeste (diff VM ↔ clone).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-manifest-replication-playbook.mjs --id linux-ubuntu --write
 */
import { buildPlaybook, writePlaybook } from './manifest-playbook-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const playbook = buildPlaybook(opts.id);

  if (opts.write) {
    const p = writePlaybook(opts.id, playbook);
    console.log(`✓ ${p.replace(`${ROOT}/`, '')}`);
    console.log(`  pull=${playbook.summary.pull} drift=${playbook.summary.drift} skip=${playbook.summary.skip}`);
  } else {
    process.stdout.write(`${JSON.stringify(playbook, null, 2)}\n`);
  }
};

main();
