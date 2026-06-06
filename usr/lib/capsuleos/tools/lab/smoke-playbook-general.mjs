#!/usr/bin/env node
/**
 * Smoke contrat playbook général.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const read = (rel) => {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

const contract = JSON.parse(read('etc/capsuleos/contracts/playbook-general.json') || '{}');
const procedure = read('root/docs/procedure-playbook-general.md');

if (!contract.validated) errors.push('playbook-general.json : validated=false');
if (!contract.layers?.universal?.steps?.length) errors.push('couche universal vide');
if (!contract.layers?.toolkit?.map?.gnome?.orchestrator) errors.push('toolkit gnome sans orchestrateur');
if (!contract.layers?.tail?.steps?.length) errors.push('couche tail vide');
if (!procedure.includes('Pbτ')) errors.push('procedure-playbook-general : couche τ absente');

for (const script of [
  'usr/lib/capsuleos/tools/lab/playbook-general-lib.mjs',
  'usr/lib/capsuleos/tools/lab/run-playbook-general.mjs',
  'usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs',
]) {
  if (!fs.existsSync(path.join(ROOT, script))) errors.push(`script manquant: ${script}`);
}

if (!read('root/docs/inventaires/_template-playbook-tail.json').includes('officialDocCrossCheck')) {
  errors.push('template playbook-tail incomplet');
}

if (errors.length) {
  console.error('smoke-playbook-general — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-playbook-general OK');
