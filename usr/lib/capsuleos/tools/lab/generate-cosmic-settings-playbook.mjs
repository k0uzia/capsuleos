#!/usr/bin/env node
/**
 * Génère inventaire playbook Paramètres COSMIC depuis le manifeste distribution.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-cosmic-settings-playbook.mjs --id linux-popos
 *   node usr/lib/capsuleos/tools/lab/generate-cosmic-settings-playbook.mjs --id linux-popos --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PANEL_LABELS = {
  accessibility: 'Accessibilité',
  appearance: 'Apparence',
  applications: 'Applications',
  about: 'À propos',
  bluetooth: 'Bluetooth',
  'date-time': 'Date et heure',
  desktop: 'Bureau',
  displays: 'Affichage',
  dock: 'Dock',
  'default-apps': 'Applications par défaut',
  input: 'Saisie',
  keyboard: 'Clavier',
  'legacy-applications': 'Applications héritées',
  mouse: 'Souris',
  network: 'Réseau',
  notifications: 'Notifications',
  panel: 'Barre supérieure',
  power: 'Alimentation',
  'region-language': 'Région et langue',
  sound: 'Son',
  'startup-apps': 'Applications au démarrage',
  system: 'Système',
  time: 'Heure',
  touchpad: 'Pavé tactile',
  users: 'Utilisateurs',
  vpn: 'VPN',
  wallpaper: 'Fond d\'écran',
  'window-management': 'Gestion des fenêtres',
  wired: 'Réseau filaire',
  wireless: 'Wi-Fi',
  workspaces: 'Espaces de travail',
  settings: 'Paramètres',
};

const P0_PANELS = new Set([
  'appearance',
  'wallpaper',
  'dock',
  'desktop',
  'displays',
  'about',
  'network',
  'sound',
  'power',
  'panel',
]);

const CAPSULE_PANEL_MAP = {
  appearance: 'appearance',
  wallpaper: 'background',
  displays: 'displays',
  about: 'about',
  network: 'network',
  sound: 'sound',
  power: 'power',
  desktop: 'multitasking',
  dock: 'dock',
  panel: 'appearance',
  bluetooth: 'network',
  'date-time': 'datetime',
  keyboard: 'keyboard',
  mouse: 'mouse',
  notifications: 'notifications',
  users: 'users',
  workspaces: 'multitasking',
  'window-management': 'multitasking',
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-popos', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const resolveManifestPath = (registryId) => {
  const direct = path.join(ROOT, 'proc', registryId, 'distribution-manifest.json');
  if (fs.existsSync(direct)) return direct;
  const entry = loadRegistryEntry(registryId);
  const vendor = entry.vendor || registryId.replace(/^linux-/, '');
  const alt = path.join(ROOT, 'proc', `linux-${vendor}`, 'distribution-manifest.json');
  if (fs.existsSync(alt)) return alt;
  throw new Error(`Manifeste absent pour ${registryId}`);
};

const extractCosmicPanels = (manifest) => {
  const panels = new Map();
  for (const entry of manifest.applications?.entries || []) {
    const exec = String(entry.exec || '').trim();
    if (!exec.startsWith('cosmic-settings')) continue;
    const parts = exec.split(/\s+/);
    const panelId = parts.length > 1 ? parts[1] : 'settings';
    if (panels.has(panelId)) continue;
    panels.set(panelId, {
      id: panelId,
      label: PANEL_LABELS[panelId] || entry.name || panelId,
      launch: exec,
      vmDesktop: entry.desktopPath ? path.basename(entry.desktopPath) : null,
      status: 'documented',
      capsuleSlot: 'themes',
      capsulePanel: CAPSULE_PANEL_MAP[panelId] || null,
      priority: P0_PANELS.has(panelId) ? 'P0' : 'P1',
      controls: [],
    });
  }
  return [...panels.values()].sort((a, b) => a.id.localeCompare(b.id));
};

const main = () => {
  const opts = parseArgs();
  const manifestPath = resolveManifestPath(opts.id);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const panels = extractCosmicPanels(manifest);

  if (panels.length < 10) {
    console.error(`✗ Trop peu de panneaux COSMIC (${panels.length}) — manifeste ${manifestPath}`);
    process.exit(1);
  }

  const matrixPath = 'root/tools/lab/cosmic-settings-parity-matrix.json';
  const payload = {
    version: 1,
    registryId: opts.id,
    toolkit: 'cosmic',
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, manifestPath),
    matrixPath,
    summary: {
      panelsTotal: panels.length,
      panelsDocumented: panels.filter((p) => p.status === 'documented').length,
      controlsMapped: 0,
      p0Panels: panels.filter((p) => p.priority === 'P0').length,
    },
    panels,
  };

  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-cosmic-settings-playbook.json`);
  const matrixOut = path.join(ROOT, matrixPath);
  const matrix = {
    version: 1,
    description: 'Matrice Paramètres COSMIC — panneaux cosmic-settings (manifeste VM).',
    registryId: opts.id,
    toolkit: 'cosmic',
    capsuleSlot: 'themes',
    capsuleTemplate: 'themes_gnome.html',
    generatedAt: payload.generatedAt,
    panels: panels.map((p) => ({
      id: p.id,
      label: p.label,
      launch: p.launch,
      capsulePanel: p.capsulePanel,
      priority: p.priority,
      controls: [],
    })),
  };

  if (!opts.write) {
    console.log(JSON.stringify({ ...payload, outPath: path.relative(ROOT, outPath) }, null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(matrixOut, `${JSON.stringify(matrix, null, 2)}\n`);
  console.log(`OK ${outPath} (${panels.length} panneaux, P0=${payload.summary.p0Panels})`);
  console.log(`OK ${matrixOut}`);
};

main();
