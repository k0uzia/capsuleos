/**
 * Profils gate H6 Paramètres GNOME — partagé verify / smoke-h5 / smoke-h6.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { skinIndexPath } from './apps-catalog-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const H5_P1_CONTROLS = new Set(['accent', 'wallpaper', 'hot-corner', 'hot-corners']);

export const parseRegistryId = (argv = process.argv.slice(2), fallback = 'linux-rocky') => {
  const idx = argv.indexOf('--id');
  return idx >= 0 && argv[idx + 1] ? argv[idx + 1] : fallback;
};

export const skinIndexRel = (registryId) => {
  const abs = skinIndexPath(registryId);
  return path.relative(ROOT, abs);
};

export const loadPlaybookTail = (registryId) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-playbook-tail.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};

/** Exigences H6 par registry (évite de calquer Rocky sur Ubuntu). */
export const h6Profile = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const bodyId = entry.referencePaths?.bodyId || entry.bodyId || registryId.replace(/^linux-/, '');
  const tail = loadPlaybookTail(registryId);
  const h5Done = new Set(tail?.h5Completed || []);
  const needsH5P1 = [...h5Done].some((id) => H5_P1_CONTROLS.has(id))
    || (tail?.nextH5 || []).some((n) => H5_P1_CONTROLS.has(n.target));

  const byRegistry = {
    'linux-rocky': {
      requiresHotCorners: true,
      requiresBaseline: true,
      requiresPlaybook: true,
      requiresInteractionInventory: true,
    },
    'linux-ubuntu': {
      requiresHotCorners: false,
      requiresBaseline: false,
      requiresPlaybook: false,
      requiresInteractionInventory: false,
    },
    'linux-alma': {
      requiresHotCorners: false,
      requiresBaseline: false,
      requiresPlaybook: true,
      requiresInteractionInventory: false,
    },
  };

  const base = byRegistry[registryId] || {
    requiresHotCorners: false,
    requiresBaseline: true,
    requiresPlaybook: true,
    requiresInteractionInventory: true,
  };

  return {
    registryId,
    bodyId,
    skinRel: skinIndexRel(registryId),
    skipH5P1: !needsH5P1,
    ...base,
  };
};
