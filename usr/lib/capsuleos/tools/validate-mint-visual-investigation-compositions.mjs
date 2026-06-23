#!/usr/bin/env node
/**
 * Gate : compositions inventaire visuel Mint alignées sur ui-components-cinnamon.json
 * pour les slots déclarés dans appCompositions.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-mint-visual-investigation-compositions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const INVESTIGATION = path.join(
  ROOT,
  'root/docs/inventaires/linux-mint-apps-visual-investigation.json',
);
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-cinnamon.json');

const errors = [];
const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const compositions = contract.appCompositions || {};
const investigation = JSON.parse(fs.readFileSync(INVESTIGATION, 'utf8'));
const registryId = contract.referenceRegistryId || 'linux-mint';

function sameArray(a, b) {
  return Array.isArray(a) && Array.isArray(b)
    && a.length === b.length
    && a.every((v, i) => v === b[i]);
}

for (const control of investigation.investigations || []) {
  const slotId = control.controlId;
  const spec = compositions[slotId];
  if (!spec || !control.composition) {
    continue;
  }
  const comp = control.composition;
  const label = `${slotId}${control.vmId ? ` (${control.vmId})` : ''}`;
  if (comp.referenceRegistryId !== registryId) {
    errors.push(`${label} : referenceRegistryId=${comp.referenceRegistryId} (attendu ${registryId})`);
  }
  if (comp.chromeProvider !== (spec.chromeProvider || 'cinnamon')) {
    errors.push(`${label} : chromeProvider=${comp.chromeProvider} (attendu ${spec.chromeProvider || 'cinnamon'})`);
  }
  if (!sameArray(comp.components, spec.components)) {
    errors.push(`${label} : components divergent du contrat cinnamon`);
  }
  if (Array.isArray(control.componentShots)) {
    for (const shot of control.componentShots) {
      if (shot.componentIds && !sameArray(shot.componentIds, spec.components)) {
        errors.push(`${label} shot ${shot.shotId} : componentIds divergent`);
      }
    }
  }
}

if (errors.length) {
  console.error(`✗ validate-mint-visual-investigation-compositions — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

const slots = Object.keys(compositions).length;
console.log(
  `✓ validate-mint-visual-investigation-compositions OK — ${slots} slot(s) contrat vérifiés`,
);
