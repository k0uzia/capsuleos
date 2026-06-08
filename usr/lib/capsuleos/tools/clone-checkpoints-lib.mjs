/**
 * Bibliothèque partagée — checkpoints post-clonage (assets + captures).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_FROM_TOOLS = path.resolve(__dirname, '../../../..');

export const loadRegistry = (root) => {
  const registryPath = path.join(root, 'etc/capsuleos/os-registry.json');
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
};

/**
 * Entrées actives avec skin sous home/ (Linux desktop simulé).
 */
export const listCloneTargets = (root, opts = {}) => {
  const registry = loadRegistry(root);
  let entries = registry.entries.filter((e) => {
    if (e.status !== 'active') return false;
    if (!e.skin || !e.skin.startsWith('home/')) return false;
    if (e.family !== 'linux') return false;
    return fs.existsSync(path.join(root, e.skin));
  });
  if (opts.tier) {
    entries = entries.filter((e) => e.tier === opts.tier);
  }
  if (opts.ids && opts.ids.length) {
    const set = new Set(opts.ids);
    entries = entries.filter((e) => set.has(e.id));
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
};

/** Fichiers noyau additionnels à scanner (catalogues menu, etc.). */
export const EXTRA_KERNEL_BY_ID = {
  'linux-mint': ['usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js'],
};
