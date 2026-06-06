#!/usr/bin/env node
/**
 * Gate catalogue applications — cohérence slots, P0, specs.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-rocky
 */
import fs from 'fs';
import {
  buildCatalog,
  pathsForApps,
  validateCatalogStrict,
  evaluateAppsPredicates,
} from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', strictP0: true };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--allow-p0-gaps') opts.strictP0 = false;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const paths = pathsForApps(opts.id);

  if (!fs.existsSync(paths.appsCatalog)) {
    console.error(`✗ catalogue absent — generate-apps-catalog.mjs --id ${opts.id} --write`);
    process.exit(1);
  }

  const onDisk = JSON.parse(fs.readFileSync(paths.appsCatalog, 'utf8'));
  const fresh = buildCatalog(opts.id);
  const errors = validateCatalogStrict(fresh);

  if (opts.strictP0 && fresh.summary.p0Gaps > 0) {
    errors.push(`AppP0: ${fresh.summary.p0Gaps} app(s) P0 non ok`);
  }

  const diskRows = onDisk.rows?.length || 0;
  if (diskRows !== fresh.rows.length) {
    errors.push(`catalogue périmé (${diskRows} vs ${fresh.rows.length} lignes) — regénérer --write`);
  }

  if (errors.length) {
    console.error(`smoke-apps-catalog ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    if (fresh.summary.nextGap) {
      console.error(`  → prochain: ${fresh.summary.nextGap.labelFr}`);
    }
    process.exit(1);
  }

  const preds = evaluateAppsPredicates(opts.id);
  console.log(`✓ smoke-apps-catalog ${opts.id} OK — AppV=${preds.AppV} AppC=${preds.AppC} AppP0=${preds.AppP0} AppΣ=${preds.AppΣ}`);
};

main();
