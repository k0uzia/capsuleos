#!/usr/bin/env node
/**
 * Valide capsule-store-catalog.js — à jour et pilote Alma 11 apps.
 * Usage : node usr/lib/capsuleos/tools/validate-store-catalog-generated.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { buildStoreAppsByRegistry } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-store-catalog.js');
const GEN = path.join(__dirname, 'generate-store-catalog.mjs');

const errors = [];

if (!fs.existsSync(OUT)) {
  errors.push('capsule-store-catalog.js absent — node usr/lib/capsuleos/tools/generate-store-catalog.mjs');
} else {
  const expected = buildStoreAppsByRegistry();
  const expectedAlma = (expected['linux-alma'] || []).map((e) => e.id).sort();
  const expectedRocky = (expected['linux-rocky'] || []).map((e) => e.id).sort();
  if (expectedAlma.length !== 11) {
    errors.push(`linux-alma : attendu 11 apps store, contrat en donne ${expectedAlma.length}`);
  }
  if (expectedRocky.length !== 11) {
    errors.push(`linux-rocky : attendu 11 apps store, contrat en donne ${expectedRocky.length}`);
  }

  const content = fs.readFileSync(OUT, 'utf8');
  if (!content.includes('CAPSULE_STORE_APPS_BY_REGISTRY')) {
    errors.push('capsule-store-catalog.js : CAPSULE_STORE_APPS_BY_REGISTRY absent');
  }
  for (const id of expectedAlma) {
    if (!content.includes(`"${id}"`)) {
      errors.push(`linux-alma : appId "${id}" absent du fichier généré`);
    }
  }
  const rockyBlock = content.match(/"linux-rocky":\s*\[([\s\S]*?)\n  \]/);
  if (!rockyBlock) {
    errors.push('linux-rocky : section absente du fichier généré');
  } else {
    for (const id of expectedRocky) {
      if (!rockyBlock[1].includes(`"id": "${id}"`)) {
        errors.push(`linux-rocky : appId "${id}" absent du fichier généré`);
      }
    }
  }

  const tmp = path.join(ROOT, 'var/lib/capsuleos/generated/.capsule-store-catalog.check.js');
  spawnSync(process.execPath, [GEN], { cwd: ROOT, stdio: 'pipe' });
  const fresh = fs.readFileSync(OUT, 'utf8');
  const before = content.replace(/\s+/g, ' ');
  const after = fresh.replace(/\s+/g, ' ');
  if (before !== after) {
    errors.push('capsule-store-catalog.js désynchronisé — node usr/lib/capsuleos/tools/generate-store-catalog.mjs');
  }
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}

if (errors.length) {
  console.error(`✗ validate-store-catalog-generated — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log('✓ validate-store-catalog-generated OK — Alma + Rocky 11 apps, fichier à jour');
