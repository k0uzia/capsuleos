#!/usr/bin/env node
/**
 * Valide le squelette catalogue composants Cinnamon.
 * Mode skeleton : cohérence interne + fichiers référencés existants (sans apps-catalog slotSpecs).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-ui-components-cinnamon.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-cinnamon.json');

const errors = [];

function expectFile(rel, label) {
  if (!rel) return;
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`${label} introuvable : ${rel}`);
  }
}

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const componentIds = new Set(Object.keys(contract.components || {}));
const compositions = contract.appCompositions || {};
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
  if (!comp.planned && !comp.shellSurface) {
    if (comp.template) expectFile(comp.template, `appCompositions.${slot}.template`);
    if (comp.baseCss) expectFile(comp.baseCss, `appCompositions.${slot}.baseCss`);
  }
}

if (!isSkeleton) {
  errors.push('Contrat cinnamon : statut non-skeleton requiert validateur complet (à implémenter)');
}

if (errors.length) {
  console.error(`✗ validate-ui-components-cinnamon — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

console.log(
  `✓ validate-ui-components-cinnamon OK — squelette, ${componentIds.size} composants N1, ` +
    `${Object.keys(compositions).length} compositions (planned)`,
);
