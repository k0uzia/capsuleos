#!/usr/bin/env node
/**
 * Gate façade pick-os — rendu /OS/... aligné sur home/ + fidélité visuelle Rocky.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/linux/validate-os-facade-fidelity.mjs
 *   node usr/lib/capsuleos/tools/linux/validate-os-facade-fidelity.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateOsFacadeFidelity } from './os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: null, all: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--all') opts.all = true;
  }
  return opts;
};

const registryIdsWithFidelity = () => {
  const invDir = path.join(ROOT, 'root/docs/inventaires');
  return fs.readdirSync(invDir)
    .filter((name) => name.endsWith('-visual-fidelity.json'))
    .map((name) => name.replace('-visual-fidelity.json', ''));
};

const main = () => {
  const opts = parseArgs();
  const ids = opts.id ? [opts.id] : (opts.all ? registryIdsWithFidelity() : ['linux-rocky']);
  const errors = [];

  ids.forEach((registryId) => {
    errors.push(...validateOsFacadeFidelity(registryId));
  });

  if (errors.length) {
    console.error('validate-os-facade-fidelity — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ validate-os-facade-fidelity OK — ${ids.join(', ')} (façade /OS ≡ home/)`);
};

main();
