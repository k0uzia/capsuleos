#!/usr/bin/env node
/**
 * Collecte enquête visuelle apps VM (couche 3) — squelette aligné gsettings V.
 * Étend l'inventaire *-apps-visual-investigation.json (statut documented + captures VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --filter P0
 */
import fs from 'fs';
import { buildCatalog } from './apps-catalog-lib.mjs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'P0', write: true };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--dry-run') opts.write = false;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  const catalog = buildCatalog(opts.id);
  const existing = fs.existsSync(paths.appsVisualInvestigation)
    ? JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'))
    : null;

  const investigations = (existing?.investigations || catalog.rows
    .filter((r) => r.onVm !== false && r.slotCapsule && r.statut === 'ok')
    .map((r) => ({
      controlId: r.slotCapsule,
      labelFr: r.labelFr,
      vmId: r.vmId,
      parityPriority: r.priorite,
      status: 'pending',
      vmCaptures: [],
      capsuleCaptures: [],
      capsuleParity: { visualMatch: 'unknown' },
    })));

  if (opts.filter) {
    for (const inv of investigations) {
      if (inv.parityPriority === opts.filter && inv.status === 'pending') {
        inv.status = 'documented';
        inv.note = 'Marqué documented — captures VM à collecter (vm-apps-visual-playbook.sh)';
      }
    }
  }

  const documentedP0 = investigations.filter((i) => i.parityPriority === 'P0' && i.status === 'documented').length;

  const out = {
    version: 1,
    registryId: opts.id,
    updatedAt: new Date().toISOString(),
    procedure: 'procedure-apps-replication-formelle.md',
    summary: {
      documentedP0,
      capsuleCapturesP0: investigations.filter((i) => i.parityPriority === 'P0' && (i.capsuleCaptures || []).length).length,
      visualMatchClassifiedP0: investigations.filter((i) => i.parityPriority === 'P0' && i.capsuleParity?.visualMatch !== 'unknown').length,
    },
    investigations,
  };

  if (opts.write) {
    fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`✓ ${paths.appsVisualInvestigation.replace(/.*\/root\//, 'root/')} — documentedP0=${documentedP0}`);
  } else {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  }
};

main();
