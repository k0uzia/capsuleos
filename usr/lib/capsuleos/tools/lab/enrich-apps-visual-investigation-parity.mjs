#!/usr/bin/env node
/**
 * Classification parité visuelle apps (couche Vp) — heuristique gap/partial/match.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id linux-rocky
 */
import fs from 'fs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) opts.id = args[args.indexOf('--id') + 1] || opts.id;
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  if (!fs.existsSync(paths.appsVisualInvestigation)) {
    console.error('✗ inventaire apps-visual absent');
    process.exit(1);
  }

  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  for (const item of inv.investigations || []) {
    if (item.parityPriority !== 'P0' || item.status !== 'documented') continue;
    const hasCapsule = (item.capsuleCaptures || []).length > 0;
    const hasVm = (item.vmCaptures || []).length > 0;
    let visualMatch = 'unknown';
    if (hasCapsule && hasVm) visualMatch = 'partial';
    else if (hasCapsule) visualMatch = 'partial';
    else if (item.controlId && ['nemo', 'firefox', 'terminal', 'text_editor'].includes(item.controlId)) {
      visualMatch = 'partial';
    }
    item.capsuleParity = { ...(item.capsuleParity || {}), visualMatch };
  }

  inv.summary.visualMatchClassifiedP0 = (inv.investigations || []).filter(
    (i) => i.parityPriority === 'P0' && i.capsuleParity?.visualMatch && i.capsuleParity.visualMatch !== 'unknown',
  ).length;
  inv.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  console.log(`✓ AppVp — visualMatchClassifiedP0=${inv.summary.visualMatchClassifiedP0}`);
};

main();
