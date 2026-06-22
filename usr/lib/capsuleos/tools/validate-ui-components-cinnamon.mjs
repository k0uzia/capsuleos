#!/usr/bin/env node
/**
 * Valide le catalogue composants Cinnamon et sa cohérence avec apps-catalog slotSpecs.
 * Mode skeleton : P0 obligatoire dans appCompositions ; alignement template/chromeProvider.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-ui-components-cinnamon.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-cinnamon.json');
const APPS_CATALOG = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');
const SLOTS_MANIFEST = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');

/** Slots P0 shell Mint — doivent avoir une composition N2 tant que status=skeleton. */
const P0_COMPOSITION_SLOTS = [
  'mainMenu',
  'nemo',
  'firefox',
  'terminal',
  'themes',
  'update_manager',
  'mintinstall',
  'visionneur_images',
  'visionneur_pdf',
];

const errors = [];

function expectFile(rel, label) {
  if (!rel) {
    return;
  }
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`${label} introuvable : ${rel}`);
  }
}

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const appsCatalog = JSON.parse(fs.readFileSync(APPS_CATALOG, 'utf8'));
const slotsManifest = JSON.parse(fs.readFileSync(SLOTS_MANIFEST, 'utf8'));

const componentIds = new Set(Object.keys(contract.components || {}));
const compositions = contract.appCompositions || {};
const slotSpecs = appsCatalog.toolkits?.cinnamon?.slotSpecs || {};
const isSkeleton = contract.status === 'skeleton';

for (const rel of contract.levels?.N0?.paths || []) {
  expectFile(rel, 'N0 token');
}

for (const [id, comp] of Object.entries(contract.components || {})) {
  for (const rel of comp.capsuleCss || []) {
    expectFile(rel, `components.${id}.capsuleCss`);
  }
}

for (const [slot, comp] of Object.entries(compositions)) {
  if (!Array.isArray(comp.components) || comp.components.length === 0) {
    errors.push(`appCompositions.${slot} : components[] vide`);
    continue;
  }
  for (const cid of comp.components) {
    if (!componentIds.has(cid)) {
      errors.push(`appCompositions.${slot} : composant inconnu « ${cid} »`);
    }
  }
  if (comp.template) {
    expectFile(comp.template, `appCompositions.${slot}.template`);
  }
  if (comp.baseCss) {
    expectFile(comp.baseCss, `appCompositions.${slot}.baseCss`);
  }
}

for (const slot of P0_COMPOSITION_SLOTS) {
  if (!compositions[slot]) {
    errors.push(`P0 ${slot} : appCompositions manquante (contrat cinnamon)`);
  }
  if (!slotSpecs[slot]) {
    errors.push(`P0 ${slot} : slotSpecs cinnamon absent dans apps-catalog.json`);
  }
}

for (const [slot, comp] of Object.entries(compositions)) {
  const spec = slotSpecs[slot];
  if (!spec) {
    continue;
  }
  const specTemplate = spec.template || `${slot}.html`;
  const compTemplate = comp.template ? path.basename(comp.template) : null;
  if (compTemplate && compTemplate !== specTemplate) {
    errors.push(
      `${slot} : template divergent (slotSpecs=${specTemplate}, contrat=${compTemplate})`,
    );
  }
  if (spec.chromeProvider && comp.chromeProvider && spec.chromeProvider !== comp.chromeProvider) {
    errors.push(
      `${slot} : chromeProvider divergent (slotSpecs=${spec.chromeProvider}, contrat=${comp.chromeProvider})`,
    );
  }
}

const mintAboutis = new Set(slotsManifest.mintSlotsAboutis || []);
for (const slot of Object.keys(compositions)) {
  if (!slotSpecs[slot]) {
    errors.push(`appCompositions.${slot} sans slotSpecs cinnamon dans apps-catalog.json`);
  }
}

if (isSkeleton) {
  const covered = P0_COMPOSITION_SLOTS.filter((s) => mintAboutis.has(s)).length;
  if (covered < P0_COMPOSITION_SLOTS.length) {
    errors.push(
      `mintSlotsAboutis : ${P0_COMPOSITION_SLOTS.length} slots P0 composition attendus, `
      + `${covered} présents dans mintSlotsAboutis`,
    );
  }
}

if (errors.length) {
  console.error(`✗ validate-ui-components-cinnamon — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

console.log(
  `✓ validate-ui-components-cinnamon OK — ${componentIds.size} composants N1, `
    + `${Object.keys(compositions).length} compositions, ${P0_COMPOSITION_SLOTS.length} slots P0`,
);
