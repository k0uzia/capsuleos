#!/usr/bin/env node
/** Contrat scénarios GNOME System Monitor — structure + handlers kernel. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/system-monitor-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/system-monitor.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/system_monitor.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-system-monitor-scenarios.mjs');
const errors = [];

if (!fs.existsSync(CONTRACT)) errors.push('system-monitor-user-scenarios.json manquant');
else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) errors.push('au moins 4 scénarios P0 attendus');
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
['syncGsmDataset', 'data-gsm-gnome-tab', 'dataset.gsmActiveTab', 'dataset.gsmInit'].forEach((needle) => {
  if (!kernelText.includes(needle)) errors.push(`system-monitor.js : attendu « ${needle} »`);
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
if (!templateText.includes('data-gsm-gnome-tab="processes"')) errors.push('system_monitor.html : onglet processus manquant');
if (!fs.existsSync(SMOKE)) errors.push('smoke-gnome-system-monitor-scenarios.mjs manquant');

if (errors.length) {
  console.error(`✗ validate-system-monitor-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}
console.log('✓ validate-system-monitor-user-scenarios OK');
process.exit(0);
