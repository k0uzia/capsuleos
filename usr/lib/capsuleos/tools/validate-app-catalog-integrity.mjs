#!/usr/bin/env node
/**
 * Gate StoreΣ — intégrité registryOverrides pour OS Linux actifs.
 * Usage : node usr/lib/capsuleos/tools/validate-app-catalog-integrity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreCatalogEntries } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

const REQUIRED_FIELDS = ['labelFr', 'priorite', 'slot', 'statut', 'requiresSlot'];

const ACTIVE_LINUX = () => {
  const reg = readJson('etc/capsuleos/os-registry.json');
  return (reg.entries || []).filter((e) => e.family === 'linux' && e.status === 'active').map((e) => e.id);
};

const appsCatalog = readJson('etc/capsuleos/contracts/apps-catalog.json');
const presentation = readJson('etc/capsuleos/contracts/presentation-bindings.json');
const store = readJson('etc/capsuleos/contracts/store-installable-apps.json');

const overrides = appsCatalog.registryOverrides || {};

for (const registryId of ACTIVE_LINUX()) {
  const block = overrides[registryId];
  if (!block) {
    errors.push(`${registryId} : registryOverrides manquant`);
    continue;
  }

  const entry = (readJson('etc/capsuleos/os-registry.json').entries || []).find((e) => e.id === registryId);
  const expectedToolkit = entry?.toolkit?.id;
  if (expectedToolkit && block.toolkit && block.toolkit !== expectedToolkit) {
    errors.push(`${registryId} : toolkit contrat ${block.toolkit} ≠ registre ${expectedToolkit}`);
  }

  const apps = block.apps || {};
  if (!Object.keys(apps).length) {
    errors.push(`${registryId} : apps vide`);
  }

  for (const [vmId, spec] of Object.entries(apps)) {
    for (const field of REQUIRED_FIELDS) {
      if (spec[field] === undefined) {
        errors.push(`${registryId}.${vmId} : champ ${field} manquant`);
      }
    }
    if (spec.requiresSlot && spec.statut === 'ok' && !spec.slot) {
      errors.push(`${registryId}.${vmId} : requiresSlot sans slot`);
    }
  }

  const binding = presentation.bindings?.[registryId];
  if (binding && !binding.storeCatalogStatus) {
    const storeFront = binding.storeFront || store.storeFrontByRegistry?.[registryId];
    if (!storeFront?.slot) {
      errors.push(`${registryId} : storeFront absent (presentation-bindings)`);
    }
  }

  if (binding?.storeCatalogStatus !== 'deferred') {
    try {
      const entries = buildStoreCatalogEntries(registryId);
      const expected = registryId === 'linux-mint' ? 21 : (
        ['linux-alma', 'linux-rocky', 'linux-fedora', 'linux-ubuntu', 'linux-popos', 'linux-anduinos'].includes(registryId) ? 11 : null
      );
      if (expected !== null && entries.length !== expected) {
        errors.push(`${registryId} : store attendu ${expected} apps (actuel ${entries.length})`);
      }
    } catch (err) {
      if (!binding?.storeCatalogStatus) {
        errors.push(`${registryId} : buildStoreCatalogEntries — ${err.message}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ validate-app-catalog-integrity — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

const counts = ACTIVE_LINUX().map((id) => `${id}=${Object.keys(overrides[id]?.apps || {}).length}`).join(', ');
console.log(`✓ validate-app-catalog-integrity OK — ${ACTIVE_LINUX().length} OS Linux actifs (${counts})`);
process.exit(0);
