#!/usr/bin/env node
/**
 * Synchronise kde-settings-parity-matrix.json depuis kde-settings-controls-registry.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/sync-kde-settings-parity-matrix.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
const MATRIX = path.join(ROOT, 'root/tools/lab/kde-settings-parity-matrix.json');

const write = process.argv.includes('--write');

const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const panels = (reg.panels || []).map((panel) => ({
  id: panel.id,
  label: panel.label,
  kcmId: panel.kcmId,
  kcmKeyword: panel.kcmKeyword,
  priority: panel.priority || 'P0',
  surface: panel.surface || 'hub',
  template: panel.template || 'systemsettings_kde_neon.html',
  vmLaunch: panel.vmLaunch,
  controls: panel.controls || [],
  effects: (panel.controls || [])
    .filter((c) => c.priority === 'P0' && c.capsuleKey && c.event)
    .map((c) => ({
      capsuleKey: c.capsuleKey,
      layer: c.layer,
      event: c.event,
      controlId: c.id,
      type: c.type,
    })),
}));

const matrix = {
  version: 4,
  description: 'Matrice System Settings KDE ↔ CapsuleOS — générée depuis kde-settings-controls-registry.json (v15).',
  status: 'v15-kde-settings-full-front',
  registryId: reg.registryId || 'linux-kde-neon',
  controlsRegistry: 'root/tools/lab/kde-settings-controls-registry.json',
  vm: {
    registryId: reg.registryId || 'linux-kde-neon',
    collectedAt: reg.interactionCollectedAt || new Date().toISOString(),
  },
  panels,
};

if (write) {
  fs.writeFileSync(MATRIX, `${JSON.stringify(matrix, null, 2)}\n`);
  const p0Effects = panels.reduce((n, p) => n + p.effects.length, 0);
  console.log(`✓ ${path.relative(ROOT, MATRIX)} — ${panels.length} panneaux, ${p0Effects} effets P0`);
} else {
  process.stdout.write(`${JSON.stringify(matrix, null, 2)}\n`);
}
