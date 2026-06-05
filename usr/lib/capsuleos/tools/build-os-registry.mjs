#!/usr/bin/env node
/**
 * Génère etc/capsuleos/os-registry.json (entrées complètes).
 * Usage : node usr/lib/capsuleos/tools/build-os-registry.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const SOURCING = path.join(ROOT, 'etc/capsuleos/os-sourcing.json');

const sourcingOverlay = fs.existsSync(SOURCING)
  ? JSON.parse(fs.readFileSync(SOURCING, 'utf8'))
  : { entries: {}, assetPolicy: {} };

const mergeSourcing = (entry) => {
  const extra = sourcingOverlay.entries?.[entry.id];
  if (!extra) {
    return entry;
  }
  const merged = { ...entry, ...extra };
  if (entry.sources && extra.sources) {
    merged.sources = [...entry.sources, ...extra.sources];
  }
  return merged;
};

const S = (id, o) => mergeSourcing({ id, ...o });

const linuxActive = [
  S('linux-mint', { family: 'linux', vendor: 'mint', displayName: 'Linux Mint (Cinnamon)', tier: 'P0', status: 'active', maturity: 0.95, facade: 'OS/linux/families/debian/mint/index.html', skin: 'home/Debian/Mint/index.html', toolkit: 'cinnamon', shell: 'cinnamon', fileManager: 'Nemo', explorerTemplate: 'nemo', embedKey: 'mint', bodyId: 'mint', skills: ['os-linux'], sources: [{ type: 'design', label: 'Cinnamon', url: 'https://projects.linuxmint.com/cinnamon/' }] }),
  S('linux-ubuntu', { family: 'linux', vendor: 'ubuntu', displayName: 'Ubuntu 25.10', tier: 'P0', status: 'active', maturity: 0.75, facade: 'OS/linux/families/debian/ubuntu/index.html', skin: 'home/Debian/Ubuntu/index.html', toolkit: 'gnome', shell: 'gnome-shell', fileManager: 'Fichiers', explorerTemplate: 'nemo-gnome', embedKey: 'ubuntu', bodyId: 'ubuntu', skills: ['os-linux'], sources: [{ type: 'hig', label: 'GNOME HIG', url: 'https://developer.gnome.org/hig/' }] }),
  S('linux-fedora', { family: 'linux', vendor: 'fedora', displayName: 'Fedora Workstation', tier: 'P1', status: 'active', maturity: 0.65, facade: 'OS/linux/families/redhat/fedora/index.html', skin: 'home/RedHat/Fedora/index.html', toolkit: 'gnome', shell: 'gnome-shell', fileManager: 'Fichiers', explorerTemplate: 'nemo', embedKey: 'fedora', bodyId: 'fedora', skills: ['os-linux'] }),
  S('linux-mx-kde', { family: 'linux', vendor: 'mx', displayName: 'MX Linux KDE', tier: 'P1', status: 'active', maturity: 0.85, facade: 'OS/linux/families/debian/mx-kde/index.html', skin: 'home/Debian/MX-KDE/index.html', toolkit: 'kde', shell: 'plasma', fileManager: 'Dolphin', explorerTemplate: 'dolphin', embedKey: 'mxkde', bodyId: 'mx-kde', skills: ['os-linux'], assetPacks: ['toolkits/kde', 'vendors/mx'] }),
  S('linux-debian-kde', { family: 'linux', vendor: 'debian', displayName: 'Debian KDE (Plasma)', tier: 'P2', status: 'active', maturity: 0.7, facade: 'OS/linux/families/debian/debian-kde/index.html', skin: 'home/Debian/Debian-KDE/index.html', toolkit: 'kde', shell: 'plasma', fileManager: 'Dolphin', explorerTemplate: 'dolphin', embedKey: 'debiankde', bodyId: 'debian-kde', skills: ['os-linux'] }),
  S('linux-kde-neon', { family: 'linux', vendor: 'neon', displayName: 'KDE neon User Edition', tier: 'P2', status: 'active', maturity: 0.5, facade: 'OS/linux/families/debian/kde-neon/index.html', skin: 'home/Debian/KDE-Neon/index.html', toolkit: 'kde', shell: 'plasma', fileManager: 'Dolphin', explorerTemplate: 'dolphin', embedKey: 'kde-neon', bodyId: 'kde-neon', skills: ['os-linux'], assetPacks: ['toolkits/kde', 'vendors/neon'] }),
  S('linux-opensuse', { family: 'linux', vendor: 'opensuse', displayName: 'openSUSE Tumbleweed', tier: 'P1', status: 'active', maturity: 0.85, facade: 'OS/linux/families/suse/opensuse/index.html', skin: 'home/SUSE/openSUSE/index.html', toolkit: 'kde', shell: 'plasma', fileManager: 'Dolphin', explorerTemplate: 'dolphin', embedKey: 'opensuse', bodyId: 'opensuse', skills: ['os-linux'] }),
  S('linux-popos', { family: 'linux', vendor: 'popos', displayName: 'Pop!_OS', tier: 'P2', status: 'active', maturity: 0.55, facade: 'OS/linux/families/debian/popos/index.html', skin: 'home/Debian/PopOS/index.html', toolkit: 'cosmic', shell: 'cosmic', fileManager: 'Fichiers', explorerTemplate: 'nemo-cosmic', embedKey: 'popos', bodyId: 'popos', skills: ['os-linux'] }),
  S('linux-anduinos', { family: 'linux', vendor: 'anduin', displayName: 'AnduinOS', tier: 'P3', status: 'active', maturity: 0.5, facade: 'OS/linux/families/debian/anduinos/index.html', skin: 'home/Debian/AnduinOS/index.html', toolkit: 'gnome', shell: 'anduin-shell', fileManager: 'Fichiers', explorerTemplate: 'nemo-gnome', embedKey: 'anduinos', bodyId: 'anduinos', skills: ['os-linux'] })
];

const linuxPlanned = [
  S('linux-arch', { family: 'linux', vendor: 'arch', displayName: 'Arch Linux', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'minimal', shell: 'configurable', fileManager: 'variable', skills: ['os-linux'], sources: [{ type: 'wiki', label: 'Arch Wiki', url: 'https://wiki.archlinux.org/' }] }),
  S('linux-manjaro-kde', { family: 'linux', vendor: 'manjaro', displayName: 'Manjaro KDE', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'kde', shell: 'plasma', fileManager: 'Dolphin', explorerTemplate: 'dolphin', skills: ['os-linux'] }),
  S('linux-manjaro-gnome', { family: 'linux', vendor: 'manjaro', displayName: 'Manjaro GNOME', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'gnome', shell: 'gnome-shell', fileManager: 'Fichiers', skills: ['os-linux'] }),
  S('linux-elementary', { family: 'linux', vendor: 'elementary', displayName: 'elementary OS', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'pantheon', shell: 'pantheon', fileManager: 'Fichiers', skills: ['os-linux'], sources: [{ type: 'hig', label: 'Human Interface Guidelines', url: 'https://docs.elementary.io/hig/' }] }),
  S('linux-zorin', { family: 'linux', vendor: 'zorin', displayName: 'Zorin OS', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'gnome', shell: 'zorin-shell', fileManager: 'Fichiers', skills: ['os-linux'] }),
  S('linux-rocky', { family: 'linux', vendor: 'rocky', displayName: 'Rocky Linux (GNOME)', tier: 'P3', status: 'active', maturity: 0.35, facade: 'OS/linux/families/redhat/rocky/index.html', skin: 'home/RedHat/Rocky/index.html', toolkit: 'gnome', shell: 'gnome-shell', fileManager: 'Fichiers', explorerTemplate: 'nemo-gnome', embedKey: 'rocky', bodyId: 'rocky', skills: ['os-linux'] }),
  S('linux-alma', { family: 'linux', vendor: 'alma', displayName: 'AlmaLinux (GNOME)', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'gnome', shell: 'gnome-shell', fileManager: 'Fichiers', skills: ['os-linux'] }),
  S('linux-kali', { family: 'linux', vendor: 'kali', displayName: 'Kali Linux', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'xfce', shell: 'xfce', fileManager: 'Thunar', skills: ['os-linux'], sources: [{ type: 'wiki', label: 'Xfce docs', url: 'https://docs.xfce.org/' }] }),
  S('linux-steamos', { family: 'linux', vendor: 'valve', displayName: 'SteamOS / Steam Deck UI', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'kde', shell: 'gamescope-steam', fileManager: 'Dolphin', skills: ['os-linux'] }),
  S('linux-nixos', { family: 'linux', vendor: 'nixos', displayName: 'NixOS (concept)', tier: 'P4', status: 'stub', maturity: 0, toolkit: 'configurable', shell: 'configurable', fileManager: 'variable', skills: ['os-linux'] }),
  S('linux-slackware', { family: 'linux', vendor: 'slackware', displayName: 'Slackware', tier: 'P4', status: 'planned', maturity: 0, toolkit: 'xfce', shell: 'xfce', fileManager: 'Thunar', skills: ['os-linux'] }),
  S('linux-gentoo', { family: 'linux', vendor: 'gentoo', displayName: 'Gentoo (minimal)', tier: 'P4', status: 'stub', maturity: 0, toolkit: 'minimal', shell: 'openrc', fileManager: 'variable', skills: ['os-linux'] }),
  S('linux-xubuntu', { family: 'linux', vendor: 'ubuntu', displayName: 'Xubuntu (Xfce)', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'xfce', shell: 'xfce', fileManager: 'Thunar', skills: ['os-linux'] }),
  S('linux-lxqt', { family: 'linux', vendor: 'generic', displayName: 'LXQt (générique)', tier: 'P4', status: 'planned', maturity: 0, toolkit: 'lxqt', shell: 'lxqt', fileManager: 'PCManFM-Qt', skills: ['os-linux'] })
];

const windowsVersions = [
  ['95', 'Windows 95', 0.4], ['98', 'Windows 98', 0.4], ['me', 'Windows ME', 0.35],
  ['2000', 'Windows 2000', 0.45], ['xp', 'Windows XP', 0.7], ['vista', 'Windows Vista', 0.5],
  ['7', 'Windows 7', 0.75], ['8', 'Windows 8', 0.55], ['8.1', 'Windows 8.1', 0.55],
  ['10', 'Windows 10', 0.8], ['11', 'Windows 11', 0.85]
].map(([ver, name, mat]) => {
  const tier = (ver === '10' || ver === '11') ? 'P0' : (ver === 'xp' || ver === '7') ? 'P1' : 'P2';
  return S(`windows-${ver}`, {
  family: 'windows', vendor: 'microsoft', displayName: name, tier,
  status: 'active', maturity: mat, facade: `OS/windows/versions/${ver}/index.html`, toolkit: 'windows-shell',
  shell: ver === '11' ? 'win11-shell' : ver === '10' ? 'win10-shell' : `win${ver}-shell`,
  fileManager: 'Explorateur', embedKey: `win${ver}`, skills: ['os-windows'],
  sources: [{ type: 'design', label: 'Microsoft Design (WinUI)', url: 'https://learn.microsoft.com/windows/apps/design/' }]
});
});

const macosVersions = [
  S('macos-sonoma', { family: 'macos', vendor: 'apple', displayName: 'macOS Sonoma', tier: 'P1', status: 'active', maturity: 0.6, facade: 'OS/macos/sonoma/index.html', toolkit: 'macos-aqua', shell: 'aqua', fileManager: 'Finder', embedKey: 'sonoma', skills: ['os-macos'], sources: [{ type: 'hig', label: 'Apple HIG', url: 'https://developer.apple.com/design/human-interface-guidelines/' }] }),
  S('macos-ventura', { family: 'macos', vendor: 'apple', displayName: 'macOS Ventura', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'aqua', fileManager: 'Finder', skills: ['os-macos'] }),
  S('macos-monterey', { family: 'macos', vendor: 'apple', displayName: 'macOS Monterey', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'aqua', fileManager: 'Finder', skills: ['os-macos'] }),
  S('macos-sequoia', { family: 'macos', vendor: 'apple', displayName: 'macOS Sequoia', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'aqua', fileManager: 'Finder', skills: ['os-macos'] }),
  S('macos-big-sur', { family: 'macos', vendor: 'apple', displayName: 'macOS Big Sur', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'aqua', fileManager: 'Finder', skills: ['os-macos'] })
];

const mobile = [
  S('android-vanilla', { family: 'android', vendor: 'google', displayName: 'Android (Vanilla Ice Cream)', tier: 'P1', status: 'active', maturity: 0.5, facade: 'OS/android/index.html', toolkit: 'android-material', shell: 'material-you', fileManager: 'Files', embedKey: 'android', skills: ['os-android'], sources: [{ type: 'hig', label: 'Material Design 3', url: 'https://m3.material.io/' }] }),
  S('android-lineage', { family: 'android', vendor: 'lineage', displayName: 'LineageOS (style AOSP)', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'android-material', shell: 'aosp', fileManager: 'Files', skills: ['os-android'] }),
  S('ios-15', { family: 'ios', vendor: 'apple', displayName: 'iOS 15', tier: 'P2', status: 'active', maturity: 0.35, facade: 'OS/ios/15/index.html', toolkit: 'macos-aqua', shell: 'ios-springboard', fileManager: 'Fichiers', skills: ['os-ios'] }),
  S('ios-17', { family: 'ios', vendor: 'apple', displayName: 'iOS 17', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'ios-springboard', fileManager: 'Fichiers', skills: ['os-ios'] }),
  S('ios-18', { family: 'ios', vendor: 'apple', displayName: 'iOS 18', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'macos-aqua', shell: 'ios-springboard', fileManager: 'Fichiers', skills: ['os-ios'] })
];

const bsd = [
  S('freebsd', { family: 'bsd', vendor: 'freebsd', displayName: 'FreeBSD', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'minimal', shell: 'generic', fileManager: 'variable', skills: ['os-bsd'], sources: [{ type: 'wiki', label: 'FreeBSD Handbook', url: 'https://docs.freebsd.org/en/books/handbook/' }] }),
  S('openbsd', { family: 'bsd', vendor: 'openbsd', displayName: 'OpenBSD', tier: 'P4', status: 'planned', maturity: 0, skills: ['os-bsd'] }),
  S('netbsd', { family: 'bsd', vendor: 'netbsd', displayName: 'NetBSD', tier: 'P4', status: 'planned', maturity: 0, skills: ['os-bsd'] }),
  S('ghostbsd', { family: 'bsd', vendor: 'ghostbsd', displayName: 'GhostBSD', tier: 'P3', status: 'planned', maturity: 0, toolkit: 'mate', shell: 'mate', fileManager: 'Caja', skills: ['os-bsd'], sources: [{ type: 'wiki', label: 'MATE', url: 'https://wiki.mate-desktop.org/' }] })
];

const other = [
  S('chromeos', { family: 'chromeos', vendor: 'google', displayName: 'ChromeOS', tier: 'P2', status: 'planned', maturity: 0, toolkit: 'chromeos', shell: 'chrome-shell', fileManager: 'Files', skills: ['os-chromeos'], sources: [{ type: 'design', label: 'ChromeOS design notes', url: 'https://www.chromium.org/chromium-os/' }] }),
  S('harmonyos', { family: 'harmonyos', vendor: 'huawei', displayName: 'HarmonyOS', tier: 'P4', status: 'stub', maturity: 0, skills: ['os-harmonyos'] }),
  S('solaris-illumos', { family: 'unix', vendor: 'oracle', displayName: 'Solaris / illumos (CDE aesthetic)', tier: 'P4', status: 'stub', maturity: 0, skills: ['os-unix'] }),
  S('haiku', { family: 'retro', vendor: 'haiku', displayName: 'Haiku OS', tier: 'P4', status: 'stub', maturity: 0, skills: ['os-stub'] }),
  S('reactos', { family: 'retro', vendor: 'reactos', displayName: 'ReactOS', tier: 'P4', status: 'stub', maturity: 0, toolkit: 'windows-shell', skills: ['os-windows'] })
];

const base = JSON.parse(fs.readFileSync(OUT, 'utf8'));
base.updated = new Date().toISOString().slice(0, 10);
if (sourcingOverlay.assetPolicy) {
  base.assetPolicy = sourcingOverlay.assetPolicy;
}
base.entries = [
  ...linuxActive,
  ...linuxPlanned,
  ...windowsVersions,
  ...macosVersions,
  ...mobile,
  ...bsd,
  ...other
];
base.stats = {
  total: base.entries.length,
  active: base.entries.filter((e) => e.status === 'active').length,
  planned: base.entries.filter((e) => e.status === 'planned').length,
  stub: base.entries.filter((e) => e.status === 'stub').length
};

fs.writeFileSync(OUT, `${JSON.stringify(base, null, 2)}\n`, 'utf8');
console.log(`Écrit ${OUT} — ${base.stats.total} entrées (${base.stats.active} actives)`);
