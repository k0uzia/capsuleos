/**
 * Campagne différentielle — comparer VM au dépôt, sauter phases CR si GapΔ vide.
 * Contrat : os-reproduction-coherence.json → differentialCampaign
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { filterOpenGaps } from './content-gaps-lib.mjs';

const COHERENCE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/os-reproduction-coherence.json');
const CONTENT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/gnome-software-store-content.json');

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const loadDifferentialCampaign = () => {
  const coherence = readJson(COHERENCE_PATH);
  return coherence?.differentialCampaign || null;
};

/**
 * @returns {{ skip: boolean, reason: string }}
 */
export const shouldSkipCampaignPhase = (registryId, phaseId) => {
  const diff = loadDifferentialCampaign();
  if (!diff?.skipWhen?.[phaseId]) {
    return { skip: false, reason: 'pas de règle skip' };
  }

  const invVisual = readJson(
    path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`),
  );
  const invApps = readJson(
    path.join(ROOT, 'root/docs/inventaires', `${registryId}-vm-apps-installed.json`),
  );

  if (phaseId === 'CR-1') {
    if (invApps?.apps?.length > 0 && invApps.generatedAt) {
      return { skip: true, reason: 'AppV — inventaire VM déjà documenté' };
    }
    return { skip: false, reason: 'inventaire VM absent ou vide' };
  }

  if (phaseId === 'CR-2') {
    const documented = invVisual?.summary?.documentedP0 ?? 0;
    const gaps = filterOpenGaps(invVisual).length;
    if (documented > 0 && gaps === 0) {
      return { skip: true, reason: 'AppVv — P0 documenté sans contentGaps ouverts' };
    }
    return { skip: false, reason: `documentedP0=${documented} openGaps=${gaps}` };
  }

  if (phaseId === 'CR-4') {
    const content = readJson(CONTENT_PATH);
    const byReg = content?.byRegistry?.[registryId];
    const catalogGaps = filterOpenGaps(invVisual, ['catalog', 'content', 'detail']).length;
    if (byReg?.exploreFeaturedIds?.length >= 6 && catalogGaps === 0) {
      return { skip: true, reason: 'StoreG/Σ — byRegistry présent sans gaps catalog/content' };
    }
    return { skip: false, reason: `byRegistry=${!!byReg} catalogGaps=${catalogGaps}` };
  }

  return { skip: false, reason: 'évaluation skip non implémentée pour cette phase' };
};

/** Filtre phases CR actives en retirant celles sautables (C9). */
export const filterCampaignPhases = (registryId, phaseIds) => (
  phaseIds.filter((id) => {
    const { skip } = shouldSkipCampaignPhase(registryId, id);
    return !skip;
  })
);
