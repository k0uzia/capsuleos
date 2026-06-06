#!/usr/bin/env node
/**
 * Collecte / fusion inventaire fidélité visuelle.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-visual-fidelity-inventory.mjs --id linux-rocky --write
 *   node usr/lib/capsuleos/tools/lab/collect-visual-fidelity-inventory.mjs --id linux-rocky --write --ssh
 */
import fs from 'fs';
import {
  buildVisualFidelityInventory,
  collectA11yViaSsh,
  collectMimeViaSsh,
  collectTypographyFontsViaSsh,
  recomputePredicates,
  visualFidelityPath,
} from './visual-fidelity-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', write: false, ssh: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--ssh') opts.ssh = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const existing = fs.existsSync(visualFidelityPath(opts.id))
    ? JSON.parse(fs.readFileSync(visualFidelityPath(opts.id), 'utf8'))
    : null;
  const built = buildVisualFidelityInventory(opts.id);

  let merged = existing ? {
    ...existing,
    ...built,
    typography: { ...built.typography, ...existing.typography, vm: { ...built.typography.vm, ...existing.typography?.vm } },
    mime: { ...built.mime, ...existing.mime },
    accessibility: { ...built.accessibility, ...existing.accessibility },
    updatedAt: new Date().toISOString(),
  } : built;

  if (opts.ssh) {
    merged.mime = { ...merged.mime, ...collectMimeViaSsh(opts.id) };
    const a11y = collectA11yViaSsh(opts.id);
    merged.accessibility = {
      ...merged.accessibility,
      vmGsettings: a11y.vmGsettings,
      collectedFrom: a11y.collectedFrom,
      status: 'documented',
    };
    merged.typography = {
      ...merged.typography,
      fontEmbedding: collectTypographyFontsViaSsh(opts.id),
    };
    merged.typography.status = 'documented';
  }

  merged = recomputePredicates(merged);

  if (opts.write) {
    fs.writeFileSync(visualFidelityPath(opts.id), `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`✓ ${visualFidelityPath(opts.id).replace(`${ROOT}/`, '')}`);
    console.log(`  Tf=${merged.predicates.Tf} Tp=${merged.predicates.Tp} Tv=${merged.predicates.Tv} Tm=${merged.predicates.Tm} Ta=${merged.predicates.Ta}`);
  } else {
    process.stdout.write(`${JSON.stringify(merged, null, 2)}\n`);
  }
};

main();
