/**
 * Registre skin des assets icon-pack manifeste (mimetype, places, symbolic…).
 */
import fs from 'fs';
import path from 'path';
import { skinIndexPath } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

export const ICON_PACK_CATEGORIES = new Set([
  'mimetype', 'place', 'emblem', 'symbolic', 'panel', 'font', 'branding', 'wallpaper',
]);

const START = '            <!-- CAPSULE-MANIFEST-ICON-PACK-REFS:START -->';
const END = '            <!-- CAPSULE-MANIFEST-ICON-PACK-REFS:END -->';
const RASTER_EXT = /\.(png|jpe?g|gif)$/i;

const capsuleAssetsAbs = (rel) => path.join(
  ROOT,
  'usr/share/capsuleos/assets',
  rel.replace(/^\.?\/?assets\//, ''),
);

/** Préfère .webp dans les refs skin quand l'asset WebP existe (prepare-web-media). */
export const resolveWebPreferredRelative = (rel) => {
  if (!rel || !RASTER_EXT.test(rel)) return rel;
  const webpRel = rel.replace(RASTER_EXT, '.webp');
  if (fs.existsSync(capsuleAssetsAbs(webpRel))) return webpRel;
  return rel;
};

export const iconPackRefsPath = (registryId) => {
  const skinDir = path.dirname(skinIndexPath(registryId));
  return path.join(skinDir, 'data/manifest-icon-pack-refs.js');
};

export const loadSkinIntegrationContext = (registryId) => {
  const indexPath = skinIndexPath(registryId);
  const skinDir = path.dirname(indexPath);
  const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const refsPath = iconPackRefsPath(registryId);
  const refsContent = fs.existsSync(refsPath) ? fs.readFileSync(refsPath, 'utf8') : '';
  let skinProfile = null;
  const profilePath = path.join(skinDir, 'skin.profile.json');
  if (fs.existsSync(profilePath)) {
    skinProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  }
  return { indexPath, skinDir, indexHtml, refsPath, refsContent, skinProfile };
};

export const skinReferencesAsset = (relAsset, ctx) => {
  if (!relAsset) return false;
  const { indexHtml, refsContent, skinProfile } = ctx;
  const base = path.basename(relAsset);
  const dir = path.dirname(relAsset).split('/').slice(-2).join('/');
  if (indexHtml.includes(relAsset) || indexHtml.includes(base) || (dir && indexHtml.includes(dir))) {
    return true;
  }
  const webRel = resolveWebPreferredRelative(relAsset);
  if (refsContent && (
    refsContent.includes(relAsset)
    || refsContent.includes(webRel)
    || refsContent.includes(`"${base}"`)
  )) {
    return true;
  }
  const packs = skinProfile?.assets?.iconPacks || [];
  if (packs.some((p) => relAsset.startsWith(`${p}/`))) {
    return !!(refsContent && refsContent.includes(relAsset));
  }
  return false;
};

export const buildIconPackRefs = (registryId, playbook) => {
  const items = (playbook?.items || []).filter(
    (i) => ICON_PACK_CATEGORIES.has(i.category) && i.capsuleRelative,
  );
  const byCategory = {};
  for (const item of items) {
    const cat = item.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({
      id: item.id,
      capsuleRelative: resolveWebPreferredRelative(item.capsuleRelative),
      iconName: item.iconName || null,
    });
  }
  const paths = [...new Set(
    items.map((i) => resolveWebPreferredRelative(i.capsuleRelative)),
  )].sort();
  return {
    version: 1,
    registryId,
    generatedAt: new Date().toISOString(),
    source: playbook?.manifestRef || `proc/${registryId}/`,
    iconPack: playbook?.mediaCatalog?.iconPack || null,
    assetPrefix: '../../../usr/share/capsuleos/assets/',
    categories: byCategory,
    paths,
  };
};

export const renderIconPackRefsJs = (refs) => `/* Généré par apply-manifest-refs.mjs — ne pas éditer à la main */
window.CAPSULE_MANIFEST_ICON_PACK_REFS = ${JSON.stringify(refs, null, 2)};
`;

export const patchIndexIconPackScript = (registryId, write) => {
  const ctx = loadSkinIntegrationContext(registryId);
  const scriptTag = '    <script src="./data/manifest-icon-pack-refs.js?v=20260608"></script>';
  let html = ctx.indexHtml;
  if (!html) throw new Error(`index skin absent: ${registryId}`);

  if (html.includes('manifest-icon-pack-refs.js')) {
    return false;
  }

  if (html.includes(START) && html.includes(END)) {
    const block = `${START}\n${scriptTag}\n    ${END}`;
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else {
    const anchors = [
      '<script src="./data/overview-apps-grid.js',
      '<script src="./content/mainMenu-data.js',
    ];
    const anchor = anchors.find((a) => html.includes(a));
    if (!anchor) {
      throw new Error('Ancre skin introuvable pour injecter manifest-icon-pack-refs');
    }
    html = html.replace(anchor, `${scriptTag}\n    ${anchor}`);
  }

  if (write) {
    fs.writeFileSync(ctx.indexPath, html, 'utf8');
  }
  return true;
};

export const writeIconPackRefs = (registryId, playbook, write) => {
  const refs = buildIconPackRefs(registryId, playbook);
  const outPath = iconPackRefsPath(registryId);
  if (write) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, renderIconPackRefsJs(refs), 'utf8');
    patchIndexIconPackScript(registryId, true);
  }
  return { refs, outPath, pathCount: refs.paths.length };
};
