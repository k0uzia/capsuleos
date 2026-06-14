#!/usr/bin/env node
/**
 * Valide scénarios pédagogiques Paramètres KDE (KdCred).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/kde-settings-user-scenarios.json');
const REGISTRY = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');

const errors = [];
if (!fs.existsSync(CONTRACT)) {
  errors.push('kde-settings-user-scenarios.json absent');
  process.exit(1);
}
const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const reg = fs.existsSync(REGISTRY) ? JSON.parse(fs.readFileSync(REGISTRY, 'utf8')) : { panels: [] };
const panelIds = new Set((reg.panels || []).map((p) => p.id));
const capsuleKeys = new Set();
(reg.panels || []).forEach((p) => (p.controls || []).forEach((c) => capsuleKeys.add(c.capsuleKey)));

for (const sc of contract.scenarios || []) {
  if (!sc.id || !sc.panelId) errors.push(`scénario sans id/panelId`);
  if (sc.panelId && panelIds.size && !panelIds.has(sc.panelId)) {
    errors.push(`${sc.id} : panelId ${sc.panelId} inconnu registry`);
  }
  for (const key of sc.controls || []) {
    if (capsuleKeys.size && !capsuleKeys.has(key)) {
      errors.push(`${sc.id} : capsuleKey ${key} absent registry`);
    }
  }
}

if (errors.length) {
  console.error('validate-kde-settings-user-scenarios — échec');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`✓ validate-kde-settings-user-scenarios OK — ${(contract.scenarios || []).length} scénarios P0`);
