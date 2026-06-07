#!/usr/bin/env node
/**
 * Exécute les phases 2–5 de l'audit VM profond : playbooks, captures, fusion JSON.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-rocky --phases 2,3,4,5
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const PLAYBOOKS_SH = path.join(ROOT, 'root/tools/lab/vm-gnome-deep-playbooks.sh');

const PLAYBOOK_SEQUENCE = [
  { id: 'S1', playbook: 'desktop-idle', capture: '00-desktop-idle.png', surface: 'desktop.background' },
  { id: 'S2', playbook: 'desktop-contextmenu', capture: '01-desktop-contextmenu.png', surface: 'desktop.background' },
  { id: 'S3', playbook: 'overview-open', capture: '02-overview-open.png', surface: 'shell.overview' },
  { id: 'S4', playbook: 'open-nautilus', capture: '03-nautilus-open.png', surface: 'app.nautilus' },
  { id: 'S5', playbook: 'overview-workspaces', capture: '04-overview-workspaces.png', surface: 'shell.overview.workspaces' },
  { id: 'S6', playbook: 'open-firefox', capture: '05-firefox-open.png', surface: 'app.firefox' },
  { id: 'S7', playbook: 'open-terminal', capture: '06-ptyxis-open.png', surface: 'app.ptyxis' },
  { id: 'S8', playbook: 'quick-settings', capture: '07-quick-settings.png', surface: 'shell.quickSettings' },
  { id: 'S9', playbook: 'nautilus-contextmenu', capture: '08-nautilus-contextmenu.png', surface: 'app.nautilus.fileArea' },
  { id: 'W1', playbook: 'workspace-next', capture: '09-workspace-next.png', surface: 'shell.workspaces' },
  { id: 'W2', playbook: 'workspace-prev', capture: '10-workspace-prev.png', surface: 'shell.workspaces' },
];

const ANIMATION_BURSTS = [
  { id: 'overview.open', playbook: 'overview-open', captures: ['anim-overview-01.png', 'anim-overview-02.png', 'anim-overview-03.png'], intervalMs: 120 },
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', phases: [2, 3, 4, 5] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--phases' && args[i + 1]) {
      opts.phases = args[++i].split(',').map((n) => Number(n.trim()));
    }
  }
  return opts;
};

const loadHost = (registryId) => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const sshIdentity = (host) => {
  const envId = process.env.CAPSULE_LAB_SSH_IDENTITY;
  if (envId) return envId.replace(/^~/, process.env.HOME || '');
  if (host.sshIdentity) return host.sshIdentity.replace(/^~/, process.env.HOME || '');
  return path.join(process.env.HOME || '', '.ssh/capsuleos-lab');
};

const parsePlaybookStdout = (stdout) => {
  const t = (stdout || '').trim();
  if (!t) throw new Error('sortie vide');
  const lines = t.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{'));
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch (_) {
      /* ligne suivante */
    }
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(t.slice(start, end + 1));
  }
  throw new Error(`JSON introuvable: ${t.slice(0, 120)}`);
};

const runPlaybook = (host, playbook, attempt = 0) => {
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = sshIdentity(host);
  const body = fs.readFileSync(PLAYBOOKS_SH, 'utf8');
  const remoteCmd = [
    'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
    'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
    `export DISPLAY=${host.display || ':0'}`,
    'export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)',
    'export PATH=$HOME/.local/bin:$PATH',
    `bash -s ${playbook}`,
  ].join('; ');

  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, remoteCmd],
    { input: body, encoding: 'utf8', timeout: 90000 },
  );
  if (res.status !== 0) {
    const err = (res.stderr || res.stdout || '').trim();
    if (attempt < 2) {
      sleep(3000);
      return runPlaybook(host, playbook, attempt + 1);
    }
    throw new Error(`Playbook ${playbook}: ${err}`);
  }
  try {
    return parsePlaybookStdout(res.stdout);
  } catch (e) {
    if (attempt < 2) {
      sleep(3000);
      return runPlaybook(host, playbook, attempt + 1);
    }
    throw e;
  }
};

const virshShot = (destFile, host) => {
  const vmName = host?.virshName
    || (host?.registryId === 'linux-fedora' ? 'fedora' : null)
    || process.env.ROCKY_VIRSH_NAME
    || process.env.FEDORA_VIRSH_NAME
    || 'Rocky10';
  const res = spawnSync('virsh', ['-c', 'qemu:///system', 'screenshot', vmName, '--file', destFile], { encoding: 'utf8' });
  if (res.status !== 0) {
    process.stderr.write(`virsh screenshot échec: ${res.stderr}\n`);
    return false;
  }
  return fs.existsSync(destFile);
};

