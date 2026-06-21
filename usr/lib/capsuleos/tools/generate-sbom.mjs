#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Génère le SBOM CycloneDX (dépendances npm lab) depuis package-lock.json.
 * Usage :
 *   node usr/lib/capsuleos/tools/generate-sbom.mjs [--check]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const OUT_DIR = path.join(ROOT, 'var/lib/capsuleos/generated');
const SBOM_FILE = path.join(OUT_DIR, 'sbom.cyclonedx.json');
const HASH_FILE = path.join(OUT_DIR, 'sbom.hash.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const PACKAGE_LOCK = path.join(ROOT, 'package-lock.json');
const CYCLONEDX_BIN = path.join(ROOT, 'node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js');

const checkOnly = process.argv.includes('--check');

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function computeSourceHash() {
  return {
    packageJson: sha256File(PACKAGE_JSON),
    packageLock: sha256File(PACKAGE_LOCK),
  };
}

function enrichSbom(bom) {
  const enriched = { ...bom };
  enriched.metadata = enriched.metadata || {};
  enriched.metadata.component = enriched.metadata.component || {
    type: 'application',
    name: 'capsuleos',
  };

  enriched.metadata.component.description =
    'CapsuleOS — simulation pédagogique statique (HTML/CSS/JS). '
    + 'Ce SBOM couvre les dépendances npm **lab uniquement** (Playwright, sharp, …). '
    + 'Le site servi en production n’embarque aucune dépendance npm runtime.';

  enriched.metadata.component.licenses = [
    {
      license: {
        id: 'GPL-3.0-or-later',
        acknowledgement: 'declared',
      },
    },
  ];

  enriched.metadata.component.externalReferences = [
    {
      type: 'website',
      url: 'https://github.com/N0r3f/CapsuleOS',
    },
    {
      type: 'vcs',
      url: 'https://github.com/N0r3f/CapsuleOS.git',
    },
    {
      type: 'issue-tracker',
      url: 'https://github.com/N0r3f/CapsuleOS/issues',
    },
    {
      type: 'documentation',
      url: 'https://github.com/N0r3f/CapsuleOS/blob/main/SECURITY.md',
    },
  ];

  const properties = Array.isArray(enriched.metadata.properties)
    ? [...enriched.metadata.properties]
    : [];

  const upsert = (name, value) => {
    const idx = properties.findIndex((p) => p.name === name);
    if (idx >= 0) {
      properties[idx] = { name, value };
    } else {
      properties.push({ name, value });
    }
  };

  upsert('capsuleos:runtime-npm-dependencies', 'none');
  upsert('capsuleos:sbom-scope', 'lab-devDependencies');
  upsert('capsuleos:reuse-spec', '3.0');
  upsert('capsuleos:license-policy', 'REUSE.toml + LICENSES/GPL-3.0-or-later');

  enriched.metadata.properties = properties;
  return enriched;
}

function writeHash(sourceHash, componentCount) {
  const payload = {
    version: 1,
    generatedBy: 'usr/lib/capsuleos/tools/generate-sbom.mjs',
    sourceHash: sourceHash,
    sbomFile: 'var/lib/capsuleos/generated/sbom.cyclonedx.json',
    componentCount,
    specVersion: '1.6',
  };
  fs.writeFileSync(HASH_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

function generateSbom() {
  if (!fs.existsSync(CYCLONEDX_BIN)) {
    console.error('  ✗ @cyclonedx/cyclonedx-npm absent — exécuter npm install');
    process.exit(1);
  }
  if (!fs.existsSync(PACKAGE_LOCK)) {
    console.error('  ✗ package-lock.json absent');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const result = spawnSync(process.execPath, [
    CYCLONEDX_BIN,
    '--output-format', 'JSON',
    '--output-file', SBOM_FILE,
    '--spec-version', '1.6',
    '--package-lock-only',
    '--validate',
    '--mc-type', 'application',
    PACKAGE_JSON,
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    process.stdout.write(result.stdout || '');
    console.error('  ✗ cyclonedx-npm a échoué');
    process.exit(result.status || 1);
  }

  const bom = enrichSbom(readJson(SBOM_FILE));
  fs.writeFileSync(SBOM_FILE, `${JSON.stringify(bom, null, 2)}\n`);

  const sourceHash = computeSourceHash();
  const componentCount = Array.isArray(bom.components) ? bom.components.length : 0;
  writeHash(sourceHash, componentCount);

  console.log(`✓ SBOM CycloneDX écrit — ${SBOM_FILE} (${componentCount} composants)`);
}

function checkFreshness() {
  if (!fs.existsSync(SBOM_FILE) || !fs.existsSync(HASH_FILE)) {
    console.error('  ✗ SBOM absent — lancer node usr/lib/capsuleos/tools/generate-sbom.mjs');
    process.exit(1);
  }

  const stored = readJson(HASH_FILE);
  const current = computeSourceHash();
  const stale =
    stored.sourceHash?.packageJson !== current.packageJson
    || stored.sourceHash?.packageLock !== current.packageLock;

  if (stale) {
    console.error('  ✗ SBOM périmé (package.json / package-lock.json modifiés) — regénérer avec generate-sbom.mjs');
    process.exit(1);
  }

  const bom = readJson(SBOM_FILE);
  if (bom.bomFormat !== 'CycloneDX') {
    console.error('  ✗ bomFormat invalide');
    process.exit(1);
  }

  console.log(`✓ SBOM CycloneDX à jour — ${stored.componentCount || bom.components?.length || 0} composants`);
}

if (checkOnly) {
  checkFreshness();
} else {
  generateSbom();
}
