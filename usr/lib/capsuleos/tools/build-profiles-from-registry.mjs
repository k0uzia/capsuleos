#!/usr/bin/env node
/**
 * Génère etc/capsuleos/profiles/*.json depuis os-registry.json (source unique).
 * Chemins relatifs au skin (../../../usr/…) — ressources DE partagées, overrides par distro.
 * Usage : node usr/lib/capsuleos/tools/build-profiles-from-registry.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const OVERRIDES_DIR = path.join(ROOT, 'etc/capsuleos/overrides');

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));

/** Chemins depuis home/<Vendor>/<Skin>/index.html */
const ASSETS = '../../../usr/share/capsuleos/assets';
const APPS = '../../../usr/share/capsuleos/linux/apps';

const TOOLKIT_ICON_PACKS = {
  cinnamon: ['icons/cinnamon'],
  kde: ['icons/kde'],
  gnome: ['icons/gnome'],
  cosmic: ['icons/gnome'],
  pantheon: ['icons/gnome'],
  xfce: ['icons/cinnamon'],
  lxqt: ['icons/cinnamon']
};

const CHROME_DEFAULTS = {
  cinnamon: { toolkitId: 'cinnamon', explorerTemplate: 'nemo', dragMode: 'unified-titlebar' },
  gnome: { toolkitId: 'gnome', explorerTemplate: 'nemo-gnome', dragMode: 'app-headerbar-passthrough' },
  kde: { toolkitId: 'kde', explorerTemplate: 'dolphin', dragMode: 'window-header' },
  cosmic: { toolkitId: 'cosmic', explorerTemplate: 'nemo-cosmic', dragMode: 'app-headerbar-passthrough' }
};

const TERMINAL_PROFILES = {
  mint: 'debian',
  debian: 'debian',
  ubuntu: 'debian',
  fedora: 'fedora',
  rocky: 'rocky',
  alma: 'alma',
  opensuse: 'suse',
  mx: 'debian',
  neon: 'debian',
  popos: 'debian',
  anduin: 'debian'
};

const CHECKLIST_KEYS = {
  'linux-mint': 'mint-checklist',
  'linux-ubuntu': 'ubuntu-checklist',
  'linux-fedora': 'fedora-checklist',
  'linux-rocky': 'rocky-checklist',
  'linux-mx-kde': 'mxkde-checklist'
};

function mergeGlobals(base, override) {
  const out = { ...base };
  Object.keys(override || {}).forEach((key) => {
    const val = override[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && out[key] && typeof out[key] === 'object') {
      out[key] = { ...out[key], ...val };
    } else {
      out[key] = val;
    }
  });
  return out;
}

function buildCapsuleGlobals(entry) {
  const ref = entry.referencePaths || entry;
  const toolkitId = entry.toolkit?.id || 'minimal';
  const explorerTemplate = entry.apps?.explorer?.template;
  const explorerName = entry.apps?.explorer?.displayName || 'Fichiers';
  const embedKey = ref.embedKey || entry.embedKey;

  const globals = {
    CAPSULE_APPS_BASE: APPS,
    CAPSULE_SKIN_BASE: '.',
    CAPSULE_STRINGS_URL: './content/strings.json',
    CAPSULE_EXPLORER_DISPLAY_NAME: explorerName,
    CAPSULE_EXPLORER_TEMPLATE: explorerTemplate,
    CAPSULE_EMBED_SKIN_KEY: embedKey,
    CAPSULE_SITE_HOME: '../../../index.html',
    CAPSULE_LINUX_HUB: ref.facade ? `../../../${ref.facade}` : '../../../OS/linux/index.html',
    CAPSULE_TERMINAL_OS_FAMILY: 'linux',
    CAPSULE_TERMINAL_PROFILE: TERMINAL_PROFILES[entry.vendor] || 'debian'
  };

  const chromeBase = CHROME_DEFAULTS[toolkitId];
  if (chromeBase && explorerTemplate) {
    globals.CAPSULE_WINDOW_CHROME_CONTEXT = {
      ...chromeBase,
      explorerTemplate
    };
  }

  if (toolkitId === 'kde') {
    globals.CAPSULE_EXPLORER_APP_ID = 'dolphin';
    globals.CAPSULE_EXPLORER_SKIN_KEY = 'dolphin';
  }
  if (toolkitId === 'gnome' && explorerTemplate) {
    globals.CAPSULE_EXPLORER_SKIN_KEY = 'nautilus';
  }
  if (CHECKLIST_KEYS[entry.id]) {
    globals.CAPSULE_CHECKLIST_STORAGE_KEY = CHECKLIST_KEYS[entry.id];
  }
  if (entry.id === 'linux-mx-kde') {
    globals.CAPSULE_TERMINAL_USER = 'mx-linux';
    globals.CAPSULE_TERMINAL_HOST = 'mx';
    globals.CAPSULE_TEMPLATE_OVERRIDES = {
      update_manager: `${APPS}/update_manager_kde.html`
    };
  }

  return Object.fromEntries(Object.entries(globals).filter(([, v]) => v != null));
}

