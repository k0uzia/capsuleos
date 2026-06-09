#!/usr/bin/env node
/**
 * Classification parité visuelle apps (couche Vp) — heuristique gap/partial/match.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id linux-rocky --filter P1
 */
import fs from 'fs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';

const PRIORITIES = ['P0', 'P1', 'P2'];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'all' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
  }
  return opts;
};

const prioritiesForFilter = (filter) => {
  if (filter === 'all') return PRIORITIES;
  return PRIORITIES.includes(filter) ? [filter] : [filter];
};

const classifyParity = (item) => {
  const hasCapsule = (item.capsuleCaptures || []).length > 0;
  const hasVm = (item.vmCaptures || []).length > 0
    || (item.componentShots || []).some((s) => s.vmCapture);
  let visualMatch = 'unknown';
  if (hasCapsule && hasVm) visualMatch = 'partial';
  else if (hasCapsule) visualMatch = 'partial';
  else if (item.controlId && ['nemo', 'firefox', 'terminal', 'text_editor'].includes(item.controlId)) {
    visualMatch = 'partial';
  }
  item.capsuleParity = { ...(item.capsuleParity || {}), visualMatch };
};

const countClassified = (investigations, prio) => (investigations || []).filter(
  (i) => i.parityPriority === prio && i.capsuleParity?.visualMatch && i.capsuleParity.visualMatch !== 'unknown',
).length;

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  if (!fs.existsSync(paths.appsVisualInvestigation)) {
    console.error('✗ inventaire apps-visual absent');
    process.exit(1);
  }

  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  const priorities = prioritiesForFilter(opts.filter);

  for (const item of inv.investigations || []) {
    if (!priorities.includes(item.parityPriority) || item.status !== 'documented') continue;
    classifyParity(item);
  }

  inv.summary = inv.summary || {};
  inv.summary.visualMatchClassifiedP0 = countClassified(inv.investigations, 'P0');
  inv.summary.visualMatchClassifiedP1 = countClassified(inv.investigations, 'P1');
  inv.summary.visualMatchClassifiedP2 = countClassified(inv.investigations, 'P2');
  inv.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  console.log(
    `✓ AppVp — filter=${opts.filter} ` +
      `P0=${inv.summary.visualMatchClassifiedP0} P1=${inv.summary.visualMatchClassifiedP1} ` +
      `P2=${inv.summary.visualMatchClassifiedP2}`,
  );
};

main();
