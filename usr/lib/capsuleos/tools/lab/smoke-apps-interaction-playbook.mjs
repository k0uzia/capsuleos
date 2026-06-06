#!/usr/bin/env node
/**
 * Smoke statique — playbook interaction / enquête visuelle applications (miroir interaction-playbook gsettings).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-apps-interaction-playbook.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog } from './apps-catalog-lib.mjs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  const playbook = read('root/tools/lab/vm-apps-visual-playbook.sh');
  const collector = read('usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs');
  const matrix = read('root/tools/lab/apps-visual-investigation-matrix.json');

  const required = [
    'CAPSULE_APPS_VISUAL_OUT',
    'launch_app_slot',
    'capture_app_window',
    'CAPSULE_APPS_VISUAL_MATRIX',
  ];

  for (const token of required) {
    if (!playbook.includes(token)) {
      errors.push(`apps visual playbook : "${token}" absent`);
    }
  }

  if (!collector.includes('collect-vm-apps-visual-investigation')) {
    errors.push('collecteur apps-visual absent');
  }

  if (!matrix.includes('"controlId"')) {
    errors.push('apps-visual-investigation-matrix.json : controlId absent');
  }

  const catalog = buildCatalog(opts.id);
  const p0 = catalog.rows.filter((r) => r.priorite === 'P0' && r.statut === 'ok' && r.slotCapsule);
  if (p0.length < 5) {
    errors.push(`catalogue P0 ok : seulement ${p0.length} (attendu ≥ 5)`);
  }

  if (fs.existsSync(paths.appsVisualInvestigation)) {
    const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
    if ((inv.summary?.documentedP0 || 0) < 1) {
      errors.push('inventaire apps-visual : documentedP0 = 0 — lancer collect-vm-apps-visual-investigation');
    }
  } else {
    errors.push('inventaire apps-visual absent');
  }

  if (errors.length) {
    console.error(`smoke-apps-interaction-playbook ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-apps-interaction-playbook ${opts.id} OK — ${p0.length} slot(s) P0`);
};

main();
