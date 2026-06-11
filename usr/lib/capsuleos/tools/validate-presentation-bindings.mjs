#!/usr/bin/env node
/**
 * Valide presentation-bindings.json — registryId actif dans os-registry.
 * Usage : node usr/lib/capsuleos/tools/validate-presentation-bindings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPresentationBindings } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const bindings = loadPresentationBindings();
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'etc/capsuleos/os-registry.json'), 'utf8'));
const activeIds = new Set((registry.entries || []).filter((e) => e.status === 'active').map((e) => e.id));

for (const [registryId, binding] of Object.entries(bindings.bindings || {})) {
  if (!activeIds.has(registryId)) {
    errors.push(`${registryId} : absent ou inactif dans os-registry.json`);
  }
  if (!binding.bodyId || !binding.toolkit || !binding.storeFront?.slot) {
    errors.push(`${registryId} : bodyId, toolkit ou storeFront.slot manquant`);
  }
}

if (errors.length) {
  console.error(`✗ validate-presentation-bindings — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ validate-presentation-bindings OK — ${Object.keys(bindings.bindings || {}).length} bindings`);