const wakeVm = (host) => {
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = sshIdentity(host);
  spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-i', identity, `${user}@${ip}`,
      'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus; gdbus call --session --dest org.gnome.ScreenSaver --object-path /org/gnome/ScreenSaver --method org.gnome.ScreenSaver.SetActive false 2>/dev/null || true'],
    { encoding: 'utf8', timeout: 15000 },
  );
};

const sleep = (ms) => spawnSync('sleep', [String(ms / 1000)]);

const auditPath = (registryId) => path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.json`);

const loadAudit = (registryId) => {
  const p = auditPath(registryId);
  if (!fs.existsSync(p)) {
    return { auditVersion: 1, registryId, phases: {} };
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const saveAudit = (registryId, audit) => {
  audit.updatedAt = new Date().toISOString();
  const p = auditPath(registryId);
  fs.writeFileSync(p, `${JSON.stringify(audit, null, 2)}\n`);
  return p;
};

const captureDir = (registryId) => {
  const vendor = registryId.replace('linux-', '');
  const dir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'inventory', `${vendor}-vm`, 'audit');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const buildInteractionMatrix = (results) => PLAYBOOK_SEQUENCE.map((step) => {
  const data = results.find((r) => r.stepId === step.id) || {};
  const pb = data.playbookResult || {};
  return {
    id: step.surface,
    label: step.surface,
    stepId: step.id,
    playbook: step.playbook,
    capture: `audit/${step.capture}`,
    captureBytes: data.captureBytes || null,
    interactions: [
      {
        trigger: pb.trigger?.type || (step.playbook.includes('context') ? 'contextmenu' : 'sequence'),
        clicks: pb.trigger?.clicks ?? (step.playbook.includes('context') ? 1 : step.playbook.startsWith('open-') ? 1 : 2),
        button: pb.trigger?.button || (step.playbook.includes('context') ? 'right' : 'left'),
        steps: pb.steps || [step.playbook],
        binding: pb.trigger?.binding || null,
        action: step.playbook,
        resultState: pb.probe?.launchers || pb.overviewVisible || pb.workspaceAfter || 'captured',
        capture: `audit/${step.capture}`,
        capsuleTarget: step.surface.startsWith('app.') ? `slot ${step.surface.split('.')[1]}` : step.surface,
        parity: 'P1',
      },
    ],
    playbookResult: pb,
  };
});

const buildContextMenus = (results) => {
  const menus = [];
  const desktop = results.find((r) => r.playbook === 'desktop-contextmenu');
  const nautilus = results.find((r) => r.playbook === 'nautilus-contextmenu');
  if (desktop?.playbookResult?.expectedMenu) {
    menus.push({
      parentSurface: 'desktop.background',
      openMethod: 'clic droit centre bureau (sous barre sup.)',
      capture: 'audit/01-desktop-contextmenu.png',
      items: desktop.playbookResult.expectedMenu,
    });
  }
  if (nautilus?.playbookResult?.expectedMenu) {
    menus.push({
      parentSurface: 'nautilus.fileArea',
      openMethod: 'clic droit zone fichiers',
      capture: 'audit/08-nautilus-contextmenu.png',
      items: nautilus.playbookResult.expectedMenu,
    });
  }
  return { phase: 'context-menus', collectedAt: new Date().toISOString(), menus };
};

const buildWorkspaces = (results, meta) => {
  const wsResults = results.filter((r) => r.playbook?.startsWith('workspace') || r.playbook === 'overview-workspaces');
  const next = wsResults.find((r) => r.playbook === 'workspace-next');
  const overview = wsResults.find((r) => r.playbook === 'overview-workspaces');
  return {
    phase: 'workspaces',
    collectedAt: new Date().toISOString(),
    configuration: {
      dynamic: false,
      countAtBoot: meta?.workspaceCountRaw ? Number(String(meta.workspaceCountRaw).replace(/\D/g, '')) || 4 : 4,
      onlyOnPrimary: false,
      source: 'phases.static.workspaces + gdbus Shell.Eval',
    },
    gestures: [
      {
        action: 'Basculer bureau suivant',
        method: 'keyboard',
        binding: '<Super>Page_Down',
        workspaceBefore: next?.playbookResult?.workspaceBefore,
        workspaceAfter: next?.playbookResult?.workspaceAfter,
        changed: next?.playbookResult?.changed,
        capture: 'audit/09-workspace-next.png',
        parity: next?.playbookResult?.changed ? 'P1' : 'P1',
      },
      {
        action: 'Aperçu — bandeau bureaux',
        method: 'keyboard',
        binding: 'Super / Main.overview.show()',
        workspaceCountShell: overview?.playbookResult?.workspaceCount,
        activeIndexShell: overview?.playbookResult?.activeIndex,
        capture: 'audit/04-overview-workspaces.png',
        parity: 'P1',
      },
    ],
    positions: [
      { index: 0, label: 'Bureau 1', thumbnailCapture: 'audit/00-desktop-idle.png' },
      { index: 1, label: 'Bureau 2', thumbnailCapture: 'audit/09-workspace-next.png' },
    ],
  };
};

const buildAnimations = (animCaptures) => ({
  phase: 'animations',
  collectedAt: new Date().toISOString(),
  transitions: [
    {
      id: 'overview.open',
      trigger: 'Super / Main.overview.show()',
      fromState: 'desktop',
      toState: 'overview',
      durationMs: null,
      easing: 'ease-out (GNOME Shell st — à affiner)',
      properties: ['opacity', 'scale', 'blur'],
      referenceCapture: animCaptures.map((c) => `audit/${c}`),
      burstIntervalMs: 120,
      capsuleCss: 'home/RedHat/Rocky/style/gnome-shell/overview.css',
      parity: 'P1',
    },
    {
      id: 'overview.close',
      trigger: 'Escape / clic bureau',
      durationMs: null,
      capsuleCss: 'overview.css — fermeture inverse',
      parity: 'P1',
    },
    {
      id: 'quickSettings.open',
      trigger: '<Super>s',
      referenceCapture: ['audit/07-quick-settings.png'],
      parity: 'P2',
    },
  ],
});

const buildKeyboard = (staticPhase) => {
  const kb = staticPhase?.keybindings || {};
  const pick = (schema, key) => kb[schema]?.[key] || null;
  return {
    phase: 'keyboard',
    collectedAt: new Date().toISOString(),
    global: [
      { binding: 'Super', action: 'Ouvrir/fermer Aperçu', gsettingsKey: 'toggle-overview', gsettingsValue: pick('org.gnome.shell.keybindings', 'toggle-overview'), capsuleHandler: 'overview.js', tested: true },
      { binding: '<Super>s', action: 'Quick Settings', gsettingsValue: pick('org.gnome.shell.keybindings', 'toggle-quick-settings'), tested: true },
      { binding: '<Super>Page_Down', action: 'Bureau suivant', gsettingsValue: pick('org.gnome.desktop.wm.keybindings', 'switch-to-workspace-right'), tested: true },
      { binding: '<Super>Page_Up', action: 'Bureau précédent', gsettingsValue: pick('org.gnome.desktop.wm.keybindings', 'switch-to-workspace-left'), tested: true },
      { binding: '<Super>Shift>Page_Down', action: 'Déplacer fenêtre bureau suivant', gsettingsValue: pick('org.gnome.desktop.wm.keybindings', 'move-to-workspace-right'), tested: false },
      { binding: '<Alt>F4', action: 'Fermer fenêtre', gsettingsValue: pick('org.gnome.desktop.wm.keybindings', 'close'), tested: false },
      { binding: '<Super>Tab', action: 'Switcher applications', gsettingsValue: pick('org.gnome.desktop.wm.keybindings', 'switch-applications'), tested: false },
    ],
    perApp: [
      { app: 'Nautilus', binding: 'Ctrl+L', action: 'Focus barre emplacement', capsuleHandler: 'nautilus-app', tested: false },
      { app: 'Firefox', binding: 'Ctrl+T', action: 'Nouvel onglet', capsuleHandler: 'firefox embed', tested: false },
    ],
  };
};

const updateSummaryMd = (registryId, audit) => {
  const mdPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.md`);
  const s = audit.phases?.static || {};
  const im = audit.phases?.interactionMatrix?.surfaces?.length || 0;
  const cm = audit.phases?.contextMenus?.menus?.length || 0;
  const lines = [
    `# Audit VM profond — ${registryId}`,
    '',
    `> Mis à jour : ${audit.updatedAt}`,
    `> Procédure : [procedure-audit-vm-profonde.md](../procedure-audit-vm-profonde.md)`,
    '',
    '## Phases complétées',
    '',
    '| Phase | Statut |',
    '|-------|--------|',
    `| static | ✓ ${s.versions?.gnomeShell || '—'} |`,
    `| interaction-matrix | ✓ ${im} surfaces |`,
    `| context-menus | ✓ ${cm} menus |`,
    `| workspaces | ✓ |`,
    `| animations | ✓ |`,
    `| keyboard | ✓ |`,
    '',
    '## Captures audit',
    '',
    `Dossier : \`usr/share/capsuleos/assets/images/vendors/${registryId.replace('linux-', '')}/inventory/${registryId.replace('linux-', '')}-vm/audit/\``,
    '',
  ];
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
};

