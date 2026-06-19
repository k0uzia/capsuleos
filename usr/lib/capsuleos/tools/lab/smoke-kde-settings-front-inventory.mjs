#!/usr/bin/env node
/**
 * Smoke KdF — inventaire front Paramètres KDE v15 (10 panneaux P0).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-kde-settings-front-inventory.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const errors = [];

const matrixPath = path.join(ROOT, 'root/tools/lab/kde-settings-visual-investigation-matrix.json');
const templateRel = 'usr/share/capsuleos/linux/apps/systemsettings_kde_neon.html';
const templatePath = path.join(ROOT, templateRel);

if (!fs.existsSync(matrixPath)) {
  errors.push('kde-settings-visual-investigation-matrix.json absent');
}
if (!fs.existsSync(templatePath)) {
  errors.push(`${templateRel} absent`);
}

const matrix = fs.existsSync(matrixPath)
  ? JSON.parse(fs.readFileSync(matrixPath, 'utf8'))
  : { investigations: [] };
const html = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf8') : '';
const p0 = (matrix.investigations || []).filter((i) => i.parityPriority === 'P0');

const requiredScripts = [
  'usr/lib/capsuleos/shells/linux/kde-settings-parity.js',
  'usr/lib/capsuleos/shells/linux/kde-systemsettings-nav.js',
  'usr/lib/capsuleos/shells/linux/kde-kconfig-store.js',
];
requiredScripts.forEach((rel) => {
  if (!fs.existsSync(path.join(ROOT, rel))) errors.push(`script absent: ${rel}`);
});

if (!html.includes('data-kde-settings-root')) {
  errors.push('gabarit : data-kde-settings-root absent');
}
if (!html.includes('data-kde-settings-surface="hub"')) {
  errors.push('gabarit : surface hub absente');
}

const shotMarkers = {
  'kcm-display-config': 'data-kde-settings-surface="kcm-display"',
  'hub-sidebar': 'data-kde-settings-surface="hub"',
  'appearance-panel': 'data-kde-settings-surface="kcm-lookandfeel"',
  'accessibility-panel': 'data-kde-settings-surface="kcm-access"',
  'desktop-panel': 'data-kde-settings-surface="kcm-plasma-style"',
  'workspace-panel': 'data-kde-panel-content="workspace"',
  'notifications-panel': 'data-kde-panel-content="notifications"',
  'applications-panel': 'data-kde-panel-content="applications"',
  'colors-panel': 'data-kde-settings-surface="kcm-colors"',
  'about-panel': 'data-kde-panel-content="about"',
};

p0.forEach((inv) => {
  const marker = shotMarkers[inv.controlId];
  if (marker && !html.includes(marker)) {
    errors.push(`shot ${inv.controlId} : marqueur « ${marker} » absent du gabarit`);
  }
});

const parityJs = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-settings-parity.js'), 'utf8');
const navJs = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-systemsettings-nav.js'), 'utf8');
if (!navJs.includes('prepareShot')) errors.push('kde-systemsettings-nav.js : prepareShot absent');
if (!parityJs.includes('EFFECT_HANDLERS')) errors.push('kde-settings-parity.js : EFFECT_HANDLERS absent');

const report = {
  registryId: registry,
  evaluatedAt: new Date().toISOString(),
  p0Shots: p0.length,
  ok: errors.length === 0,
  errors,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
