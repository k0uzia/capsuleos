/**
 * Agrégation et matérialisation contentGaps — grille OsRepro (C6 / RealΣ).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { loadAppsContract } from './apps-catalog-lib.mjs';
import { isVSigmaClosed, registryMatrixPath } from './ui-state-effects-lib.mjs';

const SLOTS_PATH = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');
const COHERENCE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/os-reproduction-coherence.json');

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const GAP_ID_PREFIX = 'real-sigma-';

/** Dimensions grille + alias historiques (contenu → content). */
export const normalizeGapDimension = (dim) => (dim === 'contenu' ? 'content' : dim);

/** Agrège contentGaps top-level + contentSpec par investigation. */
export const collectContentGaps = (visualInv) => {
  const out = [];
  const seen = new Set();

  const push = (gap, slotId) => {
    if (!gap?.id) return;
    const key = `${gap.id}::${slotId || gap.slotId || gap.controlId || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      ...gap,
      dimension: normalizeGapDimension(gap.dimension),
      slotId: gap.slotId || gap.controlId || slotId || null,
      controlId: gap.controlId || gap.slotId || slotId || null,
    });
  };

  for (const g of visualInv?.contentGaps || []) {
    push(g, g.slotId || g.controlId);
  }

  for (const inv of visualInv?.investigations || []) {
    const slotId = inv.controlId;
    for (const g of inv.contentSpec?.contentGaps || []) {
      push(g, slotId);
    }
  }

  return out;
};

export const filterOpenGaps = (visualInv, dimensions = null) => (
  collectContentGaps(visualInv).filter((g) => {
    if (g.status !== 'open') return false;
    if (!dimensions) return true;
    return dimensions.includes(normalizeGapDimension(g.dimension));
  })
);

export const openGapsForSlot = (visualInv, slotId) => (
  filterOpenGaps(visualInv).filter((g) => g.slotId === slotId || g.controlId === slotId)
);

export const functionalDepthForSlot = (toolkit, slotId) => {
  const appsContract = loadAppsContract();
  const slotsManifest = readJson(SLOTS_PATH);
  return appsContract.toolkits?.[toolkit]?.slotSpecs?.[slotId]?.functionalDepth
    || slotsManifest?.slots?.[slotId]?.functionalDepth
    || 'unknown';
};

export const depthBlocksRealSigma = (depth) => depth === 'partial';

export const evaluateVSigmaRegistry = (registryId) => {
  const effectsPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-ui-state-effects.json`);
  if (fs.existsSync(effectsPath)) {
    const effects = readJson(effectsPath);
    const p = effects?.summary?.predicates;
    if (p?.VΣ === true) {
      return {
        closed: true,
        reason: 'VΣ clôturé — inventaire ui-state-effects',
        predicates: p,
        source: effectsPath,
      };
    }
  }

  const matrixPath = registryMatrixPath(registryId);
  if (!fs.existsSync(matrixPath)) {
    return { closed: false, reason: 'matrice absente', matrixPath };
  }
  try {
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    return {
      closed: isVSigmaClosed(matrix),
      predicates: matrix.predicates || {},
      matrixPath,
      reason: isVSigmaClosed(matrix) ? 'VΣ clôturé — matrice' : 'VΣ incomplet — matrice',
    };
  } catch (e) {
    return { closed: false, reason: `matrice invalide: ${e.message}`, matrixPath };
  }
};

const vpSatisfied = (visualMatch) => visualMatch === 'ok' || visualMatch === 'accepted';

export const evaluateSlotRealSigma = ({
  slotId,
  priorite,
  visualMatch,
  functionalDepth,
  vSigmaClosed,
}) => {
  if (priorite !== 'P0' || !slotId) {
    return { realSigma: null, vp: null, depthOk: null, skipped: true };
  }
  const vp = vpSatisfied(visualMatch);
  const depthOk = !depthBlocksRealSigma(functionalDepth);
  return {
    realSigma: vp && depthOk && vSigmaClosed,
    vp,
    depthOk,
    functionalDepth,
    vSigmaClosed,
    skipped: false,
  };
};

const ensureContentSpec = (investigation) => {
  if (!investigation.contentSpec) {
    investigation.contentSpec = { contentGaps: [], resolved: [] };
  }
  if (!investigation.contentSpec.contentGaps) {
    investigation.contentSpec.contentGaps = [];
  }
  return investigation.contentSpec;
};

const hasGapId = (gaps, id) => gaps.some((g) => g.id === id);

const buildVpGap = (slotId, visualMatch) => ({
  id: `${GAP_ID_PREFIX}${slotId}-vp`,
  dimension: 'chrome',
  severity: 'high',
  status: 'open',
  slotId,
  controlId: slotId,
  source: 'resolve-slot-gap-delta',
  predicate: 'RealΣ',
  note: `parityDebt auto — visualMatch=${visualMatch} ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)`,
});

const buildDepthGap = (slotId, functionalDepth) => ({
  id: `${GAP_ID_PREFIX}${slotId}-depth`,
  dimension: 'interaction',
  severity: 'medium',
  status: 'open',
  slotId,
  controlId: slotId,
  source: 'resolve-slot-gap-delta',
  predicate: 'RealΣ',
  note: `functionalDepth=${functionalDepth} sur P0 — cible profondeur full (RealΣ)`,
});

const buildVSigmaGap = (registryId, reason) => ({
  id: `${GAP_ID_PREFIX}registry-vsigma`,
  dimension: 'Vc',
  severity: 'high',
  status: 'open',
  registryId,
  source: 'resolve-slot-gap-delta',
  predicate: 'RealΣ',
  note: `VΣ non clôturé — ${reason}`,
});

