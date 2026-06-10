#!/usr/bin/env node
/**
 * Agrégateur intégrité catalogue apps — slots, store, présentation, sync slotSpecs.
 * Usage : node usr/lib/capsuleos/tools/validate-app-catalog-integrity.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  loadSlotsManifest,
  loadStoreContract,
  loadPresentationBindings,
  loadAppsCatalogContract,
} from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

const subValidators = [
  'validate-slots-manifest.mjs',
  'validate-presentation-bindings.mjs',
  'validate-store-catalog-generated.mjs',
];

for (const script of subValidators) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    errors.push(`${script} — échec`);
  }
}

const slotsManifest = loadSlotsManifest();
const store = loadStoreContract();
const presentation = loadPresentationBindings();
const appsCatalog = loadAppsCatalogContract();

for (const app of store.apps || []) {
  if (!slotsManifest.slots?.[app.slot]) {
    errors.push(`store-installable slot "${app.slot}" absent de slots-manifest.json`);
  }
  for (const [registryId, src] of Object.entries(app.sources || {})) {
    if (!src.storeInstallable) continue;
    const binding = presentation.bindings?.[registryId];
    if (!binding) {
      warnings.push(`${app.slot}/${registryId} : storeInstallable sans presentation-binding`);
      continue;
    }
    const toolkit = binding.toolkit;
    const slot = slotsManifest.slots[app.slot];
    const depth = slot?.functionalDepth;
    if ((depth === 'full' || depth === 'partial') && !slot.toolkitVariants?.[toolkit]) {
      errors.push(`${app.slot}/${registryId} : pas de toolkitVariants.${toolkit} (functionalDepth=${depth})`);
    }
  }
}

const manifestSlotIds = new Set(Object.keys(slotsManifest.slots || {}));
for (const [toolkitId, toolkit] of Object.entries(appsCatalog.toolkits || {})) {
  for (const slotId of Object.keys(toolkit.slotSpecs || {})) {
    if (!manifestSlotIds.has(slotId)) {
      warnings.push(`apps-catalog toolkits.${toolkitId}.slotSpecs.${slotId} absent de slots-manifest (sync doc)`);
    } else {
      const spec = toolkit.slotSpecs[slotId];
      const manifest = slotsManifest.slots[slotId];
      const variant = manifest.toolkitVariants?.[toolkitId];
      if (variant && spec.template !== variant.template) {
        warnings.push(`slotSpecs vs slots-manifest drift ${slotId}/${toolkitId} template: ${spec.template} ≠ ${variant.template}`);
      }
    }
  }
}

if (store.status !== 'active') {
  errors.push(`store-installable-apps.json status="${store.status}" — attendu "active"`);
}
if (!store.slotsManifestRef?.includes('slots-manifest')) {
  errors.push('store-installable-apps.json : slotsManifestRef manquant');
}

if (warnings.length) {
  console.warn(`\n⚠ ${warnings.length} avertissement(s) catalogue`);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}
if (errors.length) {
  console.error(`\n✗ validate-app-catalog-integrity — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log('\n✓ validate-app-catalog-integrity OK — StoreΣ structurel');
