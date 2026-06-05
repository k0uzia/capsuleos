#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-assets-manifest.js
 * Usage : node usr/lib/capsuleos/tools/build-assets-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const SRC = path.join(ROOT, 'usr/share/capsuleos/assets/manifest.json');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-assets-manifest.js');

const manifest = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const banner = `/**
 * Manifeste assets CapsuleOS (généré).
 * Source : usr/share/capsuleos/assets/manifest.json
 * Regénérer : node usr/lib/capsuleos/tools/build-assets-manifest.mjs
 */
`;

fs.writeFileSync(
  OUT,
  `${banner}window.CAPSULE_ASSETS_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`,
  'utf8'
);
console.log(`Écrit ${OUT}`);
