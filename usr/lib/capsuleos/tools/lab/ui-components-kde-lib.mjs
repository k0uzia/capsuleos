/**
 * Lecture contrat composants KDE Plasma — compositions et plans d'acquisition VM.
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

export const KDE_UI_CONTRACT_REL = 'etc/capsuleos/contracts/ui-components-kde.json';

const KDE_REGISTRY_IDS = new Set([
  'linux-kde-neon',
  'linux-debian-kde',
  'linux-mx-kde',
  'linux-opensuse',
]);

let cached = null;

export const isKdeRegistry = (registryId) => KDE_REGISTRY_IDS.has(registryId);

export const loadKdeUiComponents = () => {
  if (cached) return cached;
  const full = path.join(ROOT, KDE_UI_CONTRACT_REL);
  cached = JSON.parse(fs.readFileSync(full, 'utf8'));
  return cached;
};

/** Plans de capture par slot (acquisitionOrder → componentShots). */
export const componentShotsForSlot = (slot) => {
  const contract = loadKdeUiComponents();
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
  const contract = loadKdeUiComponents();
  const comp = contract.appCompositions?.[slot];
  if (!comp) return null;
  return {
    labelFr: comp.labelFr,
    components: comp.components || [],
    acquisitionOrder: comp.acquisitionOrder || [],
    chromeProvider: comp.chromeProvider,
    referenceRegistryId: comp.referenceRegistryId,
    vmLaunch: comp.vmLaunch || null,
  };
};

export const vmLaunchForSlot = (slot) => {
  const contract = loadKdeUiComponents();
  const comp = contract.appCompositions?.[slot];
  if (!comp) return '';
  if (comp.vmLaunch) return comp.vmLaunch;
  const desktop = (comp.vmDesktopIds || [])[0];
  if (!desktop) return '';
  const id = desktop.endsWith('.desktop') ? desktop : `${desktop}.desktop`;
  return `gtk-launch ${id}`;
};
