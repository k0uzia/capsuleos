#!/usr/bin/env node
/**
 * Étend la matrice VΣ Mint — discoveredApps depuis catalogue 101/101.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --id linux-mint --write
 */
import {
  extendMatrixFromCatalog,
  writeMatrix,
  validateMatrixReport,
} from './ui-state-effects-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const matrix = extendMatrixFromCatalog(opts.id);
  const report = validateMatrixReport(opts.id, matrix);

  if (opts.write) {
    const out = writeMatrix(opts.id, matrix);
    process.stdout.write(`OK ${out}\n`);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

main();
