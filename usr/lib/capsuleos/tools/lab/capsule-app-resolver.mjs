/**
 * Résolveur catalogue apps — Node (validateurs, générateur, smokes).
 * Séparation : slots-manifest (fonction) · presentation-bindings (UI) · store-installable (magasin).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRegistryEntry, ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SLOTS_MANIFEST_PATH = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');
const STORE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/store-installable-apps.json');
const PRESENTATION_PATH = path.join(ROOT, 'etc/capsuleos/contracts/presentation-bindings.json');
const APPS_CATALOG_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export const loadSlotsManifest = () => readJson(SLOTS_MANIFEST_PATH);
export const loadStoreContract = () => readJson(STORE_PATH);
export const loadPresentationBindings = () => readJson(PRESENTATION_PATH);
export const loadAppsCatalogContract = () => readJson(APPS_CATALOG_PATH);

export const resolveSlotManifest = (slotId) => {
  const manifest = loadSlotsManifest();
  const slot = manifest.slots?.[slotId];
  if (!slot) {
    return null;
  }
  return { ...slot, slotId: slot.slotId || slotId };
};

export const resolvePresentation = (registryId, slotId = null) => {
  const bindings = loadPresentationBindings();
  const binding = bindings.bindings?.[registryId];
  if (!binding) {
    return null;
  }
  const out = { ...binding };
  if (slotId) {
    const slot = resolveSlotManifest(slotId);
    const toolkit = binding.toolkit || 'gnome';
    out.slotVariant = slot?.toolkitVariants?.[toolkit] || null;
    const overrides = loadAppsCatalogContract().slotVariantOverrides?.[registryId]?.[slotId];
    if (overrides && out.slotVariant) {
      out.slotVariant = { ...out.slotVariant, ...overrides };
    }
  }
  return out;
};

const REGISTRY_SOURCE_FALLBACK = {
  'linux-kde-neon': 'linux-rocky',
  'linux-opensuse': 'linux-fedora',
};

const resolveRegistrySource = (app, registryId) => {
  const direct = app.sources?.[registryId];
  if (direct) {
    return direct;
  }
  const fallbackId = REGISTRY_SOURCE_FALLBACK[registryId];
  if (fallbackId) {
    return app.sources?.[fallbackId] || null;
  }
  return null;
};

const includeInStoreCatalog = (registryId, src, binding) => {
  if (!src) {
    return false;
  }
  if (src.storeInstallable === true) {
    return true;
  }
  if (registryId === 'linux-mint' && binding?.storeCatalogStatus === 'active') {
    return true;
  }
  return false;
};

const primarySource = (src) => {
  if (!src || typeof src !== 'object') return 'rpm';
  if (src.rpm) return 'rpm';
  if (src.flatpak) return 'flatpak';
  if (src.snap) return 'snap';
  if (src.deb) return 'deb';
  if (src.apt) return 'apt';
  return 'rpm';
};

const resolveStoreDesc = (app, registryId, sourceType) => {
  const catalog = app.storeCatalog || {};
  if (catalog.descByRegistry?.[registryId]) {
    return catalog.descByRegistry[registryId];
  }
  if (catalog.descBySource?.[sourceType]) {
    return catalog.descBySource[sourceType];
  }
  const base = catalog.desc;
  if (base) {
    if (sourceType === 'rpm' && /flatpak/i.test(base)) {
      const pkg = app.sources?.[registryId]?.rpm || app.slot;
      return `${app.labelFr} — paquet RPM (${pkg}).`;
    }
    if (sourceType === 'flatpak' && !/flatpak/i.test(base)) {
      const fp = app.sources?.[registryId]?.flatpak || '';
      return fp
        ? `${app.labelFr} (Flatpak ${fp}).`
        : `${app.labelFr} — installation Flatpak.`;
    }
    return base;
  }
  return `${app.labelFr} — installation simulée CapsuleOS.`;
};

const catalogIdForApp = (app) => {
  if (app.storeCatalog?.id) return app.storeCatalog.id;
  if (app.slot === 'libreoffice_startcenter') return 'libreoffice';
  return app.slot.replace(/_/g, '-');
};

const postInstallSlotFor = (app, slotManifest) =>
  app.postInstallSlot || slotManifest?.postInstallSlot || app.slot;

/** Entrées magasin runtime (STORE_APPS_BY_REGISTRY[registryId]). */
export const buildStoreCatalogEntries = (registryId) => {
  const store = loadStoreContract();
  const manifest = loadSlotsManifest();
  const presentation = resolvePresentation(registryId);
  const binding = loadPresentationBindings().bindings?.[registryId];
  const storeFrontSlot = presentation?.storeFront?.slot || 'update_manager';
  const entries = [];

  for (const app of store.apps || []) {
    const src = resolveRegistrySource(app, registryId);
    if (!includeInStoreCatalog(registryId, src, binding)) continue;

    const slotManifest = manifest.slots?.[app.slot];
    if (!slotManifest) {
      throw new Error(`slot absent slots-manifest: ${app.slot} (${registryId})`);
    }

    const catalog = app.storeCatalog || {};
    const id = catalogIdForApp(app);
    const postSlot = postInstallSlotFor(app, slotManifest);

    const sourceType = primarySource(src);
    entries.push({
      id,
      storeSlot: app.slot,
      title: app.labelFr,
      sub: catalog.sub || app.labelFr,
      desc: resolveStoreDesc(app, registryId, sourceType),
      version: catalog.version || '1.0',
      size: catalog.size || '~5 Mo',
      iconClass: catalog.iconClass || `gnome-software__cardicon--${id}`,
      slot: postSlot,
      source: primarySource(src),
      categories: catalog.categories || ['utilities'],
      placement: catalog.placement || { overview: true },
      storeFrontSlot,
      postInstallSlot: postSlot !== app.slot ? postSlot : null,
      relatedSlots: app.relatedSlots || null,
      defaultInstalled: src.defaultInstalled !== false,
      storeInstallable: src.storeInstallable === true,
    });
  }
  return entries;
};

