/**
 * Lecture contrat composants GNOME — compositions et plans d'acquisition VM.
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

export const GNOME_UI_CONTRACT_REL = 'etc/capsuleos/contracts/ui-components-gnome.json';

let cached = null;

export const loadGnomeUiComponents = () => {
  if (cached) return cached;
  const full = path.join(ROOT, GNOME_UI_CONTRACT_REL);
  cached = JSON.parse(fs.readFileSync(full, 'utf8'));
  return cached;
};

/** Plans de capture par slot (acquisitionOrder → componentShots). */
export const componentShotsForSlot = (slot) => {
  const contract = loadGnomeUiComponents();
  const comp = contract.appCompositions?.[slot];
  if (!comp) return [];
  const order = comp.acquisitionOrder || [];
  const componentIds = comp.components || [];
  return order.map((shotId) => ({
    shotId,
    componentIds,
    labelFr: shotId.replace(/-/g, ' '),
    status: 'pending',
    vmCapture: null,
  }));
};

export const compositionMetaForSlot = (slot) => {
  const contract = loadGnomeUiComponents();
  const comp = contract.appCompositions?.[slot];
  if (!comp) return null;
  return {
    labelFr: comp.labelFr,
    components: comp.components || [],
    acquisitionOrder: comp.acquisitionOrder || [],
    chromeProvider: comp.chromeProvider,
    referenceRegistryId: comp.referenceRegistryId,
  };
};
