#!/usr/bin/env node
/**
 * Gate inventaire terminal Ti — P0/P1 Linux actifs.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-terminal-inventory.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const REQUIRED_TI = new Set([
  'linux-mint',
  'linux-ubuntu',
  'linux-rocky',
]);

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const errors = [];
const warnings = [];

for (const entry of registry.entries) {
  if (entry.family !== 'linux' || entry.status !== 'active') {
    continue;
  }
  if (!REQUIRED_TI.has(entry.id)) {
    continue;
  }

  const invRel = `root/docs/inventaires/${entry.id}-terminal-vm.json`;
  const invPath = path.join(ROOT, invRel);
  if (!fs.existsSync(invPath)) {
    errors.push(`${entry.id}: inventaire Ti absent (${invRel})`);
    continue;
  }

  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  if (!inv.packageManager || !inv.packageManager.primary) {
    errors.push(`${entry.id}: packageManager manquant dans ${invRel}`);
  }
  if (!Array.isArray(inv.commandAudit) || inv.commandAudit.length < 5) {
    errors.push(`${entry.id}: commandAudit[] insuffisant (${invRel})`);
  }
  if (!inv.formalState || inv.formalState.Ti !== true) {
    warnings.push(`${entry.id}: formalState.Ti !== true — documenter clôture Ti`);
  }
  if (inv.registryId && inv.registryId !== entry.id) {
    errors.push(`${entry.id}: registryId incohérent (${inv.registryId})`);
  }
}

if (warnings.length) {
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
  console.error(`✗ validate-terminal-inventory — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log(`✓ validate-terminal-inventory OK — Ti requis pour ${[...REQUIRED_TI].join(', ')}`);
