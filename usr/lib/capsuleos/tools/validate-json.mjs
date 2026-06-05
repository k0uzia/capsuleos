#!/usr/bin/env node
/**
 * Contrôle JSON CapsuleOS : syntaxe + structure des fichiers canoniques.
 * Usage : node usr/lib/capsuleos/tools/validate-json.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateSkinProfile,
  validateOsRegistry,
  validateAssetsManifest,
  validateStringsJson,
  validateCapsuleManifest,
} from './validate-json-schema-lite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SKIP_DIRS = new Set(['node_modules', '.git', '.cursor']);
const SKIP_PATH_PARTS = [
  path.join('var', 'lib', 'capsuleos', 'generated'),
];

const errors = [];
const warnings = [];

const shouldSkipDir = (absDir) => {
  const rel = path.relative(ROOT, absDir);
  return SKIP_PATH_PARTS.some((p) => rel === p || rel.startsWith(p + path.sep));
};

const collectJsonFiles = () => {
  const files = [];
  const walk = (dir) => {
    if (shouldSkipDir(dir)) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name));
      } else if (ent.name.endsWith('.json')) {
        files.push(path.join(dir, ent.name));
      }
    }
  };
  walk(ROOT);
  return files;
};

const rel = (abs) => path.relative(ROOT, abs).replace(/\\/g, '/');

const parseJson = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) {
    warnings.push(`${rel(file)}: BOM UTF-8 (préférer fichier sans BOM)`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    errors.push(`${rel(file)}: JSON invalide — ${e.message}`);
    return null;
  }
};

const semanticCheck = (file, data) => {
  const r = rel(file);

  if (r === 'etc/capsuleos/os-registry.json') {
    errors.push(...validateOsRegistry(data));
    return;
  }
  if (r === 'usr/share/capsuleos/assets/manifest.json') {
    errors.push(...validateAssetsManifest(data));
    return;
  }
  if (r.startsWith('etc/capsuleos/profiles/') && r.endsWith('.json')) {
    errors.push(...validateSkinProfile(data, r));
    return;
  }
  if (r.endsWith('skin.profile.json')) {
    errors.push(...validateSkinProfile(data, r));
    return;
  }
  if (r.endsWith('/content/strings.json') || r.endsWith('content/strings.json')) {
    errors.push(...validateStringsJson(data, r));
    return;
  }
  if (r === 'home/public/.capsule-manifest.json') {
    errors.push(...validateCapsuleManifest(data, r));
  }
};

const files = collectJsonFiles();
let parsed = 0;

for (const file of files) {
  const data = parseJson(file);
  if (data === null) continue;
  parsed += 1;
  semanticCheck(file, data);
}

if (warnings.length) {
  console.warn(`Avertissements (${warnings.length}):`);
  warnings.slice(0, 20).forEach((w) => console.warn(`  ⚠ ${w}`));
  if (warnings.length > 20) console.warn(`  ... et ${warnings.length - 20} autres`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) JSON`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}

console.log(`✓ validate-json OK — ${parsed} fichier(s) JSON, structure canonique conforme`);