function buildProfile(entry) {
  const ref = entry.referencePaths || {};
  const toolkitId = entry.toolkit?.id || 'minimal';
  const profile = {
    id: entry.id,
    version: 2,
    family: entry.family,
    kernelId: entry.kernelId,
    branchId: entry.branchId,
    vendor: entry.vendor,
    displayName: entry.displayName,
    bodyId: ref.bodyId || entry.bodyId || entry.id.replace(/^linux-/, '').replace(/^windows-/, 'win'),
    embedKey: ref.embedKey || entry.embedKey || null,
    tier: entry.tier,
    status: entry.status,
    fidelityLevel: entry.fidelityLevel,
    upstreamId: entry.upstreamId,
    clusterIds: entry.clusterIds || [],
    extends: entry.extends,
    paths: {
      facade: ref.facade || entry.facade || null,
      skin: ref.skin || entry.skin || null
    },
    toolkit: {
      id: toolkitId,
      shell: entry.toolkit?.shellId || entry.toolkit?.shell || 'generic'
    },
    assets: {
      assetsBase: ASSETS,
      toolkitPack: toolkitId !== 'minimal' ? `toolkits/${toolkitId}` : null,
      vendorPack: entry.vendor ? `vendors/${entry.vendor}` : null,
      iconPacks: TOOLKIT_ICON_PACKS[toolkitId] || []
    },
    capsuleGlobals: buildCapsuleGlobals(entry)
  };

  const overridePath = path.join(OVERRIDES_DIR, `${entry.id}.json`);
  if (fs.existsSync(overridePath)) {
    const override = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
    if (override.capsuleGlobals) {
      profile.capsuleGlobals = mergeGlobals(profile.capsuleGlobals, override.capsuleGlobals);
    }
    if (override.assets) {
      profile.assets = { ...profile.assets, ...override.assets };
    }
    Object.assign(profile, override.profile || {});
  }

  return profile;
}

fs.mkdirSync(PROFILES_DIR, { recursive: true });
fs.mkdirSync(OVERRIDES_DIR, { recursive: true });

const linuxWithSkin = registry.entries.filter((e) => e.referencePaths?.skin || e.skin);

linuxWithSkin.forEach((entry) => {
  const profile = buildProfile(entry);
  const outPath = path.join(PROFILES_DIR, `${entry.id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');

  const skinPath = entry.referencePaths?.skin || entry.skin;
  if (skinPath) {
    const skinProfilePath = path.join(ROOT, skinPath.replace(/\/index\.html$/, '/skin.profile.json'));
    fs.mkdirSync(path.dirname(skinProfilePath), { recursive: true });
    fs.writeFileSync(skinProfilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  }
});

for (const file of fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'))) {
  const p = path.join(PROFILES_DIR, file);
  const profile = JSON.parse(fs.readFileSync(p, 'utf8'));
  const regEntry = registry.entries.find((e) => e.id === profile.id);
  if (regEntry) {
    const refreshed = buildProfile(regEntry);
    fs.writeFileSync(p, `${JSON.stringify(refreshed, null, 2)}\n`, 'utf8');
    const skinPath = regEntry.referencePaths?.skin;
    if (skinPath) {
      const skinProfilePath = path.join(ROOT, skinPath.replace(/\/index\.html$/, '/skin.profile.json'));
      if (fs.existsSync(path.dirname(skinProfilePath))) {
        fs.writeFileSync(skinProfilePath, `${JSON.stringify(refreshed, null, 2)}\n`, 'utf8');
      }
    }
  }
}

console.log(`Profils générés : ${linuxWithSkin.length} Linux avec skin`);

const buildSkin = path.join(__dirname, 'build-skin-profiles.mjs');
spawnSync(process.execPath, [buildSkin], { stdio: 'inherit', cwd: ROOT });
