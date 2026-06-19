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
const CONTENT_OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-gnome-software-content.js');
const CONTENT_CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/gnome-software-store-content.json');

const storeApps = buildStoreAppsByRegistry();

const runtimeEntries = {};
for (const [registryId, list] of Object.entries(storeApps)) {
  runtimeEntries[registryId] = list.map((entry) => {
    const { storeFrontSlot, ...runtime } = entry;
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

const contentContract = JSON.parse(fs.readFileSync(CONTENT_CONTRACT, 'utf8'));
const contentBanner = `/**
 * Contenu Logiciels GNOME par registry (généré).
 * Source : etc/capsuleos/contracts/gnome-software-store-content.json
 * Regénérer : node usr/lib/capsuleos/tools/generate-store-catalog.mjs
 */
`;
const contentOut = `${contentBanner}(function initCapsuleGnomeSoftwareContent(global) {
  'use strict';
  global.CAPSULE_GNOME_SOFTWARE_CONTENT = ${JSON.stringify(contentContract.byRegistry || {}, null, 2)};
}(typeof window !== 'undefined' ? window : globalThis));
`;
fs.writeFileSync(CONTENT_OUT, contentOut, 'utf8');

const parts = Object.entries(runtimeEntries)
  .map(([id, list]) => `${id}: ${list.length}`)
  .join(', ');
console.log(`Écrit ${path.relative(ROOT, OUT)} — ${Object.keys(runtimeEntries).length} registry (${parts})`);
console.log(`Écrit ${path.relative(ROOT, CONTENT_OUT)} — ${Object.keys(contentContract.byRegistry || {}).length} registry contenu`);
