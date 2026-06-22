#!/usr/bin/env node
/**
 * Aligne les compositions P0/P1 de linux-mint-apps-visual-investigation.json
 * sur ui-components-cinnamon.json (référence toolkit, pas GNOME).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/linux/sync-mint-visual-investigation-compositions.mjs
 *   node usr/lib/capsuleos/tools/linux/sync-mint-visual-investigation-compositions.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVESTIGATION = path.join(
  ROOT,
  'root/docs/inventaires/linux-mint-apps-visual-investigation.json',
);
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-cinnamon.json');

const write = process.argv.includes('--write');
const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const compositions = contract.appCompositions || {};
const investigation = JSON.parse(fs.readFileSync(INVESTIGATION, 'utf8'));

let updated = 0;

for (const control of investigation.investigations || []) {
  const slotId = control.controlId;
  const spec = compositions[slotId];
  if (!spec || !control.composition) {
    continue;
  }
  const next = {
    labelFr: spec.labelFr || control.composition.labelFr,
    components: [...spec.components],
    acquisitionOrder: spec.acquisitionOrder
      ? [...spec.acquisitionOrder]
      : control.composition.acquisitionOrder || [],
    chromeProvider: spec.chromeProvider || 'cinnamon',
    referenceRegistryId: contract.referenceRegistryId || 'linux-mint',
  };
  const prevJson = JSON.stringify(control.composition);
  const nextJson = JSON.stringify(next);
  if (prevJson !== nextJson) {
    control.composition = next;
    updated += 1;
  }
  if (Array.isArray(control.componentShots)) {
    for (const shot of control.componentShots) {
      if (!Array.isArray(shot.componentIds)) {
        continue;
      }
      const shotIds = next.components.join(',');
      const curIds = shot.componentIds.join(',');
      if (shotIds !== curIds) {
        shot.componentIds = [...next.components];
        updated += 1;
      }
    }
  }
  const noteRef = 'ui-components-cinnamon.json';
  if (control.note && control.note.includes('ui-components-gnome.json')) {
    control.note = control.note.replace('ui-components-gnome.json', noteRef);
    updated += 1;
  }
}

if (!write) {
  console.log(
    `○ sync-mint-visual-investigation-compositions — ${updated} mise(s) à jour possibles `
    + '(relancer avec --write)',
  );
  process.exit(0);
}

fs.writeFileSync(INVESTIGATION, `${JSON.stringify(investigation, null, 2)}\n`);
console.log(
  `✓ sync-mint-visual-investigation-compositions — ${updated} mise(s) à jour écrites`,
);
