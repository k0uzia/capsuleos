#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate SBOM CycloneDX — présence, fraîcheur, structure minimale.
 * Usage : node usr/lib/capsuleos/tools/validate-sbom.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SBOM_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/sbom.cyclonedx.json');
const HASH_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/sbom.hash.json');
const GENERATE = path.join(__dirname, 'generate-sbom.mjs');

const errors = [];

if (!fs.existsSync(SBOM_FILE)) {
  errors.push('var/lib/capsuleos/generated/sbom.cyclonedx.json absent');
}

if (!fs.existsSync(HASH_FILE)) {
  errors.push('var/lib/capsuleos/generated/sbom.hash.json absent');
}

if (!errors.length) {
  let bom;
  try {
    bom = JSON.parse(fs.readFileSync(SBOM_FILE, 'utf8'));
  } catch (e) {
    errors.push('sbom.cyclonedx.json illisible ou JSON invalide');
  }

  if (bom) {
    if (bom.bomFormat !== 'CycloneDX') {
      errors.push('bomFormat !== CycloneDX');
    }
    if (!bom.specVersion) {
      errors.push('specVersion absent');
    }
    if (!Array.isArray(bom.components) || bom.components.length === 0) {
      errors.push('components[] vide ou absent');
    }
    if (!bom.metadata?.component?.name) {
      errors.push('metadata.component.name absent');
    }
    const scope = bom.metadata?.properties?.find((p) => p.name === 'capsuleos:sbom-scope');
    if (!scope || scope.value !== 'lab-devDependencies') {
      errors.push('metadata.properties capsuleos:sbom-scope=lab-devDependencies absent');
    }
  }
}

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const freshness = spawnSync(process.execPath, [GENERATE, '--check'], {
  cwd: ROOT,
  encoding: 'utf8',
});

if (freshness.status !== 0) {
  process.stderr.write(freshness.stderr || freshness.stdout || '');
  process.exit(freshness.status || 1);
}

const bom = JSON.parse(fs.readFileSync(SBOM_FILE, 'utf8'));
console.log(
  `✓ validate-sbom OK — CycloneDX ${bom.specVersion}, `
  + `${bom.components.length} composants (lab npm)`,
);
