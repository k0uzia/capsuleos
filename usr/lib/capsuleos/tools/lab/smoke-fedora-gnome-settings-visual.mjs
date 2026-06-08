#!/usr/bin/env node
/**
 * Smoke enquête visuelle Paramètres — Fedora (V / Vc / Vp P0).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathsForRegistry, countP0Documented, countP0CapsuleCaptures, countP0VisualMatchClassified } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-fedora';
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
  if (vc < 1) errors.push(`Vc P0 : ${vc} capture(s) Capsule — collect-capsule-visual-investigation.mjs`);
  if (vp < 1) errors.push(`Vp P0 : ${vp} classification(s) — enrich-visual-investigation-capsule-parity.mjs`);
  const theme = (inv.investigations || []).find((i) => i.controlId === 'theme');
  if (!theme?.vmCaptures?.length) errors.push('theme : captures VM absentes');
  if (!theme?.capsuleCaptures?.length) errors.push('theme : captures Capsule absentes');
}

if (!fs.existsSync(path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix-fedora.json'))) {
  errors.push('gnome-settings-visual-investigation-matrix-fedora.json absent');
}

if (errors.length) {
  console.error('smoke-fedora-gnome-settings-visual — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
console.log(
  `✓ smoke-fedora-gnome-settings-visual OK — P0 doc=${countP0Documented(inv)} `
  + `Vc=${countP0CapsuleCaptures(inv)} Vp=${countP0VisualMatchClassified(inv)}`,
);
