/**
 * Bibliothèque VΣ — matrice shell + extension apps VM (AppV → Va).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { pathsForApps, loadAppsContract } from './apps-catalog-lib.mjs';

export const BASE_MATRIX = path.join(ROOT, 'root/tools/lab/ui-state-effects-matrix-gnome.json');

export const registryMatrixPath = (registryId) => path.join(
  ROOT,
  'root/docs/inventaires',
  `${registryId}-ui-state-effects-matrix.json`,
);

export const loadBaseMatrix = () => JSON.parse(fs.readFileSync(BASE_MATRIX, 'utf8'));

export const loadMergedMatrix = (registryId) => {
  const regPath = registryMatrixPath(registryId);
  if (fs.existsSync(regPath)) {
    return JSON.parse(fs.readFileSync(regPath, 'utf8'));
  }
  return loadBaseMatrix();
};

/** Playbooks VM déjà couverts par la matrice GNOME de base. */
const PLAYBOOK_BY_DESKTOP = {
  'org.gnome.Nautilus': 'open-nautilus',
  'org.gnome.Nautilus.desktop': 'open-nautilus',
  firefox: 'open-firefox',
  'firefox.desktop': 'open-firefox',
  'firefox_firefox.desktop': 'open-firefox',
  'org.gnome.Ptyxis': 'open-terminal',
  'org.gnome.Ptyxis.desktop': 'open-terminal',
  'org.gnome.TextEditor': null,
  'org.gnome.TextEditor.desktop': null,
  'org.gnome.Calculator': null,
  'org.gnome.Calculator.desktop': null,
};

const desktopId = (row) => {
  if (row.desktop) return row.desktop;
  if (row.id?.endsWith('.desktop')) return row.id;
  return `${row.id}.desktop`;
};

const wmClassGuess = (desktop) => {
  const base = desktop.replace(/\.desktop$/, '');
  if (base.includes('firefox')) return 'Navigator.firefox';
  if (base.includes('Nautilus')) return 'org.gnome.Nautilus';
  if (base.includes('Calculator')) return 'org.gnome.Calculator';
  if (base.includes('TextEditor')) return 'org.gnome.TextEditor';
  if (base.includes('Ptyxis')) return 'org.gnome.Ptyxis';
  if (base.includes('Settings')) return 'org.gnome.Settings';
  if (base.includes('Software')) return 'org.gnome.Software';
  return base;
};

const existingPlaybooks = (transitions) => new Set(
  transitions.map((t) => t.playbookVm).filter(Boolean),
);

const existingTransitionIds = (transitions) => new Set(transitions.map((t) => t.id));

/**
 * Génère transitions P0/P1 pour apps catalogue avec slot Capsule.
 */
export const discoverAppTransitions = (registryId, catalogRows) => {
  const discovered = [];
  const seenSlots = new Set();

  for (const row of catalogRows) {
    const slot = row.capsuleSlot || row.slotCapsule || row.slot;
    if (!slot || seenSlots.has(slot)) continue;
    if (!['P0', 'P1'].includes(row.priorite || row.priority)) continue;
    if (!['ok', 'partiel'].includes(row.statut || row.status)) continue;

    const desktop = desktopId(row);
    const playbookVm = PLAYBOOK_BY_DESKTOP[desktop] || PLAYBOOK_BY_DESKTOP[row.id] || null;

    discovered.push({
      id: `app.${slot}.open`,
      surface: `app.${slot}`,
      label: row.labelFr || row.name || slot,
      from: 'closed',
      to: 'open',
      playbookVm,
      launchVm: playbookVm ? null : `gtk-launch ${desktop}`,
      wmClass: wmClassGuess(desktop),
      trigger: {
        type: 'launcher',
        desktop,
        clicks: 2,
      },
      effects: {
        properties: ['opacity', 'transform', 'box-shadow'],
        durationMs: 200,
        easing: 'ease-out',
      },
      burstMs: [0, 100, 400, 1400],
      parity: row.priorite === 'P0' ? 'P0' : 'P1',
      discoveredFrom: 'apps-catalog',
      capsuleSlot: slot,
      vmDesktop: desktop,
    });
    seenSlots.add(slot);
  }

  return discovered;
};

export const loadCatalogRows = (registryId) => {
  const paths = pathsForApps(registryId);
  if (!fs.existsSync(paths.appsCatalog)) return [];
  const catalog = JSON.parse(fs.readFileSync(paths.appsCatalog, 'utf8'));
  return catalog.rows || catalog.apps || catalog.entries || [];
};

export const mergeMatrixWithApps = (registryId, options = {}) => {
  const base = loadBaseMatrix();
  const catalogRows = options.catalogRows ?? loadCatalogRows(registryId);
  const appTransitions = discoverAppTransitions(registryId, catalogRows);

  const usedPlaybooks = existingPlaybooks(base.transitions);
  const usedIds = existingTransitionIds(base.transitions);

  const filteredApps = appTransitions.filter((t) => {
    if (usedIds.has(t.id)) return false;
    if (t.playbookVm && usedPlaybooks.has(t.playbookVm)) return false;
    return true;
  });

  const appSurfaces = filteredApps.map((t) => ({
    id: t.surface,
    label: t.label || t.capsuleSlot,
    states: ['closed', 'open', 'focused'],
    discoveredFrom: 'apps-catalog',
  }));

  const surfaceIds = new Set(base.surfaces.map((s) => s.id));
  const extraSurfaces = appSurfaces.filter((s) => !surfaceIds.has(s.id));

  return {
    version: 1,
    registryId,
    baseMatrix: 'root/tools/lab/ui-state-effects-matrix-gnome.json',
    generatedAt: new Date().toISOString(),
    discoveredApps: filteredApps.map((t) => ({
      slot: t.capsuleSlot,
      vmDesktop: t.vmDesktop,
      transitionId: t.id,
      parity: t.parity,
    })),
    surfaces: [...base.surfaces, ...extraSurfaces],
    transitions: [...base.transitions, ...filteredApps],
    summary: {
      baseTransitions: base.transitions.length,
      discoveredTransitions: filteredApps.length,
      totalTransitions: base.transitions.length + filteredApps.length,
      catalogAppsConsidered: catalogRows.length,
    },
  };
};

export const writeRegistryMatrix = (registryId, matrix) => {
  const out = registryMatrixPath(registryId);
  fs.writeFileSync(out, `${JSON.stringify(matrix, null, 2)}\n`);
  return out;
};

export const hasAppCatalog = (registryId) => {
  const paths = pathsForApps(registryId);
  return fs.existsSync(paths.appsCatalog);
};
