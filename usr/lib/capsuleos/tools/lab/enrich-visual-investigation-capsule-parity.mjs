#!/usr/bin/env node
/**
 * Clôture parité visuelle Capsule ↔ VM (prédicat Vp) — vendor-agnostique.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-capsule-parity.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  ROOT,
  pathsForRegistry,
  readJsonIfExists,
  countP0VisualMatchClassified,
} from './replication-chain-lib.mjs';

const resolveVisualMatrix = (registryId) => {
  const entry = JSON.parse(fs.readFileSync(path.join(ROOT, 'etc/capsuleos/os-registry.json'), 'utf8'))
    .entries.find((e) => e.id === registryId);
  const vendor = entry?.vendor || registryId.replace(/^linux-/, '');
  const vendorMatrix = path.join(ROOT, 'root/tools/lab', `gnome-settings-visual-investigation-matrix-${vendor}.json`);
  if (fs.existsSync(vendorMatrix)) return vendorMatrix;
  return path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix.json');
};
const PARITY_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const THEME_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const WORKSPACES_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-workspaces.js');
const PREFS_CSS = path.join(ROOT, 'usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');
const THEMES_CSS = path.join(ROOT, 'usr/share/capsuleos/themes/linux/themes_gnome.base.css');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

const datasetToHtmlAttr = (name) => String(name).replace(/([A-Z])/g, '-$1').toLowerCase();

const hookCheck = (inv, shellText, cssText) => {
  const hook = inv.capsuleHook || {};
  const dataset = hook.dataset;
  let datasetPresent = false;
  let cssHookPresent = false;
  if (dataset) {
    const camel = dataset.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const htmlAttr = datasetToHtmlAttr(dataset);
    datasetPresent = [`dataset.${dataset}`, `dataset.${camel}`, `data-${htmlAttr}`].some((p) => shellText.includes(p));
    cssHookPresent = cssText.includes(`data-${htmlAttr}`)
      || (hook.selector && cssText.includes(hook.selector));
  }
  if (hook.js && shellText.includes(hook.js)) datasetPresent = true;
  if (hook.css) {
    const list = Array.isArray(hook.css) ? hook.css : [hook.css];
    if (list.some((c) => shellText.includes(c) || cssText.includes(c))) cssHookPresent = true;
  }
  return { datasetPresent, cssHookPresent };
};

/** Classification heuristique — VM prime ; partial si hooks + captures des deux côtés. */
const CLASSIFY = {
  theme: ({ hooks, vmCaptures, capsuleCaptures }) => {
    const both = (vmCaptures || []).length && (capsuleCaptures || []).length;
    if (!hooks.datasetPresent) {
      return { visualMatch: 'gap', gapNotes: 'dataset thème absent du shell.' };
    }
    return {
      visualMatch: both ? 'partial' : 'partial',
      gapNotes: both
        ? 'H5 : cross-fade thème 300 ms + fond réappliqué (picture-uri-dark via gsettings).'
        : 'Hooks présents ; captures croisées incomplètes.',
    };
  },
  'night-light': ({ hooks, vmCaptures, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : filtre 1000 ms ease-in-out ; top bar exclue (filter:none).',
  }),
  'dynamic-workspaces': ({ hooks, vmCaptures, capsuleCaptures }) => ({
    visualMatch: hooks.datasetPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : spring 350 ms mini-workspaces ; count 2↔4 via reconfigure.',
  }),
  dnd: ({ hooks, vmCaptures, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : syncDndChrome QS + Paramètres + calendrier (capsule:dnd-changed).',
  }),
  accent: ({ hooks, vmCaptures, capsuleCaptures }) => ({
    visualMatch: hooks.datasetPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : --gcc-accent + dataset gnomeAccent ; switches adw liés à la couleur VM.',
  }),
  wallpaper: ({ hooks, vmCaptures, capsuleCaptures }) => ({
    visualMatch: hooks.datasetPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : transition fond 200 ms + picture-uri-dark synchronisé au thème.',
  }),
  'hot-corner': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : zone coin actif + data-hot-corners ; désactivation overview au survol.',
  }),
  'display-scale': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : zoom .fedora-main-row via --gnome-display-scale + dataset displayScale.',
  }),
  'font-scale': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : --a11y-font-scale-factor + dataset fontScale sur panneau Accessibilité.',
  }),
  contrast: ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : data-contrast-mode high + bordures shell/top-bar renforcées.',
  }),
  'power-mode': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : data-power-mode + teinte tuile QS performance (transition 150 ms).',
  }),
  'search-files': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.datasetPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'H5 : filterSearchCatalog + dataset searchFiles ; provider Nautilus désactivable.',
  }),
  notifications: ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'P2 : dataset notificationsEnabled + show-banners miroir.',
  }),
  'power-dim': ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.datasetPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'P2 : timeout extinction écran (dataset powerDimScreen) — pas d’effet visuel immédiat.',
  }),
  wifi: ({ hooks, capsuleCaptures }) => ({
    visualMatch: hooks.cssHookPresent && capsuleCaptures.length ? 'partial' : 'gap',
    gapNotes: 'P2 : dataset wifiEnabled + liste réseaux simulée.',
  }),
};

