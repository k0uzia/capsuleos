/**
 * Bibliothèque playbook de réplication dérivé du manifeste VM.
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { loadManifest, pathsForManifest } from './vm-manifest-lib.mjs';
import { loadAppsContract, skinIndexPath } from './apps-catalog-lib.mjs';

export const playbookPath = (registryId) => {
  const manifest = loadManifest(registryId);
  const slug = manifest?.distribution?.slug?.replace(/-manifest$/, '')
    || loadRegistryEntry(registryId).vendor
    || registryId.replace(/^linux-/, '');
  return path.join(ROOT, 'proc', registryId, `${slug}-manifest-playbook.json`);
};

export const stagingRemoteDir = (registryId) => (
  `~/capsuleos-lab/staging/${registryId}`
);

export const capsuleAssetPath = (relative) => path.join(
  ROOT,
  'usr/share/capsuleos/assets',
  relative.replace(/^\.?\/?assets\//, '').replace(/^images\//, 'images/'),
);

export const normalizeCapsuleTarget = (target) => {
  if (!target) return null;
  return target
    .replace(/^usr\/share\/capsuleos\/assets\//, '')
    .replace(/\/$/, '');
};

const fileExists = (abs) => {
  try {
    return fs.existsSync(abs) && fs.statSync(abs).isFile();
  } catch {
    return false;
  }
};

const skinReferencesTarget = (indexHtml, relAsset) => {
  const base = path.basename(relAsset);
  const dir = path.dirname(relAsset).split('/').slice(-2).join('/');
  return indexHtml.includes(relAsset)
    || indexHtml.includes(base)
    || (dir && indexHtml.includes(dir));
};

export const buildReplicationItems = (registryId) => {
  const manifest = loadManifest(registryId);
  if (!manifest) throw new Error(`Manifeste absent: ${registryId}`);

  const appsContract = loadAppsContract();
  const overrides = appsContract.registryOverrides?.[registryId]?.apps || {};
  const indexPath = skinIndexPath(registryId);
  const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

  const items = [];
  const seen = new Set();

  const pushItem = (item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  for (const icon of manifest.media?.appIcons || []) {
    const vmPath = icon.vmPaths?.[0];
    if (!vmPath) continue;
    const rel = normalizeCapsuleTarget(icon.capsuleTarget);
    const capsuleAbs = rel ? capsuleAssetPath(rel) : null;
    const ext = path.extname(vmPath) || '.png';
    const destName = `${icon.appId}${ext}`;
    const present = capsuleAbs && fileExists(capsuleAbs);
    const referenced = present && rel && skinReferencesTarget(indexHtml, rel);
    const spec = overrides[icon.appId];
    if (spec?.onVm === false) {
      pushItem({
        id: `app-icon-${icon.appId}`,
        category: 'app-icon',
        appId: icon.appId,
        vmPath,
        capsuleRelative: rel,
        capsuleAbs,
        stagingPath: `apps/${destName}`,
        status: 'on-vm-false',
        action: 'skip',
      });
      continue;
    }
    let status = 'pull';
    let action = 'pull';
    if (present && referenced) {
      status = 'skip';
      action = 'skip';
    } else if (present && !referenced) {
      status = 'drift';
      action = 'rewrite-ref';
    }
    pushItem({
      id: `app-icon-${icon.appId}`,
      category: 'app-icon',
      appId: icon.appId,
      vmPath,
      capsuleRelative: rel,
      capsuleAbs,
      stagingPath: `apps/${destName}`,
      status,
      action,
    });
  }

  const vendor = manifest.distribution?.id || 'unknown';
  const iconPack = manifest.media?.iconPack || 'icons/gnome/adwaita';
  const classifyEntry = (base) => {
    const vmPath = base.vmPath;
    if (!vmPath) return;
    const rel = normalizeCapsuleTarget(
      base.capsuleTarget || base.capsuleRelative
        || (base.category === 'mimetype' && base.iconName
          ? `${iconPack}/mimetypes/${base.iconName}.svg`
          : null),
    );
    const capsuleAbs = rel ? capsuleAssetPath(rel) : null;
    const ext = path.extname(vmPath) || path.extname(rel || '') || '.png';
    const stagingName = base.stagingName || `${path.basename(rel || base.id || 'asset', path.extname(rel || ''))}${ext}`;
    const present = capsuleAbs && fileExists(capsuleAbs);
    const referenced = present && rel && skinReferencesTarget(indexHtml, rel);
    let status = 'pull';
    let action = 'pull';
    if (present && referenced) {
      status = 'skip';
      action = 'skip';
    } else if (present && !referenced) {
      status = 'drift';
      action = 'rewrite-ref';
    }
    pushItem({
      ...base,
      vmPath,
      capsuleRelative: rel,
      capsuleAbs,
      stagingPath: base.stagingPath || `${base.category || 'icons'}/${stagingName}`,
      status,
      action,
    });
  };

  for (const font of manifest.media?.fonts?.entries || []) {
    classifyEntry({
      id: `font-${path.basename(font.vmPath)}`,
      category: 'font',
      stagingPath: `fonts/${path.basename(font.vmPath)}`,
      vmPath: font.vmPath,
      capsuleTarget: font.capsuleTarget,
    });
  }

  for (const mime of manifest.media?.mimetypes?.entries || []) {
    classifyEntry({
      id: `mime-${mime.iconName}`,
      category: 'mimetype',
      stagingPath: `mimetypes/${path.basename(mime.vmPath)}`,
      ...mime,
    });
  }

  for (const place of manifest.media?.places?.entries || []) {
    classifyEntry({
      id: `place-${place.iconName}`,
      category: 'place',
      stagingPath: `places/${path.basename(place.vmPath)}`,
      ...place,
    });
  }

  for (const emblem of manifest.media?.emblems?.entries || []) {
    classifyEntry({
      id: `emblem-${emblem.iconName}`,
      category: 'emblem',
      stagingPath: `emblems/${path.basename(emblem.vmPath)}`,
      ...emblem,
    });
  }

  for (const sub of ['actions', 'places', 'status']) {
    for (const sym of manifest.media?.symbolic?.[sub] || []) {
      classifyEntry({
        id: `symbolic-${sub}-${sym.iconName}`,
        category: 'symbolic',
        stagingPath: `symbolic/${sub}/${path.basename(sym.vmPath)}`,
        ...sym,
      });
    }
  }

  for (const panel of manifest.media?.panel?.entries || []) {
    classifyEntry({
      id: `panel-${panel.iconName}`,
      category: 'panel',
      stagingPath: `panel/${path.basename(panel.vmPath)}`,
      ...panel,
    });
  }

  if (manifest.media?.branding?.vmPath) {
    classifyEntry({
      id: 'branding-logo',
      category: 'branding',
      stagingPath: `branding/${path.basename(manifest.media.branding.vmPath)}`,
      vmPath: manifest.media.branding.vmPath,
      capsuleTarget: manifest.media.branding.capsuleTarget,
    });
  }

  for (const wp of manifest.media?.wallpapers || []) {
    if (!wp.vmPath) continue;
    const rel = `images/vendors/${vendor}/wallpaper/${path.basename(wp.vmPath)}`;
    const capsuleAbs = capsuleAssetPath(rel);
    const present = fileExists(capsuleAbs);
    const referenced = present && skinReferencesTarget(indexHtml, rel);
    let status = 'pull';
    let action = 'pull';
    if (present && referenced) {
      status = 'skip';
      action = 'skip';
    } else if (present && !referenced) {
      status = 'drift';
      action = 'rewrite-ref';
    }
    pushItem({
      id: `wallpaper-${path.basename(wp.vmPath)}`,
      category: 'wallpaper',
      vmPath: wp.vmPath,
      capsuleRelative: rel,
      capsuleAbs,
      stagingPath: `wallpaper/${path.basename(wp.vmPath)}`,
      status,
      action,
    });
  }

  return items;
};

export const buildPlaybook = (registryId) => {
  const manifest = loadManifest(registryId);
  const items = buildReplicationItems(registryId);
  const summary = {
    total: items.length,
    pull: items.filter((i) => i.action === 'pull').length,
    drift: items.filter((i) => i.action === 'rewrite-ref').length,
    skip: items.filter((i) => i.action === 'skip').length,
    onVmFalse: items.filter((i) => i.status === 'on-vm-false').length,
  };

  return {
    version: 1,
    registryId,
    manifestRef: pathsForManifest(registryId).manifest.replace(`${ROOT}/`, ''),
    distribution: manifest.distribution,
    toolkit: manifest.toolkit,
    mediaCatalog: {
      vendor: manifest.mediaCatalogVendor || vendor,
      iconPack: manifest.media?.iconPack || null,
    },
    generatedAt: new Date().toISOString(),
    source: 'generate-manifest-replication-playbook.mjs',
    validation: { status: 'draft', approved: false },
    staging: {
      remoteDir: stagingRemoteDir(registryId),
      remoteScript: 'root/tools/lab/vm-manifest-staging-collect.sh',
      status: 'pending',
    },
    import: {
      method: 'rsync',
      localStagingDir: `proc/${registryId}/staging`,
      destAssetsRoot: 'usr/share/capsuleos/assets',
      status: 'pending',
    },
    summary,
    items,
    phases: [
      { id: 'discover', predicate: 'ManV', status: 'done' },
      { id: 'diff', predicate: 'PbM', status: 'generated' },
      { id: 'approve', predicate: 'ManA', status: 'pending' },
      { id: 'stage-vm', predicate: 'ManSt', status: 'pending' },
      { id: 'import', predicate: 'ManI', status: 'pending' },
      { id: 'integrate-skin', predicate: 'H5', status: 'pending' },
    ],
  };
};

export const loadPlaybook = (registryId) => {
  const p = playbookPath(registryId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const writePlaybook = (registryId, playbook) => {
  const p = playbookPath(registryId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(playbook, null, 2)}\n`);
  return p;
};

export const itemsToPull = (playbook) => (
  (playbook?.items || []).filter((i) => i.action === 'pull' || i.action === 'rewrite-ref')
);
