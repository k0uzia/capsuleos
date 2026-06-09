#!/usr/bin/env node
/**
 * Valide le catalogue composants GNOME et sa cohérence avec apps-catalog slotSpecs.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-gnome.json');
const APPS_CATALOG = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');

const errors = [];

function expectFile(rel, label) {
  if (!rel) return;
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`${label} introuvable : ${rel}`);
  }
}

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const appsCatalog = JSON.parse(fs.readFileSync(APPS_CATALOG, 'utf8'));

const componentIds = new Set(Object.keys(contract.components || {}));
const compositions = contract.appCompositions || {};
const slotSpecs = appsCatalog.toolkits?.gnome?.slotSpecs || {};

// N0 paths
for (const rel of contract.levels?.N0?.paths || []) {
  expectFile(rel, 'N0 token');
}

// Components: optional CSS paths
for (const [id, comp] of Object.entries(contract.components || {})) {
  if (!comp.higUrl && !comp.gnomeWidget && !comp.capsuleCss) {
    errors.push(`components.${id} : higUrl ou ressource Capsule manquant`);
  }
  for (const rel of comp.capsuleCss || []) {
    expectFile(rel, `components.${id}.capsuleCss`);
  }
}

// App compositions
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
  if (comp.template) expectFile(comp.template, `appCompositions.${slot}.template`);
  if (comp.baseCss) expectFile(comp.baseCss, `appCompositions.${slot}.baseCss`);
}

// slotSpecs ↔ appCompositions (même ensemble de clés)
const slotKeys = new Set(Object.keys(slotSpecs));
const compKeys = new Set(Object.keys(compositions));

for (const slot of slotKeys) {
  if (!compKeys.has(slot)) {
    errors.push(`slotSpecs.${slot} sans appCompositions correspondante`);
  }
}
for (const slot of compKeys) {
  if (!slotKeys.has(slot)) {
    errors.push(`appCompositions.${slot} sans slotSpecs dans apps-catalog.json`);
  }
}

// chromeProvider alignment
for (const slot of slotKeys) {
  const spec = slotSpecs[slot];
  const comp = compositions[slot];
  if (spec && comp && spec.chromeProvider && comp.chromeProvider && spec.chromeProvider !== comp.chromeProvider) {
    errors.push(
      `${slot} : chromeProvider divergent (slotSpecs=${spec.chromeProvider}, contrat=${comp.chromeProvider})`,
    );
  }
}

if (errors.length) {
  console.error(`✗ validate-ui-components-gnome — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

console.log(
  `✓ validate-ui-components-gnome OK — ${componentIds.size} composants N1, ` +
    `${compKeys.size} compositions N2`,
);
