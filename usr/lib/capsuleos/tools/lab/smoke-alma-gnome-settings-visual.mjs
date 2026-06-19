#!/usr/bin/env node
/**
 * Smoke enquête visuelle Paramètres — Alma (V / Vc / Vp P0).
 * VM D-Bus screenshot indisponible : pas d'exigence vmCaptures (compensation Capsule).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathsForRegistry, countP0Documented, countP0CapsuleCaptures, countP0VisualMatchClassified } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-alma';
const errors = [];

const invPath = pathsForRegistry(REGISTRY).visualInvestigation;
if (!fs.existsSync(invPath)) {
  errors.push(`inventaire absent — collect-vm-gnome-settings-visual-investigation.mjs --id ${REGISTRY}`);
} else {
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const p0 = countP0Documented(inv);
  const vc = countP0CapsuleCaptures(inv);
  const vp = countP0VisualMatchClassified(inv);
  if (p0 < 4) errors.push(`P0 documentés : ${p0}/4 minimum (theme, night-light, dynamic-workspaces, dnd)`);
  if (vc < 4) errors.push(`Vc P0 : ${vc}/4 captures Capsule — collect-capsule-visual-investigation.mjs`);
  if (vp < 4) errors.push(`Vp P0 : ${vp}/4 classification(s) — enrich-visual-investigation-capsule-parity.mjs`);
  const p0Ids = ['theme', 'night-light', 'dynamic-workspaces', 'dnd'];
  for (const id of p0Ids) {
    const item = (inv.investigations || []).find((i) => i.controlId === id);
    if (!item?.capsuleCaptures?.length) {
      errors.push(`${id} : captures Capsule absentes`);
    }
  }
}

if (!fs.existsSync(path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix-alma.json'))) {
  errors.push('gnome-settings-visual-investigation-matrix-alma.json absent');
}

const capsuleDir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/alma/inventory/alma-capsule');
if (!fs.existsSync(capsuleDir)) {
  errors.push('inventaire alma-capsule absent — capture-capsule-alma.mjs');
}

if (errors.length) {
  console.error('smoke-alma-gnome-settings-visual — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
console.log(
  `✓ smoke-alma-gnome-settings-visual OK — P0 doc=${countP0Documented(inv)} `
  + `Vc=${countP0CapsuleCaptures(inv)} Vp=${countP0VisualMatchClassified(inv)}`,
);
