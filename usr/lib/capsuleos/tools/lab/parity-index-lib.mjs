#!/usr/bin/env node
/**
 * Bibliothèque indice de parité Π — Linux Mint et extensions futures.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

export const DIMENSIONS = ['vis', 'nav', 'int', 'ctx', 'kb', 'data'];

export const DIMENSION_LABELS = {
  vis: 'Π_vis — chrome, layout, icônes, géométrie',
  nav: 'Π_nav — menus, barre, sous-menus, navigation',
  int: 'Π_int — boutons, inputs, toggles, listes',
  ctx: 'Π_ctx — clic droit, popovers, modales, toasts',
  kb: 'Π_kb — raccourcis clavier',
  data: 'Π_data — état initial, contenu démo cohérent VM',
};

export const STATUS_THRESHOLDS = { ok: 90, partiel: 60 };

export const parityStatus = (score) => {
  if (score >= STATUS_THRESHOLDS.ok) return 'ok';
  if (score >= STATUS_THRESHOLDS.partiel) return 'partiel';
  return 'absent';
};

export const mean = (values) => {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
};

export const computePiApp = (dims) => mean(DIMENSIONS.map((d) => dims[d]));

export const defaultIndexPath = (registryId) => {
  const slug = registryId.replace(/[^a-z0-9-]/gi, '-');
  return path.join(ROOT, 'root/docs/inventaires', `${slug}-parity-index.json`);
};

export const inventoryDir = (registryId) => {
  const slug = registryId.replace(/[^a-z0-9-]/gi, '-');
  return path.join(ROOT, 'root/docs/inventaires/interactions', slug);
};

export const inventoryPath = (registryId, slot) => (
  path.join(inventoryDir(registryId), `${slot}.json`)
);

export const vmDocCandidates = (registryId, slot) => {
  const slug = registryId.replace(/[^a-z0-9-]/gi, '-');
  const base = path.join(ROOT, 'root/docs/inventaires');
  return [
    path.join(base, `${slug}-${slot}-vm.md`),
    path.join(base, `${slug}-${slot}-vm.json`),
  ];
};

export function loadParityIndex(registryId, customPath) {
  const file = customPath || defaultIndexPath(registryId);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function saveParityIndex(registryId, data, customPath) {
  const file = customPath || defaultIndexPath(registryId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export const DEFAULT_PRIORITY_APP_SLOTS = [
  'nemo', 'firefox', 'text_editor', 'calculator', 'file_roller',
  'update_manager', 'mintinstall', 'themes',
];

export function recomputeGlobal(index) {
  const shellEntries = Object.values(index.shell || {});
  let appEntries = Object.values(index.apps || {});
  const shellWeight = index.weights?.shell ?? 0.25;
  const appWeight = index.weights?.apps ?? 0.75;

  if (index.weights && index.weights.appsScope === 'priority') {
    const pri = index.weights.prioritySlots || DEFAULT_PRIORITY_APP_SLOTS;
    const set = new Set(pri);
    appEntries = appEntries.filter((e) => set.has(e.slot || e.id));
  }

  const shellPi = mean(shellEntries.map((e) => e.pi ?? computePiApp(e.dimensions || {})));
  const appPi = mean(appEntries.map((e) => e.pi ?? computePiApp(e.dimensions || {})));

  index.pi_global = Math.round(shellPi * shellWeight + appPi * appWeight);
  index.status_global = parityStatus(index.pi_global);
  index.updatedAt = new Date().toISOString();
  return index;
}

export function updateAppParity(index, slot, patch) {
  if (!index.apps) index.apps = {};
  const prev = index.apps[slot] || { dimensions: {} };
  const dims = { ...prev.dimensions, ...(patch.dimensions || {}) };
  const entry = {
    ...prev,
    ...patch,
    slot,
    dimensions: dims,
    pi: computePiApp(dims),
    status: parityStatus(computePiApp(dims)),
    updatedAt: new Date().toISOString(),
  };
  index.apps[slot] = entry;
  return recomputeGlobal(index);
}

export function updateShellParity(index, surfaceId, patch) {
  if (!index.shell) index.shell = {};
  const prev = index.shell[surfaceId] || { dimensions: {} };
  const dims = { ...prev.dimensions, ...(patch.dimensions || {}) };
  const entry = {
    ...prev,
    ...patch,
    id: surfaceId,
    dimensions: dims,
    pi: computePiApp(dims),
    status: parityStatus(computePiApp(dims)),
    updatedAt: new Date().toISOString(),
  };
  index.shell[surfaceId] = entry;
  return recomputeGlobal(index);
}

export function dimensionScoresFromChecks(checks) {
  const buckets = { vis: [], nav: [], int: [], ctx: [], kb: [], data: [] };
  checks.forEach((c) => {
    const dim = c.dimension || 'int';
    if (!buckets[dim]) buckets[dim] = [];
    buckets[dim].push(c.pass ? 100 : 0);
  });
  const out = {};
  DIMENSIONS.forEach((d) => {
    out[d] = buckets[d].length ? mean(buckets[d]) : null;
  });
  return out;
}
