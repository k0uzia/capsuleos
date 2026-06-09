#!/usr/bin/env node
/**
 * Cartographie écarts ground truth KDE — pivot linux-kde-neon vs dérivés toolkit.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs
 *   node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/kde-ground-truth-chain.json');
const PIVOT = 'linux-kde-neon';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: PIVOT, write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const readJson = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
};

const readText = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const KDE_REGISTRY = [
  { id: 'linux-kde-neon', skin: 'home/Debian/KDE-Neon/index.html', tier: 'P1', status: 'active' },
  { id: 'linux-opensuse', skin: 'home/SUSE/openSUSE/index.html', tier: 'P1', status: 'active' },
  { id: 'linux-mx-kde', skin: 'home/Debian/MX-KDE/index.html', tier: 'P1', status: 'planned' },
  { id: 'linux-debian-kde', skin: 'home/Debian/Debian-KDE/index.html', tier: 'P2', status: 'planned' },
  { id: 'linux-manjaro-kde', skin: 'home/Manjaro/KDE/index.html', tier: 'P2', status: 'planned' },
];

const countKickoffEntries = (skinRel) => {
  const menuPath = skinRel.replace('/index.html', '/content/mainMenu-data.js');
  const text = readText(menuPath);
  if (!text) return { lines: 0, dataLinkCount: 0 };
  const dataLinks = (text.match(/dataLink:/g) || []).length;
  return { lines: text.split('\n').length, dataLinkCount: dataLinks };
};

const checkCinnamonLeak = (skinRel) => {
  const html = readText(skinRel);
  const leaks = [];
  if (html.includes('fileExplorerInfo.js')) {
    leaks.push('fileExplorerInfo.js (catalogue Cinnamon — fuite cross-toolkit)');
  }
  if (html.includes('mainMenu-data-cinnamon')) {
    leaks.push('mainMenu-data-cinnamon.js');
  }
  if (html.includes('toolkits/cinnamon') || html.includes('toolkits/gnome/apps')) {
    leaks.push('référence directe toolkits/cinnamon ou gnome/apps');
  }
  return leaks;
};

const checkNeonModules = (skinRel, id) => {
  if (id === PIVOT) return { missing: [] };
  const html = readText(skinRel);
  const missing = [];
  if (!html.includes('tray-popover-kde.js')) missing.push('tray-popover-kde.js');
  if (!html.includes('plasma-panel-dock.css') && !readText(skinRel.replace('index.html', 'style/imports.css')).includes('plasma-panel-dock.css')) {
    missing.push('plasma-panel-dock.css');
  }
  return { missing };
};

const opts = parseArgs();
const contract = readJson('etc/capsuleos/contracts/kde-ground-truth-chain.json');
const replication = readJson(`root/docs/inventaires/${opts.id}-replication-state.json`);
const parity = readJson(`root/docs/inventaires/${opts.id}-parity-index.json`);
const vmInv = readJson(`root/docs/inventaires/${opts.id}-vm.json`);
const kickoff = readJson('root/docs/inventaires/linux-kde-neon-kickoff-apps.json');

const pivotKickoff = countKickoffEntries('home/Debian/KDE-Neon/index.html');
const kickoffTotal = kickoff?.categories
  ? Object.values(kickoff.categories).flat().length + (kickoff.favorites?.length || 0)
  : null;

const derivedGaps = KDE_REGISTRY.filter((e) => e.id !== PIVOT).map((entry) => {
  const skinExists = exists(entry.skin);
  const kickoffStats = skinExists ? countKickoffEntries(entry.skin) : null;
  const cinnamonLeaks = skinExists ? checkCinnamonLeak(entry.skin) : ['skin absent'];
  const propagation = skinExists ? checkNeonModules(entry.skin, entry.id) : { missing: ['skin'] };
  const deltaMenu = kickoffStats
    ? pivotKickoff.dataLinkCount - kickoffStats.dataLinkCount
    : null;
  return {
    registryId: entry.id,
    tier: entry.tier,
    status: entry.status,
    skinExists,
    kickoffDataLinks: kickoffStats?.dataLinkCount ?? null,
    menuGapVsPivot: deltaMenu,
    cinnamonLeaks,
    propagationMissing: propagation.missing,
    parityIndex: exists(`root/docs/inventaires/${entry.id}-parity-index.json`),
    replicationState: exists(`root/docs/inventaires/${entry.id}-replication-state.json`),
  };
});

const staticChecks = {
  validateAll: 'manual — node usr/lib/capsuleos/tools/validate-all.mjs',
  toolkitParadigmNeon: exists('home/Debian/KDE-Neon/skin.profile.json'),
  toolkitParadigmDebianKde: exists('home/Debian/Debian-KDE/skin.profile.json'),
  interactionsDir: exists('root/docs/inventaires/interactions/linux-kde-neon'),
  kdeIconPack: exists('usr/share/capsuleos/assets/icons/kde'),
  kdeToolkitImages: exists('usr/share/capsuleos/assets/images/toolkits/kde'),
  labInventoryVm: (() => {
    const lab = readJson('etc/capsuleos/lab-inventory.json');
    return (lab?.hosts || []).some((h) => h.registryId === PIVOT);
  })(),
};

const predicates = {
  H2: true,
  KdM: Boolean(replication?.registryId),
  KdI: Boolean(vmInv?.registryId),
  KdA: true,
  KdS: exists(`root/docs/inventaires/${opts.id}-css-assets-audit.md`),
  KdΠ: (parity?.pi_global ?? 0) >= 90,
  KdVc: Boolean(replication?.v4P1Deliverables?.captureBaselineUpdated),
  KdVp: 'requires HTTP 5500 + capture-clone-surfaces --compare',
  KdP4: 'run smoke-kde-p4-propagation.mjs',
  CredMintAnalog: false,
};

const gaps = {
  p0: [],
  p1: [],
  p2: [],
};

if (!staticChecks.labInventoryVm) {
  gaps.p1.push('VM KDE neon absente de etc/capsuleos/lab-inventory.json (documentée goupil@192.168.123.52)');
}
derivedGaps.forEach((d) => {
  if (d.cinnamonLeaks.length) {
    gaps.p0.push(`${d.registryId} : fuites toolkit — ${d.cinnamonLeaks.join(', ')}`);
  }
  if (d.menuGapVsPivot !== null && d.menuGapVsPivot > 10) {
    gaps.p1.push(`${d.registryId} : menu kickoff ${d.kickoffDataLinks} dataLinks vs pivot ${pivotKickoff.dataLinkCount}`);
  }
  if (!d.parityIndex && d.id !== PIVOT) {
    gaps.p2.push(`${d.registryId} : pas de parity-index dédié (hérite toolkit Neon)`);
  }
});
if (!predicates.KdVp) {
  gaps.p1.push('KdVp : smokes Playwright requièrent serveur HTTP 5500 (ERR_CONNECTION_REFUSED hors lab)');
}
gaps.p2.push('Cred* Mint : non démarré pour KDE — campagne v4 kickoff B2/B3 en cours');
gaps.p2.push('playbook-general toolkit kde : stub → branché kde-ground-truth-chain (juin 2026)');

const report = {
  generatedAt: new Date().toISOString(),
  pivot: {
    registryId: PIVOT,
    justification: contract?.pivotJustification,
    pi_global: parity?.pi_global ?? null,
    campaign: replication?.campaign ?? null,
    vmHost: replication?.vm?.host ?? 'goupil@192.168.123.52',
    kickoffAppsVm: kickoffTotal,
    kickoffDataLinksSkin: pivotKickoff.dataLinkCount,
  },
  predicates,
  staticChecks,
  derivedSkins: derivedGaps,
  gaps,
  resumeCommands: [
    'node usr/lib/capsuleos/tools/validate-all.mjs',
    'node usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs',
    'node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs',
    'python3 -m http.server 5500 --bind 127.0.0.1',
    'node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare',
    'bash root/tools/lab/vm-kde-neon-inventory.sh',
  ],
  contract: 'etc/capsuleos/contracts/kde-ground-truth-chain.json',
  doc: 'root/docs/ground-truth-kde.md',
};

const outPath = path.join(ROOT, `root/docs/inventaires/${opts.id}-ground-truth-gaps.json`);
if (opts.write) {
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Écrit ${outPath}`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(gaps.p0.length ? 1 : 0);
