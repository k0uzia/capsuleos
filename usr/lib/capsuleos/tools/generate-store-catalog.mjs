#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-store-catalog.js depuis les contrats catalogue.
 * Sources : store-installable-apps.json, presentation-bindings.json, slots-manifest.json
 *
 * Usage : node usr/lib/capsuleos/tools/generate-store-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreAppsByRegistry } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-store-catalog.js');

const storeApps = buildStoreAppsByRegistry();

const runtimeEntries = {};
for (const [registryId, list] of Object.entries(storeApps)) {
  runtimeEntries[registryId] = list.map((entry) => {
    const { storeFrontSlot, postInstallSlot, ...runtime } = entry;
    return runtime;
  });
}

const banner = `/**
 * Catalogue magasin CapsuleOS (généré).
 * Sources : store-installable-apps.json · slots-manifest.json · presentation-bindings.json
 * Regénérer : node usr/lib/capsuleos/tools/generate-store-catalog.mjs
 */
`;

const out = `${banner}(function initCapsuleStoreCatalog(global) {
  'use strict';
  global.CAPSULE_STORE_APPS_BY_REGISTRY = ${JSON.stringify(runtimeEntries, null, 2)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');

const almaCount = runtimeEntries['linux-alma']?.length || 0;
console.log(`Écrit ${path.relative(ROOT, OUT)} — ${Object.keys(runtimeEntries).length} registry, linux-alma: ${almaCount} apps`);
