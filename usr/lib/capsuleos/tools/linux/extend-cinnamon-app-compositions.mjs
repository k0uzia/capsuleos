#!/usr/bin/env node
/**
 * Complète appCompositions dans ui-components-cinnamon.json depuis apps-catalog cinnamon.
 * Usage : node usr/lib/capsuleos/tools/linux/extend-cinnamon-app-compositions.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-cinnamon.json');
const APPS_CATALOG = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');
const SLOTS_MANIFEST = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');

const write = process.argv.includes('--write');

const XAPP_ONLY = new Set([
  'mintinstall',
  'update_manager',
  'mintdrivers',
  'mintwelcome',
  'warpinator',
  'timeshift',
  'transmission',
  'thunderbird',
  'simple_scan',
  'drawing',
  'mintstick',
  'mintbackup',
  'bulky',
  'sticky',
  'webapp_manager',
  'hypnotix',
]);

const MUFFIN_ONLY = new Set(['firefox', 'terminal', 'screenshot', 'profile', 'checklist', 'mainMenu']);

const ACQUISITION_ORDER = {
  text_editor: ['toolbar', 'editor-pane'],
  calculator: ['display', 'keypad'],
  calendar: ['month-grid', 'sidebar'],
  file_roller: ['toolbar', 'archive-list'],
  libreoffice_startcenter: ['startcenter-tiles'],
  librewriter: ['menubar', 'document-canvas'],
  librecalc: ['menubar', 'spreadsheet-grid'],
  libreoffice_impress: ['menubar', 'slide-canvas'],
  libreoffice_draw: ['menubar', 'draw-canvas'],
  lecteur_multimedia: ['transport', 'video-surface'],
  system_monitor: ['process-list', 'resource-graphs'],
  rhythmbox: ['library', 'now-playing'],
  warpinator: ['peer-list', 'transfer-queue'],
  timeshift: ['snapshots', 'restore-actions'],
  mintdrivers: ['driver-list', 'actions'],
  mintwelcome: ['welcome-slides'],
};

function resolveComponents(slotId) {
  if (MUFFIN_ONLY.has(slotId)) {
    if (slotId === 'mainMenu') {
      return ['cinnamon.menu-popup'];
    }
    return ['cinnamon.muffin-window'];
  }
  if (XAPP_ONLY.has(slotId)) {
    return ['cinnamon.xapp-window'];
  }
  if (slotId === 'nemo') {
    return ['cinnamon.muffin-window', 'cinnamon.nemo-explorer'];
  }
  if (slotId === 'visionneur_images') {
    return ['cinnamon.muffin-window', 'cinnamon.xviewer-app'];
  }
  if (slotId === 'visionneur_pdf') {
    return ['cinnamon.muffin-window', 'cinnamon.xreader-app'];
  }
  if (slotId === 'themes') {
    return ['cinnamon.muffin-window', 'cinnamon.settings-panels'];
  }
  return ['cinnamon.muffin-window', 'cinnamon.xapp-window'];
}

function buildComposition(slotId, spec, labelFr) {
  const templateFile = spec.template || `${slotId}.html`;
  const stem = templateFile.replace(/\.html$/i, '');
  const composition = {
    labelFr: labelFr || slotId,
    planned: true,
    components: resolveComponents(slotId),
    chromeProvider: spec.chromeProvider || 'cinnamon',
    acquisitionOrder: ACQUISITION_ORDER[slotId] || ['window-chrome', 'main-content'],
  };
  if (slotId !== 'mainMenu') {
    composition.template = `usr/share/capsuleos/linux/apps/${templateFile}`;
    composition.baseCss = `usr/share/capsuleos/linux/apps/style/${stem}.base.css`;
    composition.skinCss = spec.skinCss || `${slotId}.skin.css`;
  } else {
    composition.shellSurface = true;
    composition.baseCss = 'usr/share/capsuleos/linux/apps/style/mainMenu.base.css';
    composition.skinCss = 'mainMenu.skin.css';
    composition.acquisitionOrder = ['grid', 'favorites', 'search'];
  }
  return composition;
}

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(APPS_CATALOG, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(SLOTS_MANIFEST, 'utf8'));
const slotSpecs = catalog.toolkits.cinnamon.slotSpecs;
const labels = Object.fromEntries(
  Object.entries(manifest.slots || {}).map(([id, s]) => [id, s.labelFr]),
);
const aboutis = manifest.mintSlotsAboutis || [];

let added = 0;
for (const slotId of aboutis) {
  const spec = slotSpecs[slotId];
  if (!spec) {
    console.warn(`○ slotSpecs manquant pour ${slotId}`);
    continue;
  }
  if (contract.appCompositions[slotId]) {
    continue;
  }
  const labelFr = labels[slotId]
    || (slotId === 'mintwelcome' ? 'Bienvenue Linux Mint' : slotId);
  contract.appCompositions[slotId] = buildComposition(slotId, spec, labelFr);
  added += 1;
}

if (!write) {
  console.log(`○ extend-cinnamon-app-compositions — ${added} composition(s) à ajouter (--write)`);
  process.exit(0);
}

fs.writeFileSync(CONTRACT, `${JSON.stringify(contract, null, 2)}\n`);
console.log(`✓ extend-cinnamon-app-compositions — ${added} composition(s) écrites`);
