#!/usr/bin/env node
/**
 * Checklist libellés menus contextuels Cinnamon Mint — matrice context-menus.json.
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
const contexts = matrix.contexts || [];

process.stdout.write(`\n=== Mint context menus (${matrix.registryId}) ===\n`);
contexts.forEach((ctx) => {
  const status = ctx.capsuleStatus || (ctx.capsuleTarget ? 'implemented' : 'planned');
  const labels = (ctx.expectedLabels || []).join(' · ');
  process.stdout.write(`[${ctx.priority}] ${ctx.id} (${status})\n`);
  process.stdout.write(`  ${labels}\n`);
  if (ctx.capsuleTarget) {
    process.stdout.write(`  → ${ctx.capsuleTarget}${ctx.capsuleSelector ? ` ${ctx.capsuleSelector}` : ''}\n`);
  }
  if (ctx.vmExtraLabels?.length) {
    process.stdout.write(`  P2 VM extra: ${ctx.vmExtraLabels.join(' · ')}\n`);
  }
});

const planned = contexts.filter((c) => c.capsuleStatus === 'planned' || !c.capsuleTarget);
process.stdout.write(`\nPlanned / absent: ${planned.length ? planned.map((c) => c.id).join(', ') : 'none'}\n`);