const syncTopLevelMirror = (visualInv) => {
  visualInv.contentGaps = collectContentGaps(visualInv).filter((g) => g.status === 'open');
};

/**
 * Ouvre contentGaps pour chaque parityDebt (P0, partial sans gap ouvert).
 * @returns {{ written: boolean, added: object[], path: string|null }}
 */
export const materializeParityDebtGaps = (registryId, {
  slotMap,
  toolkit,
  realSigmaDebt,
  parityDebt,
  vSigma,
  write = false,
}) => {
  const debts = realSigmaDebt?.length
    ? realSigmaDebt
    : (parityDebt || []);
  const visualPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`);
  const visualInv = readJson(visualPath);
  if (!visualInv) {
    return { written: false, added: [], path: null, reason: 'inventaire visuel absent' };
  }

  const added = [];
  const investigations = visualInv.investigations || [];
  const invBySlot = new Map(investigations.map((i) => [i.controlId, i]));

  for (const debt of debts) {
    const { slotId, visualMatch } = debt;
    const inv = invBySlot.get(slotId);
    if (!inv) continue;

    const existing = openGapsForSlot(visualInv, slotId);
    if (existing.length > 0) continue;

    const spec = ensureContentSpec(inv);
    const depth = functionalDepthForSlot(toolkit, slotId);

    if (!vpSatisfied(visualMatch)) {
      const gap = buildVpGap(slotId, visualMatch);
      if (!hasGapId(spec.contentGaps, gap.id)) {
        spec.contentGaps.push(gap);
        added.push(gap);
      }
    }

    if (depthBlocksRealSigma(depth)) {
      const gap = buildDepthGap(slotId, depth);
      if (!hasGapId(spec.contentGaps, gap.id)) {
        spec.contentGaps.push(gap);
        added.push(gap);
      }
    }
  }

  if (!vSigma?.closed) {
    const topGaps = collectContentGaps(visualInv);
    const vsigmaId = `${GAP_ID_PREFIX}registry-vsigma`;
    if (!hasGapId(topGaps, vsigmaId) && (debts.length || added.length)) {
      const gap = buildVSigmaGap(registryId, vSigma?.reason || 'matrice absente');
      if (!visualInv.contentGaps) visualInv.contentGaps = [];
      if (!hasGapId(visualInv.contentGaps, gap.id)) {
        visualInv.contentGaps.push(gap);
        added.push(gap);
      }
    }
  }

  if (!added.length) {
    return { written: false, added: [], path: visualPath, reason: 'aucun gap à matérialiser' };
  }

  if (write) {
    syncTopLevelMirror(visualInv);
    visualInv.updatedAt = new Date().toISOString();
    visualInv.realSigmaMaterializedAt = visualInv.updatedAt;
    fs.writeFileSync(visualPath, `${JSON.stringify(visualInv, null, 2)}\n`);
  }

  return { written: write, added, path: visualPath, reason: write ? 'gaps écrits' : 'dry-run' };
};

export const loadRealSigmaContract = () => {
  const coherence = readJson(COHERENCE_PATH);
  return coherence?.realismPredicates?.RealΣ || null;
};

const closeGap = (gap, note) => {
  gap.status = 'closed';
  gap.closedAt = new Date().toISOString();
  if (note) gap.note = note;
};

/** Clôture RealΣ slot — fermer gaps auto, promouvoir Vp, mettre à jour captures. */
export const closeRealSigmaSlot = (registryId, slotId, {
  write = true,
  visualMatch = 'ok',
  note = null,
  capsuleCaptures = null,
} = {}) => {
  const visualPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`);
  const visualInv = readJson(visualPath);
  if (!visualInv) {
    return { ok: false, reason: 'inventaire visuel absent' };
  }

  const inv = (visualInv.investigations || []).find((i) => i.controlId === slotId);
  if (!inv) {
    return { ok: false, reason: `slot ${slotId} absent` };
  }

  const closureNote = note || (
    `RealΣ clôturé — chrome GS50 + scénarios S1–S12 smoke OK (${new Date().toISOString().slice(0, 10)})`
  );
  const gapsClosed = [];

  if (inv.contentSpec?.contentGaps) {
    for (const gap of inv.contentSpec.contentGaps) {
      if (gap.id?.startsWith(`${GAP_ID_PREFIX}${slotId}`) && gap.status === 'open') {
        closeGap(gap, closureNote);
        gapsClosed.push(gap.id);
      }
    }
  }

  inv.capsuleParity = {
    ...(inv.capsuleParity || {}),
    visualMatch,
    appCt: visualMatch,
  };
  if (Array.isArray(capsuleCaptures) && capsuleCaptures.length) {
    inv.capsuleCaptures = capsuleCaptures;
  }

  if (visualInv.contentGaps) {
    for (const gap of visualInv.contentGaps) {
      if (gap.id?.startsWith(`${GAP_ID_PREFIX}${slotId}`) && gap.status === 'open') {
        closeGap(gap, closureNote);
      }
    }
    visualInv.contentGaps = collectContentGaps(visualInv).filter((g) => g.status === 'open');
  }

  visualInv.updatedAt = new Date().toISOString();
  if (write) {
    fs.writeFileSync(visualPath, `${JSON.stringify(visualInv, null, 2)}\n`);
  }

  return { ok: true, slotId, gapsClosed, visualMatch, path: visualPath };
};
