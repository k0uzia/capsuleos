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

const primarySource = (src) => {
  if (!src || typeof src !== 'object') return 'rpm';
  if (src.rpm) return 'rpm';
  if (src.flatpak) return 'flatpak';
  if (src.snap) return 'snap';
  if (src.deb) return 'deb';
  if (src.apt) return 'apt';
  return 'rpm';
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
  const storeFrontSlot = presentation?.storeFront?.slot || 'update_manager';
  const entries = [];

  for (const app of store.apps || []) {
    const src = app.sources?.[registryId];
    if (!src?.storeInstallable) continue;

    const slotManifest = manifest.slots?.[app.slot];
    if (!slotManifest) {
      throw new Error(`slot absent slots-manifest: ${app.slot} (${registryId})`);
    }

    const catalog = app.storeCatalog || {};
    const id = catalogIdForApp(app);
    const postSlot = postInstallSlotFor(app, slotManifest);

    entries.push({
      id,
      storeSlot: app.slot,
      title: app.labelFr,
      sub: catalog.sub || app.labelFr,
      desc: catalog.desc || `${app.labelFr} — installation simulée CapsuleOS.`,
      version: catalog.version || '1.0',
      size: catalog.size || '~5 Mo',
      iconClass: catalog.iconClass || `gnome-software__cardicon--${id}`,
      slot: postSlot,
      source: primarySource(src),
      categories: catalog.categories || ['utilities'],
      placement: catalog.placement || { overview: true },
      storeFrontSlot,
      postInstallSlot: postSlot !== app.slot ? postSlot : null,
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
    const src = app.sources?.[registryId];
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
