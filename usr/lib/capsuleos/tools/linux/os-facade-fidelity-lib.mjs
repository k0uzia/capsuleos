/**
 * Fidélité façade pick-os — URL /OS/.../index.html (base → home/).
 * Rocky : entrée canonique utilisateur ; les smokes Playwright doivent charger cette URL.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRegistryEntry } from '../lab/replication-chain-lib.mjs';
import { loadVisualFidelityContract, visualFidelityPath } from '../lab/visual-fidelity-lib.mjs';
import {
  LINUX_SKIN_FACADES,
  buildFacadeHtml,
  expectedFacadePath,
  readCanonicalSkinIndex,
} from './linux-skin-facade-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

const normalizeSkinHome = (skinPath) => (skinPath || '').replace(/\/index\.html$/i, '');

export const facadeMapForRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const skinRel = normalizeSkinHome(entry.referencePaths?.skin || entry.skin);
  const map = LINUX_SKIN_FACADES.find(({ home }) => home === skinRel);
  if (!map) {
    throw new Error(`${registryId}: skin ${skinRel} absent de LINUX_SKIN_FACADES`);
  }
  return { entry, map };
};

export const resolveOsFacadeRel = (registryId) => {
  const { entry } = facadeMapForRegistry(registryId);
  return entry.referencePaths?.facade || entry.facade;
};

export const resolveCapsuleOsUrl = (registryId, httpBase) => {
  const facadeRel = resolveOsFacadeRel(registryId);
  const base = (httpBase || process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500').replace(/\/$/, '');
  return `${base}/${facadeRel}`;
};

export const readOsFacadeHtml = (registryId) => {
  const { map } = facadeMapForRegistry(registryId);
  const facadePath = expectedFacadePath(map.facade);
  if (!fs.existsSync(facadePath)) {
    throw new Error(`Façade introuvable: OS/linux/${map.facade}/index.html`);
  }
  return fs.readFileSync(facadePath, 'utf8');
};

export const validateOsFacadeFidelity = (registryId) => {
  const errors = [];
  let ctx;
  try {
    ctx = facadeMapForRegistry(registryId);
  } catch (e) {
    return [e.message];
  }
  const { entry, map } = ctx;
  const bodyId = entry.referencePaths?.bodyId || entry.bodyId || registryId.replace('linux-', '');
  const facadePath = expectedFacadePath(map.facade);

  let canonical;
  try {
    canonical = readCanonicalSkinIndex(map.home);
  } catch (e) {
    return [e.message];
  }

  const expected = buildFacadeHtml(map.home, canonical, map.facade);
  if (!fs.existsSync(facadePath)) {
    return [`Façade manquante: OS/linux/${map.facade}/index.html`];
  }

  const onDisk = fs.readFileSync(facadePath, 'utf8');
  if (onDisk !== expected) {
    errors.push(
      `Façade OS désynchronisée (${registryId}): OS/linux/${map.facade}/index.html ≠ ${map.home}/ — sync-linux-skin-closure.mjs`,
    );
  }

  if (!/<base\s+href="/i.test(onDisk)) {
    errors.push(`Façade ${registryId}: <base href> absent`);
  }
  if (!onDisk.includes(`id="${bodyId}"`)) {
    errors.push(`Façade ${registryId}: body#${bodyId} absent`);
  }
  if (!onDisk.includes(`CAPSULE_SKIN_PROFILE_ID = '${registryId}'`)) {
    errors.push(`Façade ${registryId}: CAPSULE_SKIN_PROFILE_ID = '${registryId}' absent`);
  }
  if (!onDisk.includes('capsule-skin-boot.js')) {
    errors.push(`Façade ${registryId}: capsule-skin-boot.js absent`);
  }
  if (!onDisk.includes('explorer-registry.js')) {
    errors.push(`Façade ${registryId}: explorer-registry.js absent`);
  }

  const contract = loadVisualFidelityContract();
  const defaults = contract.registryDefaults?.[registryId];
  if (defaults?.typography?.tokenFile) {
    const tokenName = path.basename(defaults.typography.tokenFile);
    if (!onDisk.includes(tokenName)) {
      errors.push(`Façade ${registryId}: ${tokenName} non lié dans <head>`);
    }
  }

  if (fs.existsSync(visualFidelityPath(registryId))) {
    const inv = JSON.parse(fs.readFileSync(visualFidelityPath(registryId), 'utf8'));
    const cssFile = inv.typography?.fontEmbedding?.cssFile;
    if (cssFile) {
      const fontCss = path.basename(cssFile);
      if (!onDisk.includes(fontCss)) {
        errors.push(`Façade ${registryId}: ${fontCss} absent (polices embarquées)`);
      }
    }
    if (!onDisk.includes('style/imports.css')) {
      errors.push(`Façade ${registryId}: style/imports.css absent (chaîne CSS + a11y)`);
    }
  }

  const skinHtml = fs.readFileSync(path.join(ROOT, map.home, 'index.html'), 'utf8');
  if (/<base\s+href=/i.test(skinHtml)) {
    errors.push(`${map.home}/index.html ne doit pas contenir <base> (réservé à la façade OS)`);
  }

  return errors;
};
