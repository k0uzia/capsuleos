/**
 * Chaîne fidélité applications — prédicats calqués sur V/G/Vc/Vp (gsettings).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { evaluateAppsPredicates, pathsForApps } from './apps-catalog-lib.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-replication-chain.json');

export const loadAppsReplicationContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

/** Noms de fichiers capture Capsule KDE Neon (capture-capsule-kde-neon.mjs + baseline). */
const KDE_NEON_CAPTURE_ALIASES = {
  themes: ['capsule-systemsettings.png', 'themes.png'],
  nemo: ['capsule-dolphin.png', '03-dolphin.png', 'nemo.png'],
  firefox: ['capsule-firefox.png', '04-firefox.png', 'firefox.png'],
  terminal: ['capsule-terminal.png', '05-terminal.png', 'terminal.png'],
  update_manager: ['capsule-discover.png', '06-discover.png', 'update_manager.png'],
  text_editor: ['capsule-kate.png', 'text_editor.png'],
  lecteur_multimedia: ['capsule-vlc.png', '07-discover-detail-vlc.png', 'lecteur_multimedia.png'],
  visionneur_images: ['capsule-gwenview.png', 'visionneur_images.png'],
  visionneur_pdf: ['capsule-okular.png', 'visionneur_pdf.png'],
  spectacle: ['capsule-spectacle.png'],
  kinfocenter: ['capsule-kinfocenter.png'],
  system_monitor: ['capsule-system-monitor.png'],
};

/** Noms de fichiers capture Capsule par controlId (préfixe rocky-capsule-dark-*). */
export const capsuleCaptureCandidates = (controlId, registryId = 'linux-rocky') => {
  if (registryId === 'linux-kde-neon') {
    return [
      `${controlId}.png`,
      `capsule-${controlId}.png`,
      ...(KDE_NEON_CAPTURE_ALIASES[controlId] || []),
    ];
  }
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
    tour: [
      'rocky-capsule-dark-tour.png',
      'rocky-capsule-dark-tour-welcome.png',
      'rocky-capsule-dark-tour-overview.png',
      'rocky-capsule-dark-tour-workspaces.png',
      'rocky-capsule-dark-tour-finish.png',
    ],
    baobab: [
      'rocky-capsule-dark-baobab.png',
      'rocky-capsule-dark-baobab-home.png',
      'rocky-capsule-dark-baobab-computer.png',
      'rocky-capsule-dark-baobab-treemap.png',
      'rocky-capsule-dark-baobab-boot.png',
    ],
    system_monitor: ['rocky-capsule-dark-system-monitor.png'],
  };
  return [
    `${controlId}.png`,
    `rocky-capsule-${controlId}.png`,
    `rocky-capsule-dark-${controlId}.png`,
    ...(aliases[controlId] || []),
  ];
};

export const capsuleCaptureSearchDirs = (registryId, paths) => {
  const dirs = [paths.capsuleCapturesDir];
  if (registryId !== 'linux-kde-neon') {
    return dirs;
  }
  dirs.push(path.join(ROOT, 'home/public/Images/screen_KDE-Neon'));
  const captureRoot = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon');
  if (fs.existsSync(captureRoot)) {
    for (const entry of fs.readdirSync(captureRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'baseline' && entry.name !== 'apps-visual-capsule' && entry.name !== 'apps-visual') {
        dirs.push(path.join(captureRoot, entry.name));
      }
    }
  }
  const manifestPath = path.join(captureRoot, 'baseline/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const cap of manifest.captures || []) {
      if (cap.file) {
        dirs.push(path.dirname(path.join(ROOT, cap.file)));
      }
    }
  }
  return [...new Set(dirs)];
};

export const findCapsuleCapture = (registryId, controlId, paths) => {
  const candidates = capsuleCaptureCandidates(controlId, registryId);
  for (const dir of capsuleCaptureSearchDirs(registryId, paths)) {
    for (const name of candidates) {
      const abs = path.join(dir, name);
      if (fs.existsSync(abs)) {
        return abs;
      }
    }
  }
  return null;
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