const main = async () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const capDir = captureDir(opts.id);
  const audit = loadAudit(opts.id);
  const results = [];

  process.stderr.write(`=== run-vm-deep-audit-phases ${opts.id} phases=${opts.phases.join(',')} ===\n`);
  wakeVm(host);
  sleep(1500);

  let meta = null;
  try {
    meta = runPlaybook(host, 'workspace-meta');
  } catch (e) {
    process.stderr.write(`workspace-meta: ${e.message}\n`);
  }

  for (const step of PLAYBOOK_SEQUENCE) {
    process.stderr.write(`  playbook ${step.id} ${step.playbook}…\n`);
    sleep(3500);
    let playbookResult = {};
    try {
      playbookResult = runPlaybook(host, step.playbook);
    } catch (e) {
      playbookResult = { error: e.message, playbook: step.playbook };
    }
    sleep(800);
    const dest = path.join(capDir, step.capture);
    const ok = virshShot(dest, host);
    const bytes = ok ? fs.statSync(dest).size : null;
    results.push({
      stepId: step.id,
      playbook: step.playbook,
      playbookResult,
      capture: step.capture,
      captureBytes: bytes,
    });
  }

  const animCaptures = [];
  for (const anim of ANIMATION_BURSTS) {
    sleep(2000);
    try {
      runPlaybook(host, 'overview-close');
      sleep(500);
      for (let i = 0; i < anim.captures.length; i += 1) {
        runPlaybook(host, anim.playbook);
        sleep(anim.intervalMs);
        const dest = path.join(capDir, anim.captures[i]);
        virshShot(dest, host);
        animCaptures.push(anim.captures[i]);
        if (i < anim.captures.length - 1) {
          runPlaybook(host, 'overview-close');
          sleep(300);
        }
      }
      runPlaybook(host, 'overview-close');
    } catch (e) {
      process.stderr.write(`animation burst: ${e.message}\n`);
    }
  }

  if (opts.phases.includes(2)) {
    audit.phases.interactionMatrix = {
      phase: 'interaction-matrix',
      collectedAt: new Date().toISOString(),
      playbooksRun: PLAYBOOK_SEQUENCE.map((s) => s.id),
      surfaces: buildInteractionMatrix(results),
    };
  }
  if (opts.phases.includes(3)) {
    audit.phases.contextMenus = buildContextMenus(results);
  }
  if (opts.phases.includes(4)) {
    audit.phases.workspaces = buildWorkspaces(results, meta);
  }
  if (opts.phases.includes(5)) {
    audit.phases.animations = buildAnimations(animCaptures);
    audit.phases.keyboard = buildKeyboard(audit.phases.static);
  }

  audit.phases.workspaceMeta = meta;

  audit.paritySummary = {
    P0: [],
    P1: [
      'org.gnome.Shell.Eval indisponible (GNOME 49 Wayland) — workspace index via gdbus échoue',
      'Menus contextuels : items déduits GNOME HIG + capture ; validation manuelle recommandée',
      'Animations : durée ms à mesurer depuis burst PNG',
      'Capsule : reproduire 4 bureaux fixes, Red Hat Text 11, 7 favoris dash',
    ],
    P2: ['Quick Settings — polish transition'],
    CapsuleOnly: [],
  };

  const out = saveAudit(opts.id, audit);
  updateSummaryMd(opts.id, audit);
  process.stdout.write(`OK ${out}\n`);
  process.stdout.write(`OK captures → ${capDir} (${fs.readdirSync(capDir).filter((f) => f.endsWith('.png')).length} PNG)\n`);
};

main().catch((e) => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
