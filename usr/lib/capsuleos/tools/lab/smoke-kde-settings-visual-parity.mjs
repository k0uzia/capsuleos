#!/usr/bin/env node
/**
 * Smoke KdV optionnel — structure shots P0 + contentGaps documentés (v15).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-kde-settings-visual-parity.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const allowGaps = process.argv.includes('--allow-gaps');

const matrixPath = path.join(ROOT, 'root/tools/lab/kde-settings-visual-investigation-matrix.json');
const statePath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-replication-state.json');
const cssPath = path.join(ROOT, 'usr/share/capsuleos/linux/apps/style/systemsettings_kde.base.css');

const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const css = fs.readFileSync(cssPath, 'utf8');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};

const residual = state.metrics?.kdV?.residualShots || [
  'colors-panel',
  'appearance-panel',
  'hub-sidebar',
  'desktop-panel',
];

const themePreviewDir = path.join(
  ROOT,
  'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/theme-previews'
);
const previewAssetsMissing = !fs.existsSync(themePreviewDir)
  || !fs.existsSync(path.join(path.dirname(themePreviewDir), 'SOURCE-VM.txt'));

const structuralChecks = {
  'colors-panel': ['data-kde-settings-surface="kcm-themes"', 'data-kde-setting="kde-accent-color"'],
  'appearance-panel': ['data-kde-settings-surface="kcm-themes"', 'data-kde-setting="kde-global-theme"'],
  'hub-sidebar': ['data-kde-settings-surface="hub"', 'kde-systemsettings__nav--native'],
  'desktop-panel': ['data-kde-settings-surface="kcm-themes"', 'data-kde-panel-content="plasma-style"'],
};

const errors = [];
const contentGaps = [];

if (previewAssetsMissing) {
  contentGaps.push({
    id: 'theme-preview-assets',
    reason: '¬A — usr/share/capsuleos/assets/images/vendors/neon/systemsettings/theme-previews/ absent ou SOURCE-VM.txt invalide',
    remediation: 'bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh',
    blocksPhi: true,
  });
}

residual.forEach((shotId) => {
  const markers = structuralChecks[shotId] || [];
  const template = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/systemsettings_kde_neon.html'),
    'utf8'
  );
  markers.forEach((marker) => {
    if (!template.includes(marker)) {
      errors.push(`${shotId} : marqueur structurel « ${marker} » absent`);
    }
  });
  if (previewAssetsMissing && ['colors-panel', 'appearance-panel', 'desktop-panel'].includes(shotId)) {
    contentGaps.push({
      id: shotId,
      reason: 'Prévisualisations thème VM non importées — CSS référence theme-previews/*.png',
      phiEstimate: '< 90',
      documented: true,
    });
  }
});

const phiThreshold = matrix.phiThreshold || 90;
const report = {
  registryId: registry,
  evaluatedAt: new Date().toISOString(),
  phiThreshold,
  residualShots: residual,
  structuralOk: errors.length === 0,
  contentGaps,
  optionalGate: true,
  cssThemePreviewRefs: (css.match(/theme-previews\//g) || []).length,
};

if (errors.length) {
  console.error('✗ smoke-kde-settings-visual-parity — structure\n');
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

if (contentGaps.length && !allowGaps) {
  console.log(JSON.stringify({ ...report, status: 'partial-documented' }, null, 2));
  console.log('✓ smoke-kde-settings-visual-parity OK — contentGaps documentés (gate optionnelle)');
  process.exit(0);
}

console.log(JSON.stringify({ ...report, status: 'ok' }, null, 2));
console.log('✓ smoke-kde-settings-visual-parity OK');
process.exit(0);
