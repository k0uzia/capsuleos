#!/usr/bin/env node
/**
 * Passe gsettings approfondie — enrichit l'inventaire enquête visuelle (R-PRI2).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-gsettings-pass.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-gsettings-pass.mjs --id linux-rocky --local
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const PROBE_SCRIPT = path.join(ROOT, 'root/tools/lab/vm-gnome-settings-gsettings-deep-pass.sh');

const resolveVisualMatrix = (registryId) => {
  const vendor = loadRegistryEntry(registryId).vendor || registryId.replace(/^linux-/, '');
  const vendorMatrix = path.join(ROOT, 'root/tools/lab', `gnome-settings-visual-investigation-matrix-${vendor}.json`);
  if (fs.existsSync(vendorMatrix)) return vendorMatrix;
  return path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix.json');
};
const PARITY_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const THEME_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const WORKSPACES_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-workspaces.js');
const PREFS_CSS = path.join(ROOT, 'usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');
const driftPathFor = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-parity-drift.json`);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', local: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--local') opts.local = true;
  }
  return opts;
};

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) return null;
  const inv = readJson(INVENTORY);
  return (inv.hosts || []).find((h) => h.registryId === registryId) || null;
};

const remoteEnv = (host) => {
  const parts = [
    `export DISPLAY=${host.display || ':0'}`,
    'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
    'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
  ];
  return parts.join('; ');
};

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable (probe VM)');
  return JSON.parse(stdout.slice(jsonStart));
};

const runProbeLocal = () => {
  const res = spawnSync('bash', [PROBE_SCRIPT], { encoding: 'utf8', cwd: ROOT, timeout: 60000 });
  if (res.status !== 0) throw new Error(`Probe locale échec: ${(res.stderr || res.stdout || '').trim()}`);
  return parseJsonStdout(res.stdout || '');
};

const runProbeVm = (host) => {
  const scriptBody = readText(PROBE_SCRIPT);
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = host.sshIdentity
    ? path.join(process.env.HOME || '', host.sshIdentity.replace(/^~\//, ''))
    : path.join(process.env.HOME || '', '.ssh/capsuleos-lab');
  const remoteScript = `${remoteEnv(host)}; bash -s <<'PROBE_EOF'\n${scriptBody}\nPROBE_EOF`;
  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: remoteScript, encoding: 'utf8', timeout: 60000 },
  );
  if (res.status !== 0) throw new Error(`SSH probe échec: ${(res.stderr || res.stdout || '').trim()}`);
  return parseJsonStdout(res.stdout || '');
};

const datasetToHtmlAttr = (name) => String(name).replace(/([A-Z])/g, '-$1').toLowerCase();

const capsuleHookCheck = (inv, shellText, cssText) => {
  const hook = inv.capsuleHook || {};
  const dataset = hook.dataset;
  let datasetPresent = false;
  let cssHookPresent = false;
  if (dataset) {
    const camel = dataset.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const htmlAttr = datasetToHtmlAttr(dataset);
    datasetPresent = [
      `dataset.${dataset}`,
      `dataset.${camel}`,
      `data-${htmlAttr}`,
    ].some((p) => shellText.includes(p));
    cssHookPresent = cssText.includes(`data-${htmlAttr}`)
      || (hook.selector && cssText.includes(hook.selector))
      || (hook.css && (Array.isArray(hook.css) ? hook.css : [hook.css]).some((c) => cssText.includes(c) || shellText.includes(c)));
  }
  if (hook.js && shellText.includes(hook.js)) datasetPresent = true;
  if (hook.event && shellText.includes(hook.event)) datasetPresent = true;
  return { datasetPresent, cssHookPresent };
};

const DEEP_PASS = {
  theme: (probe) => ({
    schema: 'org.gnome.desktop.interface',
    key: 'color-scheme',
    source: 'gsettings',
    secondaryKeys: [
      ['org.gnome.desktop.interface', 'gtk-theme'],
      ['org.gnome.desktop.background', 'picture-uri'],
      ['org.gnome.desktop.background', 'picture-uri-dark'],
    ],
    vmSnapshot: probe?.probes?.theme || null,
    deepPassNotes:
      'VM RL10 : color-scheme pilote clair/sombre ; gtk-theme reste Adwaita ; picture-uri et picture-uri-dark '
      + 'identiques (rocky-default-10-abstract-1-day.png). Capsule : themes.js + capsule-theme-storage ; '
      + 'vérifier variante fond nuit si picture-uri-dark diverge sur d’autres profils.',
  }),
  'night-light': (probe) => ({
    schema: 'org.gnome.settings-daemon.plugins.color',
    key: 'night-light-enabled',
    source: 'gsettings',
    secondaryKeys: [
      ['org.gnome.settings-daemon.plugins.color', 'night-light-temperature'],
      ['org.gnome.settings-daemon.plugins.color', 'night-light-schedule-from'],
      ['org.gnome.settings-daemon.plugins.color', 'night-light-schedule-to'],
    ],
    vmSnapshot: probe?.probes?.['night-light'] || null,
    deepPassNotes:
      'Clés liées : night-light-temperature (2700), horaires schedule-from/to. Exclusion top bar = gsd-color '
      + '(pas de clé gsettings) — reproduire via html[data-night-light=on] sans filtre sur .fedora-top-bar.',
  }),
  'dynamic-workspaces': (probe) => ({
    schema: 'org.gnome.mutter',
    key: 'dynamic-workspaces',
    source: 'gsettings',
    secondaryKeys: [['org.gnome.mutter', 'workspaces-only-on-primary']],
    vmSnapshot: probe?.probes?.['dynamic-workspaces'] || null,
    deepPassNotes:
      'VM : bool dynamic-workspaces seul ; workspaces-only-on-primary=false. Capsule : gnome-workspaces.js + '
      + 'dataset dynamicWorkspaces ; animation overview documentée en enquête visuelle.',
  }),
  dnd: (probe) => ({
    schema: 'org.capsuleos.gnome.shell',
    key: 'dnd-enabled',
    source: 'simulated-gsettings',
    secondaryKeys: [['org.gnome.desktop.notifications', 'show-banners']],
    vmSnapshot: probe?.probes?.dnd || null,
    deepPassNotes:
      'RL10 : DND session gnome-shell (_dndToggle), pas de clé gsettings VM. Schéma simulé org.capsuleos.gnome.shell '
      + 'aligné playbook (drift 0). show-banners indépendant ; QS tile volume.js + handler parity.',
  }),
};

const DOC_CROSS = {
  theme: [
    { matchesObservation: true, delta: 'VM bascule prefer-dark↔prefer-light via color-scheme ; fonds URI inchangés sur profil Rocky par défaut.' },
    { matchesObservation: true, delta: null },
  ],
  'night-light': [
    { matchesObservation: true, delta: 'Durée observée ~1 s alignée doc gsd-color.' },
    { matchesObservation: true, delta: 'Température 2700 K par défaut VM.' },
  ],
  'dynamic-workspaces': [
    { matchesObservation: true, delta: 'dynamic-workspaces bool contrôle miniatures Aperçu.' },
    { matchesObservation: null, delta: null },
  ],
  dnd: [
    { matchesObservation: true, delta: 'DND session shell ; bannières contrôlées séparément (show-banners).' },
    { matchesObservation: true, delta: 'Schéma simulé CapsuleOS documenté dans parity-matrix.' },
  ],
};

const main = () => {
  const opts = parseArgs();
  const invPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-investigation.json`);
  if (!fs.existsSync(invPath)) throw new Error(`Inventaire manquant: ${invPath}`);

  const host = loadHost(opts.id);
  const probe = opts.local || !host ? runProbeLocal() : runProbeVm(host);

  const visualMatrix = readJson(resolveVisualMatrix(opts.id));
  const matrixById = Object.fromEntries((visualMatrix.investigations || []).map((i) => [i.controlId, i]));
  const shellText = [PARITY_JS, THEME_JS, WORKSPACES_JS].map(readText).join('\n');
  const cssText = readText(PREFS_CSS);
  const driftPath = driftPathFor(opts.id);
  const drift = fs.existsSync(driftPath) ? readJson(driftPath) : { driftCount: null };

  const inv = readJson(invPath);
  const now = probe.generatedAt || new Date().toISOString();
  let enriched = 0;

  for (const item of inv.investigations || []) {
    if (item.status !== 'documented') continue;
    const builder = DEEP_PASS[item.controlId];
    if (!builder) continue;

    item.gsettingsDeferred = builder(probe);
    const hook = capsuleHookCheck(matrixById[item.controlId] || {}, shellText, cssText);
    item.capsuleParity = {
      ...(item.capsuleParity || {}),
      datasetPresent: hook.datasetPresent,
      cssHookPresent: hook.cssHookPresent,
      visualMatch: item.capsuleParity?.visualMatch || 'unknown',
      parityPriority: item.capsuleParity?.parityPriority || matrixById[item.controlId]?.parityPriority || 'P0',
    };
    const docDeltas = DOC_CROSS[item.controlId];
    if (docDeltas && item.officialDocCrossCheck?.length) {
      item.officialDocCrossCheck = item.officialDocCrossCheck.map((entry, idx) => ({
        ...entry,
        matchesObservation: docDeltas[idx]?.matchesObservation ?? entry.matchesObservation,
        delta: docDeltas[idx]?.delta ?? entry.delta,
      }));
    }
    item.gsettingsDeepPassAt = now;
    enriched += 1;
  }

  inv.gsettingsDeepPass = {
    generatedAt: now,
    investigator: 'enrich-visual-investigation-gsettings-pass.mjs',
    probeSource: probe.source,
    playbookCapsuleDrift: drift.driftCount ?? drift.drifts?.length ?? 0,
    p0Enriched: enriched,
  };
  inv.crossCuttingFindings = [
    'RL10 : gnome-screenshot absent ; Snapshot GUI + virsh screenshot hôte pour captures lab.',
    'DND et certains états shell : schémas simulés org.capsuleos.gnome.shell (pas de clé VM unique).',
    'Night Light : exclusion top bar = rendu compositor/gsd, reproduite en CSS Capsule.',
  ];
  inv.nextGsettingsPass = [
    { controlId: 'accent', priority: 'P1', action: 'Valider accent-color system vs gtk-theme' },
    { controlId: 'wallpaper', priority: 'P1', action: 'Lier picture-uri / picture-uri-dark au bascule thème' },
    { controlId: 'hot-corner', priority: 'P1', action: 'org.gnome.desktop.interface enable-hot-corners' },
    { controlId: 'notifications', priority: 'P2', action: 'show-banners + test notify-send VM' },
  ];
  inv.generatedAt = now;

  fs.writeFileSync(invPath, `${JSON.stringify(inv, null, 2)}\n`);
  process.stdout.write(`OK ${invPath} — ${enriched} contrôles P0 enrichis (drift playbook=${inv.gsettingsDeepPass.playbookCapsuleDrift})\n`);
};

main();
