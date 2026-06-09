#!/usr/bin/env node
/**
 * Checklist humaine — matrice menus contextuels Mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/print-mint-context-menu-checklist.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const MATRIX_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/context-menus.json',
);

const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));

process.stdout.write(`\n=== Checklist menus contextuels — ${matrix.registryId} ===\n`);
if (matrix.workflow) {
  process.stdout.write(`Cycle : ${matrix.workflow.cycle}\n`);
  process.stdout.write(`Smoke : ${matrix.workflow.smokeGate}\n\n`);
}

matrix.contexts.forEach((ctx) => {
  process.stdout.write(`[${ctx.priority || '—'}] ${ctx.id} — ${ctx.label}\n`);
  process.stdout.write(`  Cible : ${ctx.capsuleTarget || '—'}\n`);
  (ctx.expectedLabels || []).forEach((label) => {
    process.stdout.write(`  ✓ ${label}\n`);
  });
  (ctx.vmExtraLabels || []).forEach((label) => {
    process.stdout.write(`  ○ ${label} (P2 / VM extra)\n`);
  });
  if (ctx.capsuleStatus) {
    process.stdout.write(`  Statut Capsule : ${ctx.capsuleStatus}\n`);
  }
  if (ctx.vmNote) {
    process.stdout.write(`  Note VM : ${ctx.vmNote}\n`);
  }
  if (ctx.vmExtraNote) {
    process.stdout.write(`  Note : ${ctx.vmExtraNote}\n`);
  }
  process.stdout.write('\n');
});

process.stdout.write('Gates :\n');
process.stdout.write('  CAPSULE_MINT_URL=… node usr/lib/capsuleos/tools/lab/smoke-mint-context-menus.mjs\n');
process.stdout.write('  node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write\n');
