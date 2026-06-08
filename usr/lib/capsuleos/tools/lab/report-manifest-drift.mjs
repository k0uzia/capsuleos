#!/usr/bin/env node
/**
 * Rapport ManΣ — dérive playbook manifest (drift / pull / skip).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/report-manifest-drift.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/report-manifest-drift.mjs --id linux-mint --write
 *   node usr/lib/capsuleos/tools/lab/report-manifest-drift.mjs --id linux-mint --json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPlaybook, writePlaybook } from './manifest-playbook-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', write: false, json: false, top: 12 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--top' && args[i + 1]) opts.top = parseInt(args[++i], 10);
  }
  return opts;
};

const countBy = (items, key) => {
  const map = {};
  items.forEach((item) => {
    const k = item[key] || 'unknown';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
};

const main = () => {
  const opts = parseArgs();
  const playbook = buildPlaybook(opts.id);

  if (opts.write) {
    writePlaybook(opts.id, playbook);
  }

  const driftItems = playbook.items.filter((i) => i.action === 'rewrite-ref');
  const pullItems = playbook.items.filter((i) => i.action === 'pull');

  const report = {
    registryId: opts.id,
    generatedAt: playbook.generatedAt,
    summary: playbook.summary,
    driftByCategory: countBy(driftItems, 'category'),
    pullByCategory: countBy(pullItems, 'category'),
    sampleDrift: driftItems.slice(0, opts.top).map((i) => ({
      id: i.id,
      category: i.category,
      capsuleRelative: i.capsuleRelative,
    })),
  };

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  console.log(`ManΣ drift — ${opts.id}`);
  console.log(`  total=${playbook.summary.total} pull=${playbook.summary.pull} drift=${playbook.summary.drift} skip=${playbook.summary.skip}`);
  if (driftItems.length) {
    console.log('  drift par catégorie:');
    report.driftByCategory.forEach(([cat, n]) => console.log(`    ${cat}: ${n}`));
    console.log(`  échantillon drift (${Math.min(opts.top, driftItems.length)}/${driftItems.length}):`);
    report.sampleDrift.forEach((s) => console.log(`    - ${s.id} → ${s.capsuleRelative}`));
  }
  if (opts.write) {
    console.log(`  playbook régénéré (proc/${opts.id}/)`);
  } else {
    console.log('  tip: --write pour persister le playbook');
  }
};

main();
