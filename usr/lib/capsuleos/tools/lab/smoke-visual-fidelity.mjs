#!/usr/bin/env node
/**
 * Gate fidélité visuelle — typographie, a11y imports, inventaire.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-visual-fidelity.mjs --id linux-rocky
 */
import fs from 'fs';
import {
  evaluateVisualFidelity,
  scanTypographyViolations,
  visualFidelityPath,
} from './visual-fidelity-lib.mjs';
import { validateOsFacadeFidelity } from '../linux/os-facade-fidelity-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const errors = [];

  if (!fs.existsSync(visualFidelityPath(opts.id))) {
    errors.push(`inventaire absent — collect-visual-fidelity-inventory.mjs --id ${opts.id} --write`);
  }

  errors.push(...scanTypographyViolations(opts.id));
  errors.push(...validateOsFacadeFidelity(opts.id));

  const preds = evaluateVisualFidelity(opts.id);
  const inv = preds.inventory;
  if (!preds.Tp) errors.push('Tp : typographie non documentée');
  if (!preds.Tv) errors.push('Tv : contextes de vue non documentés');
  if (!preds.Tm) {
    const mimeStatus = inv?.mime?.status || 'absent';
    const handlers = (inv?.mime?.defaultHandlers || []).filter((h) => h.vmDefault).length;
    errors.push(`Tm : MIME non documenté (status=${mimeStatus}, handlers VM=${handlers}) — collect --ssh`);
  }
  if (!preds.Ta) errors.push('Ta : accessibilité non documentée');

  if (errors.length) {
    console.error(`smoke-visual-fidelity ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-visual-fidelity ${opts.id} OK — Tp=${preds.Tp} Tv=${preds.Tv} Tm=${preds.Tm} Ta=${preds.Ta} Tf=${preds.Tf}`);
};

main();
