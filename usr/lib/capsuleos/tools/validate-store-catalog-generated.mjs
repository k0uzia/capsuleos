#!/usr/bin/env node
/**
 * Valide capsule-store-catalog.js — à jour et cohérent avec les contrats actifs.
 * Usage : node usr/lib/capsuleos/tools/validate-store-catalog-generated.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { buildStoreAppsByRegistry, loadPresentationBindings } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-store-catalog.js');
const GEN = path.join(__dirname, 'generate-store-catalog.mjs');

const EXPECTED_STORE_APPS = {
  'linux-alma': 11,
  'linux-rocky': 11,
  'linux-fedora': 11,
  'linux-ubuntu': 11,
  'linux-popos': 11,
  'linux-anduinos': 11,
  'linux-mint': 19,
  'linux-kde-neon': 11,
  'linux-opensuse': 11,
};

const errors = [];

if (!fs.existsSync(OUT)) {
  errors.push('capsule-store-catalog.js absent — node usr/lib/capsuleos/tools/generate-store-catalog.mjs');
} else {
  const expected = buildStoreAppsByRegistry();
  const bindings = loadPresentationBindings();

  for (const [registryId, binding] of Object.entries(bindings.bindings || {})) {
    const want = EXPECTED_STORE_APPS[registryId];
    if (want === undefined) continue;
    const got = (expected[registryId] || []).length;
    if (got !== want) {
      errors.push(`${registryId} : attendu ${want} apps store, contrat en donne ${got}`);
    }
    if (binding.storeCatalogStatus === 'deferred' && got !== 0) {
      errors.push(`${registryId} : deferred — catalogue doit rester vide (0 apps)`);
    }
  }

  const content = fs.readFileSync(OUT, 'utf8');
  if (!content.includes('CAPSULE_STORE_APPS_BY_REGISTRY')) {
    errors.push('capsule-store-catalog.js : CAPSULE_STORE_APPS_BY_REGISTRY absent');
  }

  for (const [registryId, want] of Object.entries(EXPECTED_STORE_APPS)) {
    if (want === 0) {
      if (!content.includes(`"${registryId}": []`)) {
        errors.push(`${registryId} : attendu tableau vide [] dans le fichier généré`);
      }
      continue;
    }
    if (!content.includes(`"${registryId}"`)) {
      errors.push(`${registryId} : section absente du fichier généré`);
      continue;
    }
    const ids = (expected[registryId] || []).map((e) => e.id).sort();
    for (const id of ids) {
      if (!content.includes(`"id": "${id}"`)) {
        errors.push(`${registryId} : appId "${id}" absent du fichier généré`);
      }
    }
  }

  spawnSync(process.execPath, [GEN], { cwd: ROOT, stdio: 'pipe' });
  const fresh = fs.readFileSync(OUT, 'utf8');
  const before = content.replace(/\s+/g, ' ');
  const after = fresh.replace(/\s+/g, ' ');
  if (before !== after) {
    errors.push('capsule-store-catalog.js désynchronisé — node usr/lib/capsuleos/tools/generate-store-catalog.mjs');
  }
}

if (errors.length) {
  console.error(`✗ validate-store-catalog-generated — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
const summary = Object.entries(EXPECTED_STORE_APPS)
  .map(([id, n]) => `${id}: ${n}`)
  .join(', ');
console.log(`✓ validate-store-catalog-generated OK — ${summary}`);
