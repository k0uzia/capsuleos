#!/usr/bin/env node
/**
 * Génère etc/capsuleos/profiles/*.json + skin.profile.json miroirs home/OS
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = '../../../usr/share/capsuleos/assets';
const APPS = '../../../usr/share/capsuleos/linux/apps';

const TOOLKIT_ICON_PACKS = {
  cinnamon: ['icons/cinnamon'],
  kde: ['icons/kde'],
  gnome: ['icons/gnome'],
  cosmic: ['icons/gnome'],
};

const profiles = [
  { id: 'linux-ubuntu', bodyId: 'ubuntu', vendor: 'ubuntu', displayName: 'Ubuntu 25.10', tier: 'P0', facade: 'OS/linux/families/debian/ubuntu/index.html', skin: 'home/Debian/Ubuntu/index.html', toolkit: 'gnome', explorerTemplate: 'nemo-gnome', explorerName: 'Fichiers', embedKey: 'ubuntu', checklistKey: 'ubuntu-checklist', explorerSkinKey: 'nemo-gnome', terminalProfile: 'debian' },
  { id: 'linux-fedora', bodyId: 'fedora', vendor: 'fedora', displayName: 'Fedora Workstation', tier: 'P1', facade: 'OS/linux/families/redhat/fedora/index.html', skin: 'home/RedHat/Fedora/index.html', toolkit: 'gnome', explorerTemplate: 'nemo', explorerName: 'Fichiers', embedKey: 'fedora', checklistKey: 'fedora-checklist', terminalProfile: 'fedora' },
  { id: 'linux-mx-kde', bodyId: 'mx-kde', vendor: 'mx', displayName: 'MX Linux KDE', tier: 'P1', facade: 'OS/linux/families/debian/mx-kde/index.html', skin: 'home/Debian/MX-KDE/index.html', toolkit: 'kde', explorerTemplate: 'dolphin', explorerName: 'Dolphin', embedKey: 'mxkde', checklistKey: 'mxkde-checklist', kde: true, terminalUser: 'mx-linux', terminalHost: 'mx', templateOverrides: { update_manager: `${APPS}/update_manager_kde.html` } },
  { id: 'linux-debian-kde', bodyId: 'debian-kde', vendor: 'debian', displayName: 'Debian KDE (Plasma)', tier: 'P2', facade: 'OS/linux/families/debian/debian-kde/index.html', skin: 'home/Debian/Debian-KDE/index.html', toolkit: 'kde', explorerTemplate: 'dolphin', explorerName: 'Dolphin', embedKey: 'debiankde', kde: true },
  { id: 'linux-opensuse', bodyId: 'opensuse', vendor: 'opensuse', displayName: 'openSUSE Tumbleweed', tier: 'P1', facade: 'OS/linux/families/suse/opensuse/index.html', skin: 'home/SUSE/openSUSE/index.html', toolkit: 'kde', explorerTemplate: 'dolphin', explorerName: 'Dolphin', embedKey: 'opensuse', kde: true },
  { id: 'linux-popos', bodyId: 'popos', vendor: 'popos', displayName: 'Pop!_OS', tier: 'P2', facade: 'OS/linux/families/debian/popos/index.html', skin: 'home/Debian/PopOS/index.html', toolkit: 'cosmic', explorerTemplate: 'nemo-cosmic', explorerName: 'Fichiers', embedKey: 'popos' },
  { id: 'linux-anduinos', bodyId: 'anduinos', vendor: 'anduin', displayName: 'AnduinOS', tier: 'P3', facade: 'OS/linux/families/debian/anduinos/index.html', skin: 'home/Debian/AnduinOS/index.html', toolkit: 'gnome', explorerTemplate: 'nemo-gnome', explorerName: 'Fichiers', embedKey: 'anduinos' },
];

const buildProfile = (row) => {
  const globals = {
    CAPSULE_APPS_BASE: APPS,
    CAPSULE_SKIN_BASE: '.',
    CAPSULE_STRINGS_URL: './content/strings.json',
    CAPSULE_EXPLORER_DISPLAY_NAME: row.explorerName,
    CAPSULE_EXPLORER_TEMPLATE: row.explorerTemplate,
    CAPSULE_EMBED_SKIN_KEY: row.embedKey,
    CAPSULE_SITE_HOME: '../../../index.html',
    CAPSULE_LINUX_HUB: '../../../OS/linux/index.html',
    CAPSULE_TERMINAL_OS_FAMILY: 'linux',
    CAPSULE_TERMINAL_PROFILE: row.terminalProfile || 'debian',
  };
  if (row.checklistKey) globals.CAPSULE_CHECKLIST_STORAGE_KEY = row.checklistKey;
  if (row.explorerSkinKey) globals.CAPSULE_EXPLORER_SKIN_KEY = row.explorerSkinKey;
  if (row.toolkit === 'kde') {
    globals.CAPSULE_EXPLORER_APP_ID = 'nemo';
    globals.CAPSULE_EXPLORER_SKIN_KEY = 'dolphin';
  }
  if (row.templateOverrides) globals.CAPSULE_TEMPLATE_OVERRIDES = row.templateOverrides;
  if (row.terminalUser) globals.CAPSULE_TERMINAL_USER = row.terminalUser;
  if (row.terminalHost) globals.CAPSULE_TERMINAL_HOST = row.terminalHost;

  const assets = {
    assetsBase: ASSETS,
    toolkitPack: `toolkits/${row.toolkit === 'kde' ? 'kde' : row.toolkit}`,
    vendorPack: `vendors/${row.vendor}`,
    iconPacks: TOOLKIT_ICON_PACKS[row.toolkit] || [],
  };

  return {
    id: row.id,
    version: 1,
    family: 'linux',
    vendor: row.vendor,
    displayName: row.displayName,
    bodyId: row.bodyId,
    embedKey: row.embedKey,
    tier: row.tier,
    status: 'active',
    paths: { facade: row.facade, skin: row.skin },
    toolkit: { id: row.toolkit, shell: row.toolkit === 'kde' ? 'plasma' : row.toolkit },
    assets,
    capsuleGlobals: globals,
  };
};

const profDir = path.join(ROOT, 'etc/capsuleos/profiles');
fs.mkdirSync(profDir, { recursive: true });

profiles.forEach((row) => {
  const profile = buildProfile(row);
  const json = `${JSON.stringify(profile, null, 2)}\n`;
  fs.writeFileSync(path.join(profDir, `${row.id}.json`), json);
  [row.skin, row.facade].forEach((rel) => {
    const dir = path.dirname(path.join(ROOT, rel));
    fs.writeFileSync(path.join(dir, 'skin.profile.json'), json);
  });
  console.log('profile', row.id);
});
