#!/usr/bin/env node
/**
 * Checklist humaine — scénarios App P1 Mint (matrice JSON).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/print-mint-app-p1-checklist.mjs file_roller
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const slot = process.argv[2] || 'file_roller';
const matrixCandidates = [
  path.join(ROOT, `root/docs/inventaires/interactions/linux-mint/${slot}-scenarios.json`),
  path.join(ROOT, `root/docs/inventaires/interactions/linux-mint/${slot.replace(/_/g, '-')}-scenarios.json`),
];
const matrixPath = matrixCandidates.find((p) => fs.existsSync(p));

if (!matrixPath) {
  console.error(`Matrice absente : ${matrixCandidates.join(' ou ')}`);
  process.exit(1);
}

const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

console.log(`# Checklist App P1 — ${matrix.label || matrix.slot || slot}`);
console.log(`Matrice : ${matrixPath.replace(`${ROOT}/`, '')}`);
console.log(`Cycle : ${matrix.workflow?.cycle || '—'}`);
console.log('');
console.log('| ID | P | Dimension | Label | Rv |');
console.log('|----|---|-----------|-------|-----|');

(matrix.scenarios || []).forEach((sc) => {
  const rv = sc.rv ? 'oui' : '—';
  console.log(`| ${sc.id} | ${sc.priority} | ${sc.dimension || '—'} | ${sc.label} | ${rv} |`);
});

console.log('');
console.log(`Total : ${matrix.scenarios.length} scénarios`);
