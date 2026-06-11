#!/usr/bin/env node
/**
 * Gate agrégée — tous les contrats scénarios pédagogiques GNOME.
 * Usage : node usr/lib/capsuleos/tools/validate-gnome-user-scenarios-all.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const INDEX = path.join(ROOT, 'etc/capsuleos/contracts/gnome-user-scenarios-index.json');

const errors = [];

if (!fs.existsSync(INDEX)) {
  console.error('✗ validate-gnome-user-scenarios-all — gnome-user-scenarios-index.json manquant');
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
const contracts = index.contracts || [];

if (!contracts.length) {
  errors.push('index : aucun contrat déclaré');
}

contracts.forEach((entry) => {
  const contractPath = path.join(ROOT, entry.contract);
  const validatorPath = path.join(ROOT, entry.validator);
  const smokePath = path.join(ROOT, entry.smoke);

  if (!fs.existsSync(contractPath)) {
    errors.push(`${entry.id} : contrat absent (${entry.contract})`);
  }
  if (!fs.existsSync(validatorPath)) {
    errors.push(`${entry.id} : validateur absent (${entry.validator})`);
  }
  if (!fs.existsSync(smokePath)) {
    errors.push(`${entry.id} : smoke absent (${entry.smoke})`);
  }
});

if (errors.length) {
  console.error(`✗ validate-gnome-user-scenarios-all — structure — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

let failed = false;
for (const entry of contracts) {
  const validatorPath = path.join(ROOT, entry.validator);
  const r = spawnSync(process.execPath, [validatorPath], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error('✗ validate-gnome-user-scenarios-all — un ou plusieurs validateurs ont échoué');
  process.exit(1);
}

console.log(`✓ validate-gnome-user-scenarios-all OK — ${contracts.length} contrat(s)`);
process.exit(0);
