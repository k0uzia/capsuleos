#!/usr/bin/env node
/**
 * Smoke statique — playbook interaction Paramètres GNOME.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
};

const playbook = read('root/tools/lab/vm-gnome-settings-interaction-playbook.sh');
const collector = read('usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-interaction.mjs');

const required = [
  'gsettings monitor',
  'interact_gsettings_control',
  'interact_nmcli_wifi',
  'monitorEvent',
  'restoredOk',
  'launch_panel',
];

for (const token of required) {
  if (!playbook.includes(token)) {
    errors.push(`interaction playbook : "${token}" absent`);
  }
}

if (!collector.includes('collect-vm-gnome-settings-interaction')) {
  errors.push('collecteur interaction absent');
}

const invPath = path.join(ROOT, 'root/docs/inventaires', 'linux-rocky-gnome-settings-interaction.json');
if (fs.existsSync(invPath)) {
  const data = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  if ((data.summary?.ok || 0) < 10) {
    errors.push(`inventaire interaction : seulement ${data.summary?.ok || 0} OK (attendu ≥ 10)`);
  }
}

if (errors.length) {
  console.error('smoke-gnome-settings-interaction-playbook — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-gnome-settings-interaction-playbook OK');
