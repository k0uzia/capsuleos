#!/usr/bin/env node
/**
 * Rapport SlotMap / GapΔ avant campagne — comparer VM au dépôt (C8/C9).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id linux-fedora
 *   node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id linux-fedora --write
 *   node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id linux-fedora --json
 */
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildSlotGapDeltaReport,
  writeSlotGapDeltaReport,
} from './slot-gap-delta-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

const args = process.argv.slice(2);
let registryId = 'linux-fedora';
let write = false;
let jsonOnly = false;

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--id' && args[i + 1]) registryId = args[++i];
  else if (args[i] === '--write') write = true;
  else if (args[i] === '--json') jsonOnly = true;
}

let report;
if (write) {
  const out = writeSlotGapDeltaReport(registryId);
  report = out.report;
  if (!jsonOnly) {
    process.stdout.write(`✓ SlotMap/GapΔ — ${registryId}\n`);
    process.stdout.write(`  JSON : ${path.relative(ROOT, out.paths.json)}\n`);
    process.stdout.write(`  MD   : ${path.relative(ROOT, out.paths.md)}\n`);
    process.stdout.write(`  GapΔ vide : ${report.summary.gapDeltaEmpty}\n`);
    process.stdout.write(`  RealΣ P0 : ${report.summary.realSigmaP0} · registre ${report.summary.realSigmaRegistry ? 'OK' : 'KO'}\n`);
    if (out.materialization?.added?.length) {
      process.stdout.write(`  Gaps matérialisés : ${out.materialization.added.length}\n`);
    }
    process.stdout.write(`  Phases CR actives : ${report.campaignPhases.afterSkip.join(', ') || '—'}\n`);
    if (report.recommendations[0]) {
      process.stdout.write(`  → ${report.recommendations[0].action}\n`);
    }
  }
} else {
  report = buildSlotGapDeltaReport(registryId);
  if (!jsonOnly) {
    process.stdout.write(`=== SlotMap / GapΔ — ${registryId} ===\n`);
    process.stdout.write(`GapΔ vide: ${report.summary.gapDeltaEmpty}\n`);
    process.stdout.write(`ReuseΣ: ${report.summary.reuseEligible} · openGaps: ${report.summary.openGapsTotal} · p0Gaps: ${report.summary.p0CatalogGaps}\n`);
    process.stdout.write(`CR après skip: ${report.campaignPhases.afterSkip.join(', ') || '—'}\n`);
    if (report.recommendations.length) {
      process.stdout.write('\nRecommandations:\n');
      for (const r of report.recommendations.slice(0, 5)) {
        process.stdout.write(`  [${r.rule}] ${r.action}\n`);
        process.stdout.write(`    ${r.command}\n`);
      }
    }
  }
}

if (jsonOnly) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

process.exit(0);
