#!/usr/bin/env node
/**
 * Génère le catalogue strict applications VM → CapsuleOS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-rocky --write
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildCatalog,
  pathsForApps,
  renderCatalogMarkdown,
} from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();

  if (opts.id === 'linux-mint') {
    const mintAlphabetique = spawnSync(process.execPath, [
      path.join(__dirname, 'generate-mint-apps-catalog.mjs'),
      ...(opts.write ? ['--write'] : []),
    ], { cwd: ROOT, stdio: 'inherit' });
    if (mintAlphabetique.status !== 0) process.exit(mintAlphabetique.status ?? 1);
  }

  const catalog = buildCatalog(opts.id);
  const paths = pathsForApps(opts.id);

  if (opts.write) {
    fs.writeFileSync(paths.appsCatalog, `${JSON.stringify(catalog, null, 2)}\n`);
    fs.writeFileSync(paths.appsCatalogMd, renderCatalogMarkdown(catalog));
    console.log(`✓ ${paths.appsCatalog.replace(`${ROOT}/`, '')}`);
    console.log(`✓ ${paths.appsCatalogMd.replace(`${ROOT}/`, '')}`);
    console.log(`  P0: ${catalog.summary.p0Ok}/${catalog.summary.p0Total} ok · gaps P1=${catalog.summary.p1Gaps} P2=${catalog.summary.p2Gaps}`);
    if (catalog.summary.nextGap) {
      console.log(`  prochain écart: ${catalog.summary.nextGap.labelFr} (${catalog.summary.nextGap.priorite})`);
    }
  } else {
    process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
  }
};

main();
