/**
 * Définitions brutes des entrées catalogue — consommées par build-os-registry.mjs.
 * Champs runtime (facade, skin, embedKey, bodyId) archivés via freeze dans referencePaths.
 */

/** @typedef {object} RawEntry */

/** @returns {RawEntry[]} */
export function getRawEntries() {
  const linux = [
    { id: 'linux-mint', family: 'linux', kernelId: 'linux', branchId: 'mint', vendor: 'mint', displayName: 'Linux Mint (Cinnamon)', tier: 'P0', wasActive: true, fidelityLevel: 4, toolkit: 'cinnamon', shellId: 'cinnamon', apps: { explorer: { template: 'nemo', displayName: 'Nemo' } }, upstreamId: null, clusterIds: ['explorer.nemo.cinnamon', 'toolkit.cinnamon'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/debian/mint/index.html', skin: 'home/Debian/Mint/index.html', embedKey: 'mint', bodyId: 'mint' }, sources: [{ type: 'design', label: 'Cinnamon', url: 'https://projects.linuxmint.com/cinnamon/' }] },
    { id: 'linux-ubuntu', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'ubuntu', displayName: 'Ubuntu 25.10', tier: 'P0', wasActive: true, fidelityLevel: 3, toolkit: 'gnome', shellId: 'gnome', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: 'linux-rocky', clusterIds: ['explorer.nautilus.gnome', 'toolkit.gnome'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/debian/ubuntu/index.html', skin: 'home/Debian/Ubuntu/index.html', embedKey: 'ubuntu', bodyId: 'ubuntu' }, sources: [{ type: 'hig', label: 'GNOME HIG', url: 'https://developer.gnome.org/hig/' }] },
    { id: 'linux-fedora', family: 'linux', kernelId: 'linux', branchId: 'fedora', vendor: 'fedora', displayName: 'Fedora Workstation', tier: 'P1', wasActive: true, fidelityLevel: 3, toolkit: 'gnome', shellId: 'gnome', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: 'linux-rocky', clusterIds: ['explorer.nautilus.gnome', 'toolkit.gnome'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/redhat/fedora/index.html', skin: 'home/RedHat/Fedora/index.html', embedKey: 'fedora', bodyId: 'fedora' } },
    { id: 'linux-mx-kde', family: 'linux', kernelId: 'linux', branchId: 'debian', vendor: 'mx', displayName: 'MX Linux KDE', tier: 'P1', wasActive: true, fidelityLevel: 3, toolkit: 'kde', shellId: 'plasma', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, upstreamId: 'linux-debian-kde', clusterIds: ['explorer.dolphin.kde', 'toolkit.kde'], skills: ['os-linux'], assetPacks: ['toolkits/kde', 'vendors/mx'], referencePaths: { facade: 'OS/linux/families/debian/mx-kde/index.html', skin: 'home/Debian/MX-KDE/index.html', embedKey: 'mxkde', bodyId: 'mx-kde' } },
    { id: 'linux-debian-kde', family: 'linux', kernelId: 'linux', branchId: 'debian', vendor: 'debian', displayName: 'Debian KDE (Plasma)', tier: 'P2', wasActive: true, fidelityLevel: 3, toolkit: 'kde', shellId: 'plasma', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, upstreamId: null, clusterIds: ['explorer.dolphin.kde', 'toolkit.kde'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/debian/debian-kde/index.html', skin: 'home/Debian/Debian-KDE/index.html', embedKey: 'debiankde', bodyId: 'debian-kde' } },
    { id: 'linux-kde-neon', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'neon', displayName: 'KDE neon User Edition', tier: 'P1', wasActive: true, fidelityLevel: 3, toolkit: 'kde', shellId: 'plasma', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, upstreamId: 'linux-debian-kde', clusterIds: ['explorer.dolphin.kde', 'toolkit.kde'], skills: ['os-linux'], assetPacks: ['toolkits/kde', 'vendors/neon'], referencePaths: { facade: 'OS/linux/families/debian/kde-neon/index.html', skin: 'home/Debian/KDE-Neon/index.html', embedKey: 'kde-neon', bodyId: 'kde-neon' } },
    { id: 'linux-opensuse', family: 'linux', kernelId: 'linux', branchId: 'opensuse', vendor: 'opensuse', displayName: 'openSUSE Tumbleweed', tier: 'P1', wasActive: true, fidelityLevel: 3, toolkit: 'kde', shellId: 'plasma', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, upstreamId: null, clusterIds: ['explorer.dolphin.kde', 'toolkit.kde'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/suse/opensuse/index.html', skin: 'home/SUSE/openSUSE/index.html', embedKey: 'opensuse', bodyId: 'opensuse' } },
    { id: 'linux-popos', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'popos', displayName: 'Pop!_OS', tier: 'P2', wasActive: true, fidelityLevel: 2, toolkit: 'cosmic', shellId: 'cosmic', apps: { explorer: { template: 'nemo-cosmic', displayName: 'Fichiers' } }, upstreamId: 'linux-ubuntu', clusterIds: ['explorer.nemo.cosmic', 'toolkit.cosmic'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/debian/popos/index.html', skin: 'home/Debian/PopOS/index.html', embedKey: 'popos', bodyId: 'popos' } },
    { id: 'linux-anduinos', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'anduin', displayName: 'AnduinOS', tier: 'P3', wasActive: true, fidelityLevel: 2, toolkit: 'gnome', shellId: 'anduin', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: 'linux-rocky', clusterIds: ['explorer.nautilus.gnome', 'toolkit.gnome'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/debian/anduinos/index.html', skin: 'home/Debian/AnduinOS/index.html', embedKey: 'anduinos', bodyId: 'anduinos' } },
    { id: 'linux-rocky', family: 'linux', kernelId: 'linux', branchId: 'rhel', vendor: 'rocky', displayName: 'Rocky Linux (GNOME)', tier: 'P1', wasActive: true, fidelityLevel: 4, toolkit: 'gnome', shellId: 'gnome', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: null, clusterIds: ['explorer.nautilus.gnome', 'toolkit.gnome'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/redhat/rocky/index.html', skin: 'home/RedHat/Rocky/index.html', embedKey: 'rocky', bodyId: 'rocky' } },
    { id: 'linux-arch', family: 'linux', kernelId: 'linux', branchId: 'arch', vendor: 'arch', displayName: 'Arch Linux', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'minimal', shellId: 'configurable', apps: { explorer: { template: null, displayName: 'variable' } }, clusterIds: [], skills: ['os-linux'], sources: [{ type: 'wiki', label: 'Arch Wiki', url: 'https://wiki.archlinux.org/' }] },
    { id: 'linux-manjaro-kde', family: 'linux', kernelId: 'linux', branchId: 'manjaro', vendor: 'manjaro', displayName: 'Manjaro KDE', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'kde', shellId: 'plasma', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, upstreamId: 'linux-arch', clusterIds: ['explorer.dolphin.kde'], skills: ['os-linux'] },
    { id: 'linux-manjaro-gnome', family: 'linux', kernelId: 'linux', branchId: 'manjaro', vendor: 'manjaro', displayName: 'Manjaro GNOME', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'gnome', shellId: 'gnome', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: 'linux-arch', clusterIds: ['explorer.nemo.gnome'], skills: ['os-linux'] },
    { id: 'linux-elementary', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'elementary', displayName: 'elementary OS', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'pantheon', shellId: 'pantheon', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, clusterIds: ['toolkit.pantheon'], skills: ['os-linux'], sources: [{ type: 'hig', label: 'Human Interface Guidelines', url: 'https://docs.elementary.io/hig/' }] },
    { id: 'linux-zorin', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'zorin', displayName: 'Zorin OS', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'gnome', shellId: 'zorin', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, clusterIds: ['toolkit.gnome'], skills: ['os-linux'] },
    { id: 'linux-alma', family: 'linux', kernelId: 'linux', branchId: 'rhel', vendor: 'alma', displayName: 'AlmaLinux (GNOME)', tier: 'P3', wasActive: true, fidelityLevel: 3, toolkit: 'gnome', shellId: 'gnome', apps: { explorer: { template: 'nemo-gnome', displayName: 'Fichiers' } }, upstreamId: 'linux-rocky', clusterIds: ['explorer.nautilus.gnome', 'toolkit.gnome'], skills: ['os-linux'], referencePaths: { facade: 'OS/linux/families/redhat/alma/index.html', skin: 'home/RedHat/Alma/index.html', embedKey: 'alma', bodyId: 'alma' } },
    { id: 'linux-kali', family: 'linux', kernelId: 'linux', branchId: 'kali', vendor: 'kali', displayName: 'Kali Linux', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'xfce', shellId: 'xfce', apps: { explorer: { template: 'nemo', displayName: 'Thunar' } }, clusterIds: ['toolkit.xfce'], skills: ['os-linux'], sources: [{ type: 'wiki', label: 'Xfce docs', url: 'https://docs.xfce.org/' }] },
    { id: 'linux-steamos', family: 'linux', kernelId: 'linux', branchId: 'arch', vendor: 'valve', displayName: 'SteamOS / Steam Deck UI', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'kde', shellId: 'gamescope-steam', apps: { explorer: { template: 'dolphin', displayName: 'Dolphin' } }, clusterIds: ['toolkit.kde'], skills: ['os-linux'] },
    { id: 'linux-nixos', family: 'linux', kernelId: 'linux', branchId: 'arch', vendor: 'nixos', displayName: 'NixOS (concept)', tier: 'P4', status: 'stub', fidelityLevel: 0, toolkit: 'minimal', shellId: 'configurable', apps: { explorer: { template: null, displayName: 'variable' } }, clusterIds: [], skills: ['os-linux'] },
    { id: 'linux-slackware', family: 'linux', kernelId: 'linux', branchId: 'slackware', vendor: 'slackware', displayName: 'Slackware', tier: 'P4', status: 'planned', fidelityLevel: 0, toolkit: 'xfce', shellId: 'xfce', apps: { explorer: { template: 'nemo', displayName: 'Thunar' } }, clusterIds: ['toolkit.xfce'], skills: ['os-linux'] },
    { id: 'linux-gentoo', family: 'linux', kernelId: 'linux', branchId: 'gentoo', vendor: 'gentoo', displayName: 'Gentoo (minimal)', tier: 'P4', status: 'stub', fidelityLevel: 0, toolkit: 'minimal', shellId: 'openrc', apps: { explorer: { template: null, displayName: 'variable' } }, clusterIds: [], skills: ['os-linux'] },
    { id: 'linux-xubuntu', family: 'linux', kernelId: 'linux', branchId: 'ubuntu', vendor: 'ubuntu', displayName: 'Xubuntu (Xfce)', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'xfce', shellId: 'xfce', apps: { explorer: { template: 'nemo', displayName: 'Thunar' } }, clusterIds: ['toolkit.xfce'], skills: ['os-linux'] },
    { id: 'linux-lxqt', family: 'linux', kernelId: 'linux', branchId: 'debian', vendor: 'generic', displayName: 'LXQt (générique)', tier: 'P4', status: 'planned', fidelityLevel: 0, toolkit: 'lxqt', shellId: 'lxqt', apps: { explorer: { template: 'nemo', displayName: 'PCManFM-Qt' } }, clusterIds: ['toolkit.lxqt'], skills: ['os-linux'] },
    { id: 'linux-alpine', family: 'linux', kernelId: 'linux', branchId: 'alpine', vendor: 'alpine', displayName: 'Alpine Linux', tier: 'P4', status: 'stub', fidelityLevel: 0, toolkit: 'minimal', shellId: 'busybox', apps: { explorer: { template: null, displayName: 'variable' } }, clusterIds: [], skills: ['os-linux'] }
  ];

  const windows = [
    ['95', 'Windows 95', 'P2', 2], ['98', 'Windows 98', 'P2', 2], ['me', 'Windows ME', 'P2', 2],
    ['2000', 'Windows 2000', 'P2', 2], ['xp', 'Windows XP', 'P1', 3], ['vista', 'Windows Vista', 'P2', 2],
    ['7', 'Windows 7', 'P1', 3], ['8', 'Windows 8', 'P2', 2], ['8.1', 'Windows 8.1', 'P2', 2],
    ['10', 'Windows 10', 'P0', 3], ['11', 'Windows 11', 'P0', 3]
  ].map(([ver, name, tier, fidelityLevel]) => ({
    id: `windows-${ver}`,
    family: 'windows',
    kernelId: 'windows-nt',
    branchId: null,
    vendor: 'microsoft',
    displayName: name,
    tier,
    wasActive: true,
    fidelityLevel,
    toolkit: 'windows-shell',
    shellId: ver === '11' ? 'win11' : ver === '10' ? 'win10' : `win${ver}`,
    apps: { explorer: { template: null, displayName: 'Explorateur' } },
    clusterIds: ['toolkit.windows-shell'],
    skills: ['os-windows'],
    referencePaths: { facade: `OS/windows/versions/${ver}/index.html`, embedKey: `win${ver}` },
    sources: [{ type: 'design', label: 'Microsoft Design (WinUI)', url: 'https://learn.microsoft.com/windows/apps/design/' }]
  }));

  const darwin = [
    { id: 'macos-sonoma', family: 'macos', kernelId: 'darwin', vendor: 'apple', displayName: 'macOS Sonoma', tier: 'P1', wasActive: true, fidelityLevel: 3, toolkit: 'macos-aqua', shellId: 'aqua', apps: { explorer: { template: null, displayName: 'Finder' } }, clusterIds: ['toolkit.macos-aqua'], skills: ['os-macos'], referencePaths: { facade: 'OS/macos/sonoma/index.html', embedKey: 'sonoma' }, sources: [{ type: 'hig', label: 'Apple HIG', url: 'https://developer.apple.com/design/human-interface-guidelines/' }] },
    { id: 'macos-ventura', family: 'macos', kernelId: 'darwin', vendor: 'apple', displayName: 'macOS Ventura', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'aqua', apps: { explorer: { displayName: 'Finder' } }, clusterIds: ['toolkit.macos-aqua'], skills: ['os-macos'] },
    { id: 'macos-monterey', family: 'macos', kernelId: 'darwin', vendor: 'apple', displayName: 'macOS Monterey', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'aqua', apps: { explorer: { displayName: 'Finder' } }, clusterIds: ['toolkit.macos-aqua'], skills: ['os-macos'] },
    { id: 'macos-sequoia', family: 'macos', kernelId: 'darwin', vendor: 'apple', displayName: 'macOS Sequoia', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'aqua', apps: { explorer: { displayName: 'Finder' } }, clusterIds: ['toolkit.macos-aqua'], skills: ['os-macos'] },
    { id: 'macos-big-sur', family: 'macos', kernelId: 'darwin', vendor: 'apple', displayName: 'macOS Big Sur', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'aqua', apps: { explorer: { displayName: 'Finder' } }, clusterIds: ['toolkit.macos-aqua'], skills: ['os-macos'] },
    { id: 'ios-15', family: 'ios', kernelId: 'darwin', vendor: 'apple', displayName: 'iOS 15', tier: 'P2', wasActive: true, fidelityLevel: 2, toolkit: 'macos-aqua', shellId: 'ios-springboard', apps: { explorer: { displayName: 'Fichiers' } }, clusterIds: ['toolkit.ios-springboard'], skills: ['os-ios'], referencePaths: { facade: 'OS/ios/15/index.html' } },
    { id: 'ios-17', family: 'ios', kernelId: 'darwin', vendor: 'apple', displayName: 'iOS 17', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'ios-springboard', apps: { explorer: { displayName: 'Fichiers' } }, clusterIds: ['toolkit.ios-springboard'], skills: ['os-ios'] },
    { id: 'ios-18', family: 'ios', kernelId: 'darwin', vendor: 'apple', displayName: 'iOS 18', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'macos-aqua', shellId: 'ios-springboard', apps: { explorer: { displayName: 'Fichiers' } }, clusterIds: ['toolkit.ios-springboard'], skills: ['os-ios'] }
  ];

  const mobile = [
    { id: 'android-vanilla', family: 'android', kernelId: 'android', vendor: 'google', displayName: 'Android (Vanilla Ice Cream)', tier: 'P1', wasActive: true, fidelityLevel: 2, toolkit: 'android-material', shellId: 'material-you', apps: { explorer: { displayName: 'Files' } }, clusterIds: ['toolkit.android-material'], skills: ['os-android'], referencePaths: { facade: 'OS/android/index.html', embedKey: 'android' }, sources: [{ type: 'hig', label: 'Material Design 3', url: 'https://m3.material.io/' }] },
    { id: 'android-lineage', family: 'android', kernelId: 'android', vendor: 'lineage', displayName: 'LineageOS (style AOSP)', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'android-material', shellId: 'aosp', apps: { explorer: { displayName: 'Files' } }, clusterIds: ['toolkit.android-material'], skills: ['os-android'] }
  ];

  const bsd = [
    { id: 'freebsd', family: 'bsd', kernelId: 'freebsd', vendor: 'freebsd', displayName: 'FreeBSD', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'minimal', shellId: 'generic', skills: ['os-bsd'], sources: [{ type: 'wiki', label: 'FreeBSD Handbook', url: 'https://docs.freebsd.org/en/books/handbook/' }] },
    { id: 'openbsd', family: 'bsd', kernelId: 'openbsd', vendor: 'openbsd', displayName: 'OpenBSD', tier: 'P4', status: 'planned', fidelityLevel: 0, skills: ['os-bsd'] },
    { id: 'netbsd', family: 'bsd', kernelId: 'netbsd', vendor: 'netbsd', displayName: 'NetBSD', tier: 'P4', status: 'planned', fidelityLevel: 0, skills: ['os-bsd'] },
    { id: 'ghostbsd', family: 'bsd', kernelId: 'freebsd', vendor: 'ghostbsd', displayName: 'GhostBSD', tier: 'P3', status: 'planned', fidelityLevel: 0, toolkit: 'mate', shellId: 'mate', apps: { explorer: { displayName: 'Caja' } }, skills: ['os-bsd'], sources: [{ type: 'wiki', label: 'MATE', url: 'https://wiki.mate-desktop.org/' }] }
  ];

  const other = [
    { id: 'chromeos', family: 'chromeos', kernelId: 'chromeos', vendor: 'google', displayName: 'ChromeOS', tier: 'P2', status: 'planned', fidelityLevel: 0, toolkit: 'chromeos', shellId: 'chrome-shell', apps: { explorer: { displayName: 'Files' } }, clusterIds: ['toolkit.chromeos'], skills: ['os-chromeos'], sources: [{ type: 'design', label: 'ChromeOS design notes', url: 'https://www.chromium.org/chromium-os/' }] },
    { id: 'harmonyos', family: 'harmonyos', kernelId: 'harmonyos', vendor: 'huawei', displayName: 'HarmonyOS', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-harmonyos'] },
    { id: 'solaris-illumos', family: 'unix', kernelId: 'solaris', vendor: 'oracle', displayName: 'Solaris / illumos (CDE aesthetic)', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-unix'] },
    { id: 'haiku', family: 'retro', kernelId: 'haiku', vendor: 'haiku', displayName: 'Haiku OS', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-stub'] },
    { id: 'reactos', family: 'retro', kernelId: 'windows-nt', vendor: 'reactos', displayName: 'ReactOS', tier: 'P4', status: 'stub', fidelityLevel: 0, toolkit: 'windows-shell', skills: ['os-windows'] },
    { id: 'qnx-neutrino', family: 'other', kernelId: 'qnx-neutrino', vendor: 'qnx', displayName: 'QNX Neutrino', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-stub'] },
    { id: 'vxworks', family: 'other', kernelId: 'vxworks', vendor: 'windriver', displayName: 'VxWorks', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-stub'] },
    { id: 'minix3', family: 'other', kernelId: 'minix3', vendor: 'minix', displayName: 'MINIX 3', tier: 'P4', status: 'stub', fidelityLevel: 0, skills: ['os-stub'] }
  ];

  return [...linux, ...windows, ...darwin, ...mobile, ...bsd, ...other];
}
