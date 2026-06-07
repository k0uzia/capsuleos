#!/usr/bin/env node
/**
 * Inventaire VM GNOME structuré (prédicat I / u-vm-inventory).
 * Exécute l'audit static sur la VM lab et produit inventaires/<id>-vm.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-gnome-vm-inventory.mjs --id linux-fedora --write --write-doc
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');

const DESKTOP_APPS = {
  'org.gnome.Nautilus.desktop': {
    role: 'files',
    vmName: 'Nautilus',
    vmId: 'org.gnome.Nautilus',
    capsuleSlot: 'nemo',
    capsuleTemplate: 'nemo-gnome',
    capsuleSkin: 'nautilus',
    windowTitle: 'Fichiers',
  },
  'org.mozilla.firefox.desktop': {
    role: 'browser',
    vmName: 'Firefox',
    vmId: 'firefox',
    capsuleSlot: 'firefox',
    capsuleTemplate: 'firefox',
  },
  'org.mozilla.Firefox.desktop': {
    role: 'browser',
    vmName: 'Firefox',
    vmId: 'firefox',
    capsuleSlot: 'firefox',
    capsuleTemplate: 'firefox',
  },
  'org.gnome.Ptyxis.desktop': {
    role: 'terminal',
    vmName: 'Ptyxis',
    vmId: 'org.gnome.Ptyxis',
    capsuleSlot: 'terminal',
    capsuleProfile: 'linux:redhat',
  },
  'org.gnome.Terminal.desktop': {
    role: 'terminal',
    vmName: 'GNOME Terminal',
    vmId: 'org.gnome.Terminal',
    capsuleSlot: 'terminal',
    capsuleProfile: 'linux:redhat',
  },
  'org.gnome.Software.desktop': {
    role: 'software',
    vmName: 'GNOME Software',
    vmId: 'org.gnome.Software',
    capsuleSlot: 'update_manager',
  },
  'org.gnome.TextEditor.desktop': {
    role: 'textEditor',
    vmName: 'GNOME Text Editor',
    vmId: 'org.gnome.TextEditor',
    capsuleSlot: 'text_editor',
  },
  'org.gnome.Calculator.desktop': {
    role: 'calculator',
    vmName: 'Calculator',
    vmId: 'org.gnome.Calculator',
    capsuleSlot: 'calculator',
  },
  'org.gnome.Calendar.desktop': {
    role: 'calendar',
    vmName: 'Calendar',
    vmId: 'org.gnome.Calendar',
    capsuleSlot: 'calendar',
  },
  'org.gnome.clocks.desktop': {
    role: 'clocks',
    vmName: 'Clocks',
    vmId: 'org.gnome.clocks',
    capsuleSlot: 'clocks',
  },
  'org.gnome.Settings.desktop': {
    role: 'settings',
    vmName: 'Settings',
    vmId: 'org.gnome.Settings',
    capsuleSlot: 'themes',
  },
};

const OFFICIAL_DOC = {
  rocky: {
    rockyReleaseNotes: 'https://docs.rockylinux.org/release_notes/10_0/',
    gnomeHig: 'https://developer.gnome.org/hig',
  },
  fedora: {
    fedoraWorkstation: 'https://docs.fedoraproject.org/en-US/fedora/latest/',
    gnomeHig: 'https://developer.gnome.org/hig',
  },
  alma: {
    almaReleaseNotes: 'https://wiki.almalinux.org/release-notes/',
    gnomeHig: 'https://developer.gnome.org/hig',
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', write: false, writeDoc: false, skipAudit: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--write-doc') opts.writeDoc = true;
    else if (args[i] === '--skip-audit') opts.skipAudit = true;
  }
  return opts;
};

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) {
    throw new Error('etc/capsuleos/lab-inventory.json manquant');
  }
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte lab inconnu: ${registryId}`);
  return host;
};

const runDeepAudit = (registryId) => {
  const script = path.join(__dirname, 'collect-vm-deep-audit.mjs');
  const res = spawnSync(process.execPath, [script, '--id', registryId, '--phase', 'static'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || 'collect-vm-deep-audit échec').trim());
  }
};

const readStaticPhase = (registryId) => {
  const auditPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.json`);
  if (!fs.existsSync(auditPath)) {
    throw new Error(`Audit absent: ${auditPath}`);
  }
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const staticPhase = audit.phases?.static;
  if (!staticPhase) {
    throw new Error(`Phase static absente dans ${auditPath}`);
  }
  return staticPhase;
};

const parseFavorites = (staticPhase) => {
  const details = staticPhase.dashFavorites || [];
  return details.map((d) => d.desktop || d.name).filter(Boolean);
};

const buildApplications = (favoriteDesktops) => {
  const apps = [];
  const seen = new Set();
  for (const desktop of favoriteDesktops) {
    const meta = DESKTOP_APPS[desktop];
    if (!meta || seen.has(meta.capsuleSlot)) continue;
    seen.add(meta.capsuleSlot);
    apps.push({ ...meta, desktopFile: desktop });
  }
  for (const [desktop, meta] of Object.entries(DESKTOP_APPS)) {
    if (seen.has(meta.capsuleSlot)) continue;
    if (favoriteDesktops.includes(desktop)) {
      apps.push({ ...meta, desktopFile: desktop });
      seen.add(meta.capsuleSlot);
    }
  }
  return apps;
};

const accentHex = (accent) => {
  const map = { blue: '#3584e4', orange: '#ff7800', purple: '#9141ac', green: '#2ec27e' };
  return map[(accent || '').replace(/'/g, '')] || null;
};

const buildVmInventory = (registryId, staticPhase, host, entry) => {
  const vendor = entry.vendor || registryId.replace(/^linux-/, '');
  const bodyId = entry.referencePaths?.bodyId || entry.embedKey || vendor;
  const favorites = parseFavorites(staticPhase);
  const os = staticPhase.os || {};

  return {
    version: 1,
    registryId,
    displayName: entry.displayName,
    collectedAt: staticPhase.collectedAt || new Date().toISOString(),
    lab: {
      ssh: host.ssh,
      sshIdentity: host.sshIdentity || '~/.ssh/capsuleos-lab',
      sessionType: host.sessionType || staticPhase.session?.sessionType || 'wayland-xwayland',
      display: host.display || ':0',
      xauthority: '/run/user/UID/.mutter-Xwaylandauth.*',
      capsuleUrl: host.capsuleUrl,
      probeScript: host.probe || '~/capsuleos-lab/os-probe-gnome.sh',
      virshName: host.virshName || null,
    },
    distribution: {
      id: vendor,
      version: os.VERSION_ID || null,
      variant: os.VARIANT || os.VARIANT_ID || 'Workstation',
      base: vendor === 'fedora' ? 'Fedora' : 'RHEL-compatible',
      packageManager: 'dnf',
      defaultSession: 'wayland',
      prettyName: os.PRETTY_NAME || null,
    },
    desktop: {
      shell: staticPhase.versions?.gnomeShell || null,
      toolkit: 'gnome',
      gtkTheme: (staticPhase.theme?.gtkTheme || '').replace(/'/g, '') || 'Adwaita',
      iconTheme: (staticPhase.theme?.iconTheme || '').replace(/'/g, '') || 'Adwaita',
      colorScheme: (staticPhase.theme?.colorScheme || '').replace(/'/g, '') || 'default',
      colorSchemeOptions: ['default', 'prefer-dark', 'prefer-light'],
      accentColor: (staticPhase.theme?.accentColor || '').replace(/'/g, '') || null,
      accentHex: accentHex(staticPhase.theme?.accentColor),
      backgroundUri: (staticPhase.theme?.backgroundUri || '').replace(/'/g, '') || null,
      extensions: (staticPhase.extensions || []).map((e) => e.uuid || e).filter(Boolean),
    },
    officialDocAlignment: OFFICIAL_DOC[vendor] || { gnomeHig: 'https://developer.gnome.org/hig' },
    applications: buildApplications(favorites),
    shellComponents: {
      topBar: {
        vm: 'GNOME top bar — Activities, clock, system status',
        capsule: 'header.fedora-top-bar',
        parity: 'P1',
      },
      overview: {
        vm: 'Activities Overview — search, workspace, app grid, dash',
        capsule: 'section.fedora-overview + js/overview.js',
        parity: 'P1',
      },
      dash: {
        vm: 'Bottom dash in Overview — favorites + running indicator',
        capsule: 'nav.fedora-overview__dash',
        note: vendor === 'fedora'
          ? 'Dock latéral Capsule visible (modèle Fedora early-work) + dash Aperçu'
          : 'Permanent left dock hidden on RHEL GNOME (#tableau display:none)',
        parity: 'P1',
      },
      quickSettings: {
        vm: 'System menu — volume, network, power, dark mode',
        capsule: 'div.volume-popover .quick-settings',
        parity: 'P2',
      },
    },
    dashFavoritesVm: favorites,
    capsulePaths: {
      skin: entry.referencePaths?.skin || entry.skin,
      facade: entry.referencePaths?.facade || entry.facade,
      profile: `etc/capsuleos/profiles/${registryId}.json`,
      vendorAssets: `usr/share/capsuleos/assets/images/vendors/${vendor}/`,
    },
    capsuleThemeMapping: {
      default: { capsule: 'dark', selector: `html:has(#${bodyId})` },
      'prefer-dark': { capsule: 'dark', selector: `html:has(#${bodyId})` },
      'prefer-light': { capsule: 'light', selector: `html[data-theme=light]:has(#${bodyId})` },
    },
    assetsPulled: {
      script: 'root/tools/lab/pull-vm-assets.sh',
      sourceNote: `usr/share/capsuleos/assets/images/vendors/${vendor}/SOURCE-VM.txt`,
      status: 'pending',
    },
    validation: {
      toolkitPack: 'node usr/lib/capsuleos/tools/linux/sync-gnome-toolkit-pack.mjs',
      full: 'node usr/lib/capsuleos/tools/validate-all.mjs',
    },
    upstreamId: entry.upstreamId || null,
  };
};

const writeSummaryMd = (vm, outJson) => {
  const mdPath = outJson.replace(/\.json$/, '.md');
  const lines = [
    `# Inventaire VM — ${vm.displayName}`,
    '',
    `> Collecte : \`${vm.collectedAt}\` · Registre : \`${vm.registryId}\` · JSON : [\`${path.basename(outJson)}\`](${path.basename(outJson)})`,
    '',
    '## Distribution',
    '',
    `| Champ | Valeur |`,
    `|-------|--------|`,
    `| Nom | ${vm.distribution.prettyName || '—'} |`,
    `| GNOME Shell | ${vm.desktop.shell || '—'} |`,
    `| Accent | ${vm.desktop.accentColor || '—'} (${vm.desktop.accentHex || '—'}) |`,
    `| Favoris dash | ${vm.dashFavoritesVm.length} |`,
    '',
    '## Applications mappées',
    '',
    ...vm.applications.map((a) => `- **${a.vmName}** → slot \`${a.capsuleSlot}\``),
    '',
    '## Suite playbook',
    '',
    '```bash',
    `node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id ${vm.registryId}`,
    `bash root/tools/lab/pull-vm-assets.sh --id ${vm.registryId}`,
    '```',
    '',
  ];
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  return mdPath;
};

const main = () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const entry = loadRegistryEntry(opts.id);

  if (!opts.skipAudit) {
    process.stderr.write(`=== collect-gnome-vm-inventory ${opts.id} — audit static VM ===\n`);
    runDeepAudit(opts.id);
  }

  const staticPhase = readStaticPhase(opts.id);
  const vm = buildVmInventory(opts.id, staticPhase, host, entry);
  const outJson = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-vm.json`);

  if (opts.write) {
    fs.writeFileSync(outJson, `${JSON.stringify(vm, null, 2)}\n`);
    process.stdout.write(`OK ${path.relative(ROOT, outJson)}\n`);
    if (opts.writeDoc) {
      const mdPath = writeSummaryMd(vm, outJson);
      process.stdout.write(`OK ${path.relative(ROOT, mdPath)}\n`);
    }
  } else {
    process.stdout.write(`${JSON.stringify(vm, null, 2)}\n`);
  }
};

main();
