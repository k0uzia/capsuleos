#!/usr/bin/env node
/**
 * Audit structurel registryOverrides + catalogue (évite throw buildCatalog).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-popos
 *   node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-mint  # skip cinnamon documenté
 */
import { buildCatalog, loadAppsContract } from './apps-catalog-lib.mjs';
import { loadRegistryEntry } from './replication-chain-lib.mjs';

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
  const entry = loadRegistryEntry(opts.id);
  const toolkit = entry.toolkit?.id || 'gnome';
  const contract = loadAppsContract();
  const override = contract.registryOverrides?.[opts.id];

  if (!override) {
    console.error(`✗ ${opts.id} — registryOverrides manquant`);
    process.exit(1);
  }

  if (toolkit === 'cinnamon') {
    const count = Object.keys(override.apps || {}).length;
    console.log(`⊘ ${opts.id} — toolkit cinnamon : audit overview GNOME ignoré (${count} apps contrat)`);
    process.exit(0);
  }

  if (toolkit === 'kde') {
    const count = Object.keys(override.apps || {}).length;
    const p0 = Object.values(override.apps || {}).filter((a) => a.priorite === 'P0').length;
    console.log(`✓ ${opts.id} — KDE registryOverrides présent (${count} apps, ${p0} P0) — pas d'overview GNOME`);
    process.exit(0);
  }

  let catalog;
  try {
    catalog = buildCatalog(opts.id);
  } catch (err) {
    console.error(`✗ ${opts.id} — buildCatalog: ${err.message}`);
    process.exit(1);
  }

  const p0Gaps = catalog.summary?.p0Gaps ?? '?';
  const rows = catalog.summary?.catalogRows ?? catalog.rows?.length ?? 0;
  console.log(`✓ ${opts.id} — catalogue ${rows} lignes · P0 gaps=${p0Gaps} · toolkit=${catalog.toolkit}`);

  if (p0Gaps > 0 && catalog.summary?.nextGap) {
    console.log(`  prochain écart: ${catalog.summary.nextGap.labelFr} (${catalog.summary.nextGap.statut})`);
  }

  process.exit(p0Gaps === 0 ? 0 : 0);
};

main();
