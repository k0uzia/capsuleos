/**
 * Chaîne fidélité applications — prédicats calqués sur V/G/Vc/Vp (gsettings).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { evaluateAppsPredicates, pathsForApps } from './apps-catalog-lib.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-replication-chain.json');

export const loadAppsReplicationContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

/** Noms de fichiers capture Capsule par controlId (préfixe rocky-capsule-dark-*). */
export const capsuleCaptureCandidates = (controlId) => {
  const aliases = {
    nemo: ['rocky-capsule-dark-nautilus.png', 'rocky-capsule-light-nautilus.png'],
    firefox: ['rocky-capsule-dark-firefox.png', 'rocky-capsule-light-firefox.png'],
    terminal: ['rocky-capsule-dark-terminal.png'],
    themes: ['rocky-capsule-dark-settings-appearance.png', 'rocky-capsule-dark-settings-displays.png'],
    calculator: [
      'rocky-capsule-dark-calculator.png',
      'rocky-capsule-dark-calculator-basic.png',
      'rocky-capsule-dark-calculator-chain-clear.png',
      'rocky-capsule-dark-calculator-advanced.png',
      'rocky-capsule-dark-calculator-copy.png',
    ],
    text_editor: [
      'rocky-capsule-dark-text-editor.png',
      'rocky-capsule-dark-text-editor-new-doc.png',
      'rocky-capsule-dark-text-editor-open-file.png',
      'rocky-capsule-dark-text-editor-save-as.png',
      'rocky-capsule-dark-text-editor-tabs.png',
    ],
    update_manager: [
      'rocky-capsule-dark-software.png',
      'rocky-capsule-dark-software-updates.png',
      'rocky-capsule-dark-software-installed.png',
      'rocky-capsule-dark-software-detail.png',
      'rocky-capsule-dark-software-categories.png',
      'rocky-capsule-dark-software-install-open.png',
      'rocky-capsule-dark-software-search-install.png',
      'rocky-capsule-dark-software-updates-empty.png',
      'rocky-capsule-dark-software-installed-open.png',
    ],
    visionneur_images: ['rocky-capsule-dark-loupe.png'],
    visionneur_pdf: ['rocky-capsule-dark-papers.png'],
    clocks: [
      'rocky-capsule-dark-clocks.png',
      'rocky-capsule-dark-clocks-world-tokyo.png',
      'rocky-capsule-dark-clocks-stopwatch-running.png',
      'rocky-capsule-dark-clocks-timer-running.png',
      'rocky-capsule-dark-clocks-alarm-added.png',
    ],
    calendar: [
      'rocky-capsule-dark-calendar.png',
      'rocky-capsule-dark-calendar-month.png',
      'rocky-capsule-dark-calendar-event-added.png',
      'rocky-capsule-dark-calendar-week.png',
      'rocky-capsule-dark-calendar-next-month.png',
    ],
    snapshot: ['rocky-capsule-dark-snapshot.png'],
    characters: ['rocky-capsule-dark-characters.png'],
    tour: ['rocky-capsule-dark-tour.png'],
    baobab: ['rocky-capsule-dark-baobab.png'],
    system_monitor: ['rocky-capsule-dark-system-monitor.png'],
  };
  return [
    `${controlId}.png`,
    `rocky-capsule-${controlId}.png`,
    `rocky-capsule-dark-${controlId}.png`,
    ...(aliases[controlId] || []),
  ];
};

export const appsPathsForRegistry = (registryId) => ({
  ...pathsForApps(registryId),
  appsLabState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-lab-state.json`),
  appsVisualInvestigation: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`),
  appsReplicationState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-replication-state.json`),
  vmCapturesDir: path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'apps-visual'),
  capsuleCapturesDir: path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'apps-visual-capsule'),
});

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const countP0 = (inv, field) => (inv?.investigations || []).filter((i) => {
  if (i.parityPriority !== 'P0') return false;
  if (field === 'documented') return i.status === 'documented';
  if (field === 'capsuleCaptures') {
    return (i.capsuleCaptures || []).some((c) => c.path);
  }
  if (field === 'visualMatch') {
    return i.capsuleParity?.visualMatch && i.capsuleParity.visualMatch !== 'unknown';
  }
  return false;
}).length;

export const evaluateAppsReplicationPredicates = (registryId) => {
  const paths = appsPathsForRegistry(registryId);
  const base = evaluateAppsPredicates(registryId);
  const inv = readJson(paths.appsVisualInvestigation);
  const lab = readJson(paths.appsLabState);

  const documentedP0 = countP0(inv, 'documented');
  const capsuleCapturesP0 = countP0(inv, 'capsuleCaptures');
  const visualMatchClassifiedP0 = countP0(inv, 'visualMatch');

  const AppL = lab?.status === 'done';
  const AppVv = documentedP0 > 0;
  const AppVc = capsuleCapturesP0 > 0;
  const AppVp = visualMatchClassifiedP0 > 0;
  const AppΣ = base.AppΣ && AppL;

  const order = ['AppV', 'AppC', 'AppP0', 'AppL', 'AppVv', 'AppVc', 'AppVp'];
  const state = {
    AppV: base.AppV,
    AppC: base.AppC,
    AppP0: base.AppP0,
    AppL,
    AppVv,
    AppVc,
    AppVp,
    AppΣ,
    documentedP0,
    capsuleCapturesP0,
    visualMatchClassifiedP0,
  };

  let nextPredicate = null;
  for (const sym of order) {
    if (!state[sym]) {
      nextPredicate = sym;
      break;
    }
  }

  return {
    registryId,
    domain: 'apps-playbook',
    state,
    nextPredicate,
    paths,
    base,
    contract: loadAppsReplicationContract(),
  };
};

export const recordAppsLabState = (registryId, status, meta = {}) => {
  const p = appsPathsForRegistry(registryId).appsLabState;
  const body = {
    registryId,
    status,
    updatedAt: new Date().toISOString(),
    gate: 'run-apps-lab.mjs',
    ...meta,
  };
  fs.writeFileSync(p, `${JSON.stringify(body, null, 2)}\n`);
  return body;
};

export const writeAppsReplicationState = (evalResult) => {
  const contract = loadAppsReplicationContract();
  const out = {
    registryId: evalResult.registryId,
    domain: evalResult.domain,
    generatedAt: new Date().toISOString(),
    predicates: evalResult.state,
    nextPredicate: evalResult.nextPredicate,
    nextStep: null,
    rule: null,
  };
  for (const step of contract.steps || []) {
    const neg = (step.negates || []).some((sym) => !evalResult.state[sym]);
    const req = (step.requires || []).every((sym) => evalResult.state[sym]);
    if (neg && req) {
      out.nextStep = step.id;
      out.rule = `R-APP-CHAIN → ${step.id}`;
      break;
    }
  }
  fs.writeFileSync(evalResult.paths.appsReplicationState, `${JSON.stringify(out, null, 2)}\n`);
  return out;
};
