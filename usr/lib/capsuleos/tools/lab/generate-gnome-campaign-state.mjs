#!/usr/bin/env node
/**
 * Génère l'état campagne GNOME Paramètres par panneau (6 niveaux récursifs).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-gnome-campaign-state.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/generate-gnome-campaign-state.mjs --id linux-rocky --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import { resolveLabMatrix } from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STUB_PANELS = new Set(['printers', 'about']);
const SIMULATED_PANELS = new Set(['sharing']);
const P0_PANELS = new Set(['appearance', 'background', 'notifications', 'multitasking', 'displays']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', write: false };
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

const handlerIds = (js, name) => {
  const block = js.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n    \\};`));
  if (!block) return new Set();
  const ids = new Set();
  const re = /^\s{8}(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*\{/gm;
  let m;
  while ((m = re.exec(block[1])) !== null) ids.add(m[1] || m[2]);
  return ids;
};

const allHandlerIds = (parityJs) => {
  const ids = new Set();
  for (const name of ['SWITCH_HANDLERS', 'SELECT_HANDLERS', 'SLIDER_HANDLERS']) {
    for (const id of handlerIds(parityJs, name)) ids.add(id);
  }
  return ids;
};

const panelScenarios = () => {
  const contract = readJson('etc/capsuleos/contracts/themes-user-scenarios.json');
  const map = new Map();
  for (const sc of contract?.scenarios || []) {
    for (const step of sc.steps || []) {
      const target = step.target || step.action;
      if (typeof target === 'string' && ['appearance', 'background', 'displays'].includes(target)) {
        map.set(target, (map.get(target) || 0) + 1);
      }
      const m = String(step.selector || '').match(/data-gnome-settings-panel="([^"]+)"/);
      if (m) map.set(m[1], (map.get(m[1]) || 0) + 1);
    }
    if (sc.id === 'Th4') map.set('displays', (map.get('displays') || 0) + 1);
    if (sc.id === 'Th1' || sc.id === 'Th3') map.set('appearance', (map.get('appearance') || 0) + 1);
    if (sc.id === 'Th2') map.set('background', (map.get('background') || 0) + 1);
  }
  return map;
};

const effectsForRegistry = (registryId) => {
  const chain = readJson('etc/capsuleos/contracts/settings-effects-chain.json');
  const effects = chain?.effects || [];
  const byPanel = new Map();
  for (const eff of effects) {
    if (eff.registryIds && !eff.registryIds.includes(registryId) && eff.pilotRegistryId !== registryId) continue;
    const panel = eff.settingsPanel || eff.panel || null;
    if (panel) byPanel.set(panel, (byPanel.get(panel) || 0) + 1);
  }
  return byPanel;
};

const buildState = (registryId) => {
  let matrix;
  try {
    const resolved = resolveLabMatrix(registryId, 'parity', { strict: false });
    matrix = JSON.parse(fs.readFileSync(resolved.absolute, 'utf8'));
  } catch {
    matrix = { panels: [] };
  }

  const playbook = readJson(`root/docs/inventaires/${registryId}-gnome-settings-playbook.json`);
  const interaction = readJson(`root/docs/inventaires/${registryId}-gnome-settings-interaction.json`);
  const visual = readJson(`root/docs/inventaires/${registryId}-gnome-settings-visual-investigation.json`);
  const themesHtml = readText('usr/share/capsuleos/linux/apps/themes_gnome.html');
  const parityJs = readText('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
  const handlers = allHandlerIds(parityJs);
  const scenarioMap = panelScenarios();
  const effectMap = effectsForRegistry(registryId);

  const playbookByPanel = new Map();
  for (const p of playbook?.panels || []) {
    playbookByPanel.set(p.id, p);
  }

  const visualByControl = new Map();
  for (const inv of visual?.investigations || []) {
    const panel = inv.capsulePanel;
    if (!visualByControl.has(panel)) visualByControl.set(panel, []);
    visualByControl.get(panel).push(inv);
  }

  const panels = (matrix.panels || []).map((panelDef) => {
    const panelId = panelDef.capsulePanel || panelDef.id;
    const controls = panelDef.controls || [];
    const pbPanel = playbookByPanel.get(panelDef.id) || playbookByPanel.get(panelId);
    const isStub = STUB_PANELS.has(panelId);
    const isSimulated = SIMULATED_PANELS.has(panelId);

    const structureSimple = themesHtml.includes(`data-gnome-settings-panel="${panelId}"`);

    const mappedInPlaybook = (pbPanel?.controls || []).filter((c) => c.status === 'mapped').length;
    const totalInPlaybook = (pbPanel?.controls || []).length;
    const matrixControls = controls.length;
    const handlersOk = controls.filter((c) => handlers.has(c.id)).length;

    let playbookStatus = 'missing';
    if (pbPanel) {
      if (isStub && totalInPlaybook === 0) playbookStatus = 'stub';
      else if (mappedInPlaybook === totalInPlaybook && totalInPlaybook > 0) playbookStatus = 'ok';
      else if (mappedInPlaybook > 0) playbookStatus = 'partial';
      else if (isStub) playbookStatus = 'stub';
      else playbookStatus = 'gap';
    } else if (isStub) playbookStatus = 'stub';

    const visualDocs = visualByControl.get(panelId) || [];
    const visualImplemented = visualDocs.filter((v) => v.capsuleImplemented || v.status === 'implemented').length;
    let visualStatus = 'missing';
    if (visualDocs.length > 0) {
      visualStatus = visualImplemented === visualDocs.length ? 'ok' : 'partial';
    } else if (isStub || isSimulated) visualStatus = 'stub';

    const hasInteraction = Boolean(interaction?.panels?.some((p) => p.id === panelDef.id || p.capsulePanel === panelId));

    const effectCount = effectMap.get(panelId) || 0;
    const effectStatus = isStub ? 'n/a' : (effectCount > 0 ? 'ok' : (P0_PANELS.has(panelId) ? 'gap' : 'partial'));

    const scenarioCount = scenarioMap.get(panelId) || 0;
    const scenarioStatus = scenarioCount > 0 ? 'ok' : (isStub ? 'n/a' : 'partial');

    const contentGaps = [];
    if (!structureSimple) {
      contentGaps.push({ id: `${panelId}-structure`, severity: 'P0', note: 'Panneau absent de themes_gnome.html' });
    }
    if (playbookStatus === 'gap') {
      contentGaps.push({ id: `${panelId}-playbook`, severity: 'P1', note: 'Contrôles playbook non mappés VM' });
    }
    if (handlersOk < matrixControls && !isStub) {
      contentGaps.push({
        id: `${panelId}-parity-handlers`,
        severity: matrixControls - handlersOk > 2 ? 'P1' : 'P2',
        note: `${matrixControls - handlersOk} handler(s) absent(s) dans gnome-settings-parity.js`,
      });
    }
    if (visualStatus === 'missing' && !isStub) {
      contentGaps.push({ id: `${panelId}-visual`, severity: P0_PANELS.has(panelId) ? 'P0' : 'P2', note: 'Enquête visuelle non documentée' });
    }
    if (effectStatus === 'gap') {
      contentGaps.push({ id: `${panelId}-effects`, severity: 'P0', note: 'Effet shell non câblé (settings-effects-chain)' });
    }
    if (isStub) {
      contentGaps.push({ id: `${panelId}-stub`, severity: 'P3', status: 'accepted', note: 'Panneau décoratif — profondeur fonctionnelle limitée VM' });
    }
    if (isSimulated) {
      contentGaps.push({ id: `${panelId}-simulated`, severity: 'P3', status: 'accepted', note: 'Contrôles simulés — pas de gsettings VM unique' });
    }

    const openP0 = contentGaps.filter((g) => g.severity === 'P0' && g.status !== 'accepted').length;
    const realSigma = structureSimple
      && ['ok', 'stub', 'partial'].includes(playbookStatus)
      && ['ok', 'stub', 'partial'].includes(visualStatus)
      && effectStatus !== 'gap'
      && openP0 === 0;

    return {
      id: panelDef.id,
      capsulePanel: panelId,
      label: panelDef.label,
      priority: P0_PANELS.has(panelId) ? 'P0' : (isStub ? 'P3' : 'P2'),
      levels: {
        structure: structureSimple,
        playbook: playbookStatus,
        interaction: hasInteraction || isStub,
        visual: visualStatus,
        effects: effectStatus,
        scenarios: scenarioStatus,
      },
      metrics: {
        matrixControls,
        handlersBound: handlersOk,
        playbookMapped: mappedInPlaybook,
        playbookTotal: totalInPlaybook,
        visualDocumented: visualDocs.length,
        visualImplemented,
        effectBindings: effectCount,
        scenarioRefs: scenarioCount,
      },
      contentGaps,
      realSigma,
    };
  });

  const summary = {
    panelsTotal: panels.length,
    structureOk: panels.filter((p) => p.levels.structure).length,
    playbookOk: panels.filter((p) => p.levels.playbook === 'ok' || p.levels.playbook === 'stub').length,
    visualOk: panels.filter((p) => ['ok', 'stub'].includes(p.levels.visual)).length,
    realSigmaPanels: panels.filter((p) => p.realSigma).length,
    openP0Gaps: panels.reduce((n, p) => n + p.contentGaps.filter((g) => g.severity === 'P0' && g.status !== 'accepted').length, 0),
    v0Closed: panels.length >= 18
      && panels.every((p) => p.levels.structure)
      && panels.filter((p) => p.realSigma).length >= 15
      && panels.reduce((n, p) => n + p.contentGaps.filter((g) => g.severity === 'P0' && g.status !== 'accepted').length, 0) === 0,
  };

  return {
    version: 1,
    campaign: 'gnome-toolkit-settings',
    doc: 'root/docs/campagne-reproduction-gnome-toolkit.md',
    registryId,
    generatedAt: new Date().toISOString(),
    procedure: 'procedure-creation-playbook-gnome-settings.md',
    summary,
    panels,
  };
};

const main = () => {
  const opts = parseArgs();
  const state = buildState(opts.id);
  const outRel = `root/docs/inventaires/${opts.id}-gnome-campaign-state.json`;

  if (opts.write) {
    fs.writeFileSync(path.join(ROOT, outRel), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    console.log(`✓ ${outRel}`);
    console.log(`  panneaux RealΣ: ${state.summary.realSigmaPanels}/${state.summary.panelsTotal} · P0 gaps: ${state.summary.openP0Gaps} · v0Closed: ${state.summary.v0Closed}`);
  } else {
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
  }
};

main();
