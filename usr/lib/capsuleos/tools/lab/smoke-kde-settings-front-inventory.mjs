#!/usr/bin/env node
/**
 * Smoke inventaire front KDE (KdF).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const invPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-kde-settings-front-inventory.json`);
const regPath = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');

const errors = [];
if (!fs.existsSync(invPath)) {
  errors.push(`inventaire absent: ${path.relative(ROOT, invPath)}`);
} else {
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  if ((inv.moduleCount || 0) < 80) {
    errors.push(`moduleCount=${inv.moduleCount} (attendu ≥80)`);
  }
  if ((inv.hubCategories || []).length < 8) {
    errors.push(`hubCategories=${(inv.hubCategories || []).length} (attendu ≥8)`);
  }
}
if (!fs.existsSync(regPath)) {
  errors.push('kde-settings-controls-registry.json absent');
}

if (errors.length) {
  console.error(`smoke-kde-settings-front-inventory ${registry} — échec`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ smoke-kde-settings-front-inventory ${registry} OK — KdF`);