/** Fusion apps VM default + store installable pour un registryId. */
export const resolveStoreEntries = (registryId) => {
  const appsCatalog = loadAppsCatalogContract();
  const store = loadStoreContract();
  const override = appsCatalog.registryOverrides?.[registryId];
  const presentation = resolvePresentation(registryId);
  const entries = [];

  if (override?.apps) {
    for (const [desktopId, spec] of Object.entries(override.apps)) {
      entries.push({
        desktopId,
        slot: spec.slot,
        labelFr: spec.labelFr,
        priorite: spec.priorite,
        statut: spec.statut,
        defaultInstalled: spec.onVm !== false && spec.defaultInstalled !== false,
        storeInstallable: !!spec.storeInstallable,
        source: 'vm',
        storeFrontSlot: presentation?.storeFront?.slot || null,
      });
    }
  }

  for (const app of store.apps || []) {
    const src = resolveRegistrySource(app, registryId);
    if (!src) continue;
    const storeFrontSlot = presentation?.storeFront?.slot || null;
    entries.push({
      slot: app.slot,
      labelFr: app.labelFr,
      defaultInstalled: src.defaultInstalled !== false,
      storeInstallable: !!src.storeInstallable,
      source: primarySource(src),
      storeFrontSlot,
      postInstallSlot: app.postInstallSlot || resolveSlotManifest(app.slot)?.postInstallSlot || null,
      relatedSlots: app.relatedSlots || null,
      registryId,
    });
  }

  return entries;
};

export const resolveStoreToolkit = (binding) => binding?.storeToolkit || binding?.toolkit || 'gnome';

export const buildStoreAppsByRegistry = () => {
  const bindings = loadPresentationBindings();
  const out = {};
  for (const [registryId, binding] of Object.entries(bindings.bindings || {})) {
    if (binding.storeCatalogStatus === 'deferred') {
      out[registryId] = [];
      continue;
    }
    const entries = buildStoreCatalogEntries(registryId);
    out[registryId] = entries;
  }
  return out;
};
