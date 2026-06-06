#!/usr/bin/env node
/**
 * Smoke matrice enquête visuelle Paramètres GNOME.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gnome-settings-visual-matrix.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const parityMatrix = JSON.parse(read('root/tools/lab/gnome-settings-parity-matrix.json') || '{}');
const visualMatrix = JSON.parse(read('root/tools/lab/gnome-settings-visual-investigation-matrix.json') || '{}');
const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const themeStorageJs = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const themesJs = read('usr/lib/capsuleos/shells/linux/themes.js');
const shellJs = [
  parityJs,
  themeStorageJs,
  themesJs,
  read('usr/lib/capsuleos/shells/linux/gnome-workspaces.js'),
  read('usr/lib/capsuleos/shells/linux/overview.js'),
].join('\n');
const prefsCss = read('usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');
const procedure = read('root/docs/procedure-creation-playbook-gnome-settings.md');

if (!visualMatrix.investigations?.length) {
  errors.push('gnome-settings-visual-investigation-matrix.json : investigations vide');
}

if (!procedure.includes('Enquête visuelle')) {
  errors.push('procedure : section enquête visuelle absente');
}

const parityControlIds = new Set();
for (const panel of parityMatrix.panels || []) {
  for (const ctrl of panel.controls || []) {
    parityControlIds.add(ctrl.id);
  }
}

const handlerIds = new Set();
const handlerRe = /^\s{8}(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*\{/gm;
for (const blockName of ['SWITCH_HANDLERS', 'SELECT_HANDLERS', 'SLIDER_HANDLERS']) {
  const block = parityJs.match(new RegExp(`const ${blockName} = \\{([\\s\\S]*?)\\n    \\};`));
  if (!block) continue;
  let m;
  while ((m = handlerRe.exec(block[1])) !== null) {
    handlerIds.add(m[1] || m[2]);
  }
}

const specialHandlers = new Set(['theme', 'accent', 'wallpaper', 'contrast', 'font-scale']);

function datasetToHtmlAttr(name) {
  return String(name).replace(/([A-Z])/g, '-$1').toLowerCase();
}

for (const inv of visualMatrix.investigations || []) {
  if (!inv.controlId) {
    errors.push('investigation sans controlId');
    continue;
  }
  if (!parityControlIds.has(inv.controlId)) {
    errors.push(`investigation "${inv.controlId}" absent de gnome-settings-parity-matrix.json`);
  }
  const hasHandler = handlerIds.has(inv.controlId) || specialHandlers.has(inv.controlId);
  if (!hasHandler) {
    errors.push(`investigation "${inv.controlId}" sans handler parity`);
  }
  if (!inv.officialDocs?.length) {
    errors.push(`investigation "${inv.controlId}" : officialDocs vide`);
  }
  if (!inv.capsuleHook?.dataset && !inv.capsuleHook?.css && !inv.capsuleHook?.js) {
    errors.push(`investigation "${inv.controlId}" : capsuleHook incomplet`);
  }
  const dataset = inv.capsuleHook?.dataset;
  if (dataset) {
    const camel = dataset.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const patterns = [
      `dataset.${dataset}`,
      `dataset.${camel}`,
      `data-${dataset}`,
      `[data-${dataset}=`,
    ];
    const inShell = patterns.some((p) => shellJs.includes(p));
    const htmlAttr = datasetToHtmlAttr(dataset);
    const inCss = prefsCss.includes(`data-${htmlAttr}`) || (inv.capsuleHook.selector && prefsCss.includes(inv.capsuleHook.selector));
    if (!inShell && !inCss && !specialHandlers.has(inv.controlId)) {
      errors.push(`investigation "${inv.controlId}" : dataset "${dataset}" non trouvé dans parity/css`);
    }
  }
  if (!inv.investigationSteps?.length) {
    errors.push(`investigation "${inv.controlId}" : investigationSteps vide`);
  }
}

const templatePath = 'root/docs/inventaires/_template-gnome-settings-visual-investigation.json';
if (!read(templatePath).includes('gsettingsDeferred')) {
  errors.push('template inventaire visuel : champs gsettingsDeferred absents');
}

if (errors.length) {
  console.error('smoke-gnome-settings-visual-matrix — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ smoke-gnome-settings-visual-matrix OK (${visualMatrix.investigations.length} enquêtes)`);
