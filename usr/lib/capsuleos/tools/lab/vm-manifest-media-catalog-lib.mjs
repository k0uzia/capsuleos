/**
 * Résolution catalogue médias manifeste — vendor + toolkit + héritage (tous registryId).
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const CATALOG_PATH = path.join(ROOT, 'etc/capsuleos/contracts/vm-manifest-media-catalog.json');

export const loadMediaCatalogContract = () => JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

const mergeArrays = (base, patch) => {
  const merged = [...(Array.isArray(base) ? base : []), ...(Array.isArray(patch) ? patch : [])];
  return [...new Set(merged)];
};

const deepMerge = (base, patch) => {
  if (!base) return patch ? { ...patch } : {};
  if (!patch) return { ...base };
  const out = { ...base };
  for (const [key, val] of Object.entries(patch)) {
    if (key === 'extends') continue;
    if (Array.isArray(val) && Array.isArray(out[key])) {
      out[key] = mergeArrays(out[key], val);
    } else if (val && typeof val === 'object' && !Array.isArray(val) && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = deepMerge(out[key], val);
    } else {
      out[key] = val;
    }
  }
  return out;
};

const substituteVendor = (spec, vendorId) => {
  const json = JSON.stringify(spec);
  return JSON.parse(json.replace(/\{vendor\}/g, vendorId));
};

const resolveEntry = (catalog, entry, stack = new Set()) => {
  if (!entry) return {};
  const ext = entry.extends;
  let base = {};
  if (ext) {
    const key = String(ext);
    if (stack.has(key)) return {};
    stack.add(key);
    if (key.startsWith('toolkit:')) {
      const tid = key.slice(8);
      base = resolveEntry(catalog, catalog.toolkits?.[tid], stack);
    } else if (key.startsWith('vendor:')) {
      const vid = key.slice(7);
      base = resolveEntry(catalog, catalog.vendors?.[vid], stack);
    }
    stack.delete(key);
  }
  const patch = { ...entry };
  delete patch.extends;
  return deepMerge(base, patch);
};

export const toolkitIdForRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  return entry.toolkit?.id || entry.toolkit || 'gnome';
};

export const vendorIdForRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  return entry.vendor || registryId.replace(/^linux-/, '');
};

/** Spécification médias fusionnée pour un registryId (hôte). */
export const resolveVendorMediaSpec = (registryId) => {
  const catalog = loadMediaCatalogContract();
  const vendorId = vendorIdForRegistry(registryId);
  const toolkitId = toolkitIdForRegistry(registryId);

  let spec = {};
  if (catalog.vendors?.[vendorId]) {
    spec = resolveEntry(catalog, catalog.vendors[vendorId]);
  } else if (catalog.toolkits?.[toolkitId]) {
    spec = resolveEntry(catalog, catalog.toolkits[toolkitId]);
  } else {
    spec = catalog.fallback?._gnome || catalog.fallback?.[catalog.defaultVendor] || {};
  }

  return substituteVendor(spec, vendorId);
};

export const encodeMediaCatalogForVm = (registryId) => {
  const catalog = loadMediaCatalogContract();
  const vendorId = vendorIdForRegistry(registryId);
  const toolkitId = toolkitIdForRegistry(registryId);
  const resolved = resolveVendorMediaSpec(registryId);
  const payload = {
    version: catalog.version,
    registryId,
    vendorId,
    toolkitId,
    resolved,
    vendors: catalog.vendors,
    toolkits: catalog.toolkits,
    fallback: catalog.fallback,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const scaffoldVendorEntry = (registryId) => {
  const vendorId = vendorIdForRegistry(registryId);
  const toolkitId = toolkitIdForRegistry(registryId);
  const catalog = loadMediaCatalogContract();
  if (catalog.vendors?.[vendorId]) {
    return { created: false, vendorId, reason: 'exists' };
  }
  const stub = {
    extends: `toolkit:${toolkitId}`,
    iconPack: catalog.toolkits?.[toolkitId]?.iconPack || 'icons/gnome/adwaita',
    note: `Auto-généré pour ${registryId} — affiner après première collecte VM`,
  };
  catalog.vendors[vendorId] = stub;
  return { created: true, vendorId, toolkitId, stub, catalog };
};

export const writeMediaCatalogContract = (catalog) => {
  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
};
