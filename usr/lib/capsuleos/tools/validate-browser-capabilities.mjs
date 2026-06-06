#!/usr/bin/env node
/**
 * Vérifie la présence du module CapsuleBrowserCapabilities et des adaptateurs moteur.
 * Usage : node usr/lib/capsuleos/tools/validate-browser-capabilities.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const required = [
  'usr/lib/capsuleos/core/browser-capabilities.js',
  'usr/lib/capsuleos/core/cluster-registry.js',
  'usr/lib/capsuleos/engines/index.js',
  'usr/lib/capsuleos/engines/chromium-blink.js',
  'usr/lib/capsuleos/engines/gecko.js',
  'usr/lib/capsuleos/engines/webkit.js',
  'usr/lib/capsuleos/engines/legacy-mshtml.js',
  'root/docs/compatibilite-navigateurs.md',
  'etc/capsuleos/cluster-registry.json',
  'etc/capsuleos/kernels.json'
];

required.forEach((rel) => {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    errors.push(`Manquant : ${rel}`);
  }
});

const capsSrc = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/core/browser-capabilities.js'), 'utf8');
['detectEngine', 'CapsuleBrowserCapabilities', 'clipboard', 'maskImage', 'trident', 'edgehtml'].forEach((needle) => {
  if (!capsSrc.includes(needle)) {
    errors.push(`browser-capabilities.js : attendu « ${needle} »`);
  }
});

const contentLoader = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/shells/linux/contentLoader.js'), 'utf8');
if (!contentLoader.includes('CapsuleClusterRegistry')) {
  errors.push('contentLoader.js : intégration CapsuleClusterRegistry manquante');
}
if (!contentLoader.includes('CapsuleBrowserCapabilities')) {
  errors.push('contentLoader.js : intégration CapsuleBrowserCapabilities manquante');
}

if (errors.length) {
  console.error('validate-browser-capabilities — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log('✓ validate-browser-capabilities OK');
