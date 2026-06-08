/**
 * Bibliothèque VΣ — matrice shell Mint (surfaces + capsuleMatch).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

export const registryMatrixPath = (registryId) => path.join(
  ROOT,
  'root/docs/inventaires',
  `${registryId}-ui-state-effects-matrix.json`,
);

export const catalogPath = (registryId) => path.join(
  ROOT,
  'root/docs/inventaires',
  `${registryId}-apps-catalog.json`,
);

export const loadMatrix = (registryId) => {
  const p = registryMatrixPath(registryId);
  if (!fs.existsSync(p)) {
    throw new Error(`Matrice absente : ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const writeMatrix = (registryId, matrix) => {
  const p = registryMatrixPath(registryId);
  fs.writeFileSync(p, `${JSON.stringify(matrix, null, 2)}\n`);
  return p;
};

export const loadCatalogRows = (registryId) => {
  const p = catalogPath(registryId);
  if (!fs.existsSync(p)) {
    return [];
  }
  const catalog = JSON.parse(fs.readFileSync(p, 'utf8'));
  return catalog.rows || [];
};

/** Étend discoveredApps depuis le catalogue apps (101/101). */
export const extendMatrixFromCatalog = (registryId) => {
  const matrix = loadMatrix(registryId);
  const rows = loadCatalogRows(registryId);
  const discovered = [];
  const seen = new Set();

  rows.forEach((row) => {
    if (row.statut !== 'ok') {
      return;
    }
    const slot = row.slotCapsule;
    if (!slot || seen.has(slot)) {
      return;
    }
    seen.add(slot);
    discovered.push({
      slot,
      vmDesktop: row.desktop !== '—' ? row.desktop : null,
      labelFr: row.labelFr,
      parity: row.priorite || 'P2',
      statut: 'ok',
    });
  });

  matrix.discoveredApps = discovered;
  matrix.summary = matrix.summary || {};
  matrix.summary.discoveredApps = discovered.length;
  matrix.summary.catalogOk = rows.filter((r) => r.statut === 'ok').length;
  matrix.generatedAt = new Date().toISOString();
  refreshPredicates(matrix, matrix.burst || null);
  return matrix;
};

export const countCapsuleMatch = (matrix) => {
  const surfaces = matrix.surfaces || [];
  let ok = 0;
  let partial = 0;
  let other = 0;
  surfaces.forEach((s) => {
    if (s.capsuleMatch === 'ok') {
      ok += 1;
    } else if (s.capsuleMatch === 'partial') {
      partial += 1;
    } else {
      other += 1;
    }
  });
  return { ok, partial, other, total: surfaces.length };
};

/** Met à jour prédicats Va…VΣ depuis la matrice. */
export const refreshPredicates = (matrix, burstMeta) => {
  const counts = countCapsuleMatch(matrix);
  const allOk = counts.total > 0 && counts.ok === counts.total;
  const anyOk = counts.ok > 0;
  const trayOk = !!(burstMeta && burstMeta.tray && burstMeta.tray.ok);
  const interactionOk = !!(burstMeta && burstMeta.interaction && burstMeta.interaction.ok);

  matrix.predicates = matrix.predicates || {};
  matrix.predicates.Va = anyOk || (matrix.discoveredApps || []).length > 0;
  matrix.predicates.Ve = trayOk;
  matrix.predicates.Vx = false;
  matrix.predicates.Vm = allOk;
  matrix.predicates.Vmu = interactionOk && trayOk;
  matrix.predicates.VSigma = allOk && trayOk && interactionOk;
  return matrix;
};

/** Gate VΣ pour replication-state. */
export const isVSigmaClosed = (matrix) => {
  const counts = countCapsuleMatch(matrix);
  const p = matrix.predicates || {};
  return counts.ok === counts.total
    && counts.total > 0
    && p.VSigma === true;
};

export const validateMatrixReport = (registryId, matrix) => {
  const counts = countCapsuleMatch(matrix);
  const surfaces = (matrix.surfaces || []).map((s) => ({
    id: s.id,
    capsuleMatch: s.capsuleMatch,
    selector: s.capsuleSelector,
  }));
  return {
    registryId,
    generatedAt: matrix.generatedAt,
    counts,
    predicates: matrix.predicates,
    closed: isVSigmaClosed(matrix),
    surfaces,
    discoveredApps: (matrix.discoveredApps || []).length,
  };
};
