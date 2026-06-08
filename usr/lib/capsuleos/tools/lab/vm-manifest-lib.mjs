/**
 * Bibliothèque manifeste distribution VM — collecte, validation, dérivation AppV, import rsync.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { encodeMediaCatalogForVm } from './vm-manifest-media-catalog-lib.mjs';
import { loadAppsContract } from './apps-catalog-lib.mjs';
import {
  normalizeDesktopId,
  DESKTOP_DENY_IDS,
} from './vm-desktop-scrape-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_SCRIPT = 'root/tools/lab/vm-distribution-manifest.py';

export const loadManifestContract = () => {
  const p = path.join(ROOT, 'etc/capsuleos/contracts/vm-distribution-manifest.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const pathsForManifest = (registryId) => {
  const procDir = path.join(ROOT, 'proc', registryId);
  return {
    procDir,
    manifest: path.join(procDir, 'distribution-manifest.json'),
    manifestLegacy: path.join(procDir, 'desktop-entries-raw.json'),
  };
};

export const manifestFileName = (manifest) => {
  const slug = manifest?.distribution?.slug
    || `${manifest?.distribution?.id || 'unknown'}-manifest`;
  return `${slug}.json`;
};

const expandHome = (p) => {
  if (!p || p[0] !== '~') return p;
  return path.join(process.env.HOME || '', p.slice(2));
};

export const loadLabHost = (registryId) => {
  const invPath = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
  if (!fs.existsSync(invPath)) throw new Error('etc/capsuleos/lab-inventory.json manquant');
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const remoteEnv = (host) => {
  const parts = [`export DISPLAY=${host.display || ':0'}`];
  if (host.xauthorityDiscovery === 'mutter-xwayland') {
    parts.push('export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)');
  }
  return parts.join('; ');
};

export const runManifestOnVm = (registryId) => {
  const host = loadLabHost(registryId);
  const scriptPath = path.join(ROOT, MANIFEST_SCRIPT);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script absent: ${MANIFEST_SCRIPT}`);
  }
  const body = fs.readFileSync(scriptPath, 'utf8');
  const catalogB64 = encodeMediaCatalogForVm(registryId);
  const entry = loadRegistryEntry(registryId);
  const vendorId = entry.vendor || registryId.replace(/^linux-/, '');
  const remoteCmd = [
    remoteEnv(host),
    `export REGISTRY_ID=${registryId}`,
    `export VENDOR_ID=${vendorId}`,
    `export CAPSULE_MEDIA_CATALOG_B64=${catalogB64}`,
    'python3 -',
  ].join('; ');
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = expandHome(
    process.env.CAPSULE_LAB_SSH_IDENTITY || host.sshIdentity || '~/.ssh/capsuleos-lab',
  );

  const res = spawnSync(
    'ssh',
    [
      '-o', 'BatchMode=yes',
      '-o', 'IdentitiesOnly=yes',
      '-i', identity,
      `${user}@${ip}`,
      remoteCmd,
    ],
    { input: body, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024 },
  );
  if (res.status !== 0) {
    throw new Error(`Manifest VM échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const stdout = (res.stdout || '').trim();
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON manifeste introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

export const loadManifest = (registryId) => {
  const paths = pathsForManifest(registryId);
  if (!fs.existsSync(paths.manifest)) return null;
  return JSON.parse(fs.readFileSync(paths.manifest, 'utf8'));
};

export const writeManifest = (registryId, manifest) => {
  const paths = pathsForManifest(registryId);
  fs.mkdirSync(paths.procDir, { recursive: true });
  fs.writeFileSync(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  const aliasName = manifestFileName(manifest);
  const aliasPath = path.join(paths.procDir, aliasName);
  if (aliasPath !== paths.manifest) {
    fs.writeFileSync(aliasPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return paths;
};

export const validateManifestStructure = (manifest, contract) => {
  const errors = [];
  const required = contract?.requiredFields || [
    'manifestVersion', 'registryId', 'distribution', 'toolkit', 'applications', 'media', 'import',
  ];
  required.forEach((field) => {
    if (manifest[field] === undefined) errors.push(`champ manquant: ${field}`);
  });
  if (!manifest.applications?.entries?.length) {
    errors.push('applications.entries vide');
  }
  if (!manifest.applications?.gridVisible?.length) {
    errors.push('applications.gridVisible vide');
  }
  if (manifest.manifestVersion >= 2) {
    if (!manifest.media?.fonts?.entries?.length) {
      errors.push('media.fonts.entries vide (manifest v2)');
    }
    if (!manifest.media?.mimetypes?.entries?.length) {
      errors.push('media.mimetypes.entries vide (manifest v2)');
    }
    if (!manifest.media?.places?.entries?.length) {
      errors.push('media.places.entries vide (manifest v2)');
    }
  }
  if (manifest.registryId && manifest.toolkit?.id === 'unknown') {
    errors.push('toolkit non détecté sur VM');
  }
  return errors;
};

export const manifestEntriesToDesktopRaw = (manifest) => {
  const entries = (manifest.applications?.entries || []).map((e) => ({
    id: e.id,
    normalizedId: e.normalizedId || normalizeDesktopId(e.id),
    name: e.name || e.nameEn || e.id,
    icon: e.icon || null,
    categories: e.categories || null,
    desktopPath: e.desktopPath || null,
    origin: e.origin || null,
    showInGrid: !!e.showInGrid,
    hideReasons: e.hideReasons || [],
  }));
  return entries;
};

export const manifestToInstalledApps = (registryId, manifest) => {
  const contract = loadAppsContract();
  const apps = contract.registryOverrides?.[registryId]?.apps || {};
  const deny = new Set([
    ...DESKTOP_DENY_IDS,
    ...(loadManifestContract().toolkitDenyIds?.[manifest.toolkit?.id] || []),
  ]);

  return (manifest.applications?.gridVisible || [])
    .filter((e) => !deny.has(e.id) && !deny.has(e.normalizedId))
    .map((e) => {
      const norm = e.normalizedId || normalizeDesktopId(e.id);
      const spec = apps[norm] || apps[e.id];
      return {
        id: norm,
        desktopId: e.id,
        name: e.name || e.nameEn || norm,
        icon: e.icon || null,
        categories: e.categories || null,
        origin: e.origin || null,
        capsuleSlot: spec?.slot ?? null,
        grid: spec?.placement?.overview ?? true,
        dash: spec?.placement?.dash ?? false,
      };
    });
};

export const identitiesForHost = (host) => {
  const list = [];
  if (process.env.CAPSULE_LAB_SSH_IDENTITY) list.push(expandHome(process.env.CAPSULE_LAB_SSH_IDENTITY));
  if (host.sshIdentity) list.push(expandHome(host.sshIdentity));
  (host.sshIdentitiesFallback || ['~/.ssh/capsuleos-lab', '~/.ssh/id_ed25519']).forEach((p) => {
    const abs = expandHome(p);
    if (abs && fs.existsSync(abs)) list.push(abs);
  });
  return [...new Set(list)];
};

export const rsyncFromVm = (host, remotePath, localPath, identity) => {
  const at = host.ssh.indexOf('@');
  const target = `${host.ssh}:${remotePath}`;
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  const sshCmd = `ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ${identity}`;
  const res = spawnSync('rsync', [
    '-az',
    '--ignore-missing-args',
    '-e', sshCmd,
    target,
    localPath,
  ], { encoding: 'utf8' });
  if (res.status !== 0) {
    return { ok: false, error: (res.stderr || res.stdout || '').trim() };
  }
  return { ok: true, localPath };
};