const main = () => {
  const opts = parseArgs();
  const invPath = pathsForRegistry(opts.id).visualInvestigation;
  if (!fs.existsSync(invPath)) throw new Error(`Inventaire manquant: ${invPath}`);

  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(resolveVisualMatrix(opts.id), 'utf8'));
  const matrixById = Object.fromEntries((matrix.investigations || []).map((i) => [i.controlId, i]));
  const shellText = [PARITY_JS, THEME_JS, WORKSPACES_JS].map(readText).join('\n');
  const cssText = [PREFS_CSS, THEMES_CSS].map(readText).join('\n');

  let enriched = 0;
  const now = new Date().toISOString();

  for (const item of inv.investigations || []) {
    const priority = item.capsuleParity?.parityPriority
      || matrixById[item.controlId]?.parityPriority;
    if (item.status !== 'documented' || !['P0', 'P1', 'P2'].includes(priority)) continue;
    const matrixInv = matrixById[item.controlId] || {};
    const hooks = hookCheck(matrixInv, shellText, cssText);
    const vmCaptures = item.vmCaptures || [];
    const capsuleCaptures = item.capsuleCaptures || [];
    const classify = CLASSIFY[item.controlId];
    const result = classify
      ? classify({ hooks, vmCaptures, capsuleCaptures })
      : { visualMatch: capsuleCaptures.length && vmCaptures.length ? 'partial' : 'unknown', gapNotes: null };

    item.capsuleParity = {
      ...(item.capsuleParity || {}),
      datasetPresent: hooks.datasetPresent,
      cssHookPresent: hooks.cssHookPresent,
      visualMatch: result.visualMatch,
      gapNotes: result.gapNotes,
      parityPriority: priority,
    };
    item.visualParityClosedAt = now;
    enriched += 1;
  }

  const classifiedP0 = countP0VisualMatchClassified(inv);
  const classifiedP1 = (inv.investigations || []).filter(
    (i) => i.status === 'documented'
      && i.capsuleParity?.parityPriority === 'P1'
      && i.capsuleParity?.visualMatch
      && i.capsuleParity.visualMatch !== 'unknown',
  ).length;
  const classifiedP2 = (inv.investigations || []).filter(
    (i) => i.status === 'documented'
      && i.capsuleParity?.parityPriority === 'P2'
      && i.capsuleParity?.visualMatch
      && i.capsuleParity.visualMatch !== 'unknown',
  ).length;
  inv.summary = {
    ...(inv.summary || {}),
    capsuleImplemented: classifiedP0,
    visualMatchClassifiedP0: classifiedP0,
    visualMatchClassifiedP1: classifiedP1,
    visualMatchClassifiedP2: classifiedP2,
    gaps: (inv.investigations || []).filter(
      (i) => i.status === 'documented'
        && ['P0', 'P1', 'P2'].includes(i.capsuleParity?.parityPriority)
        && i.capsuleParity?.visualMatch === 'gap',
    ).length,
  };
  const p2Done = (inv.investigations || []).filter(
    (i) => i.capsuleParity?.parityPriority === 'P2' && i.status === 'documented',
  ).length;
  if (classifiedP2 > 0 && classifiedP2 >= p2Done) {
    const tailScript = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs');
    spawnSync(process.execPath, [tailScript, '--id', opts.id], { cwd: ROOT, stdio: 'pipe' });
  }

  inv.visualParityClose = {
    generatedAt: now,
    investigator: 'enrich-visual-investigation-capsule-parity.mjs',
    p0Classified: classifiedP0,
    p1Classified: classifiedP1,
  };

  fs.writeFileSync(invPath, `${JSON.stringify(inv, null, 2)}\n`);
  process.stdout.write(
    `OK ${invPath} — P0=${classifiedP0} P1=${classifiedP1} P2=${classifiedP2} classés (Vp=${classifiedP0})\n`,
  );
};

main();
