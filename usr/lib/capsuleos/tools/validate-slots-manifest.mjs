#!/usr/bin/env node
/**
 * Valide slots-manifest.json — kernel existant ou decorative/capsuleOnly explicite.
 * Usage : node usr/lib/capsuleos/tools/validate-slots-manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSlotsManifest } from './lab/capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const manifest = loadSlotsManifest();
const decorativeDepths = new Set(['decorative', 'capsuleOnly']);

for (const [slotId, slot] of Object.entries(manifest.slots || {})) {
  if (!slot.functionalDepth) {
    errors.push(`${slotId} : functionalDepth manquant`);
  }
  const isDecorative = decorativeDepths.has(slot.functionalDepth);
  if (slot.kernelModule) {
    const kernelPath = path.join(ROOT, slot.kernelModule);
    if (!fs.existsSync(kernelPath)) {
      errors.push(`${slotId} : kernelModule introuvable ${slot.kernelModule}`);
    }
  } else if (!isDecorative && slot.functionalDepth !== 'decorative') {
    if (!slot.kernelNote) {
      errors.push(`${slotId} : kernelModule null sans kernelNote (functionalDepth=${slot.functionalDepth})`);
    }
  }
  for (const [toolkit, variant] of Object.entries(slot.toolkitVariants || {})) {
    if (!variant.template || !variant.skinCss) {
      errors.push(`${slotId}/${toolkit} : template ou skinCss manquant`);
    }
  }
}

if (errors.length) {
  console.error(`✗ validate-slots-manifest — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ validate-slots-manifest OK — ${Object.keys(manifest.slots || {}).length} slots`);
