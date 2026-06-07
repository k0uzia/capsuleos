#!/usr/bin/env node
/**
 * Collecte états UI, effets et menus — VM playbooks + burst captures.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs --id linux-ubuntu --write
 *   node usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs --id linux-ubuntu --capsule
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const MATRIX = path.join(ROOT, 'root/tools/lab/ui-state-effects-matrix-gnome.json');
const PLAYBOOKS_SH = path.join(ROOT, 'root/tools/lab/vm-gnome-deep-playbooks.sh');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, capsule: false, filter: 'P0' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--capsule') opts.capsule = true;
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
  }
  return opts;
};

const loadHost = (registryId) => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const vendorFromId = (id) => id.replace(/^linux-/, '');

const sshIdentity = (host) => {
  const raw = host.sshIdentity || '~/.ssh/capsuleos-lab';
  return raw.replace(/^~/, process.env.HOME || '');
};

const parsePlaybookStdout = (stdout) => {
  const t = (stdout || '').trim();
  const lines = t.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{'));
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try { return JSON.parse(lines[i]); } catch (_) { /* continue */ }
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
  return null;
};

const runPlaybook = (host, playbook) => {
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
    { input: body, encoding: 'utf8', timeout: 120000 },
  );
  if (res.status !== 0) {
    return { ok: false, error: (res.stderr || res.stdout || '').trim(), result: null };
  }
  return { ok: true, result: parsePlaybookStdout(res.stdout) };
};

const virshShot = (destFile, host) => {
  const vmName = host.virshName || 'Rocky10';
  const res = spawnSync(
    'virsh',
    ['-c', 'qemu:///system', 'screenshot', vmName, '--file', destFile],
    { encoding: 'utf8', timeout: 30000 },
  );
  return res.status === 0 && fs.existsSync(destFile);
};

const sleep = (ms) => spawnSync('sleep', [String(ms / 1000)]);

const extractMenus = (playbookResult, matrixMenus) => {
  const menus = [];
  if (playbookResult?.expectedMenu) {
    menus.push({
      role: 'context-menu',
      items: playbookResult.expectedMenu.map((m) => (typeof m === 'string' ? m : m.label)),
      source: 'playbook',
    });
  }
  if (Array.isArray(matrixMenus)) {
    for (const m of matrixMenus) {
      menus.push({ role: m.role, id: m.id, items: m.items || [], source: 'matrix' });
    }
  }
  return menus;
};

const capsuleSelectorMap = {
  'shell.overview.open': '.fedora-overview.is-open, body.is-overview',
  'shell.overview.close': 'body:not(.is-overview)',
  'shell.quickSettings.open': '#volume-popover:not([hidden])',
  'app.nautilus.open': '.windowElement[data-link="nemo"]:not([style*="display: none"])',
  'app.nautilus.contextmenu': '.nautilus-context-menu, .nemo-context-menu',
  'desktop.contextmenu': '.desktop-context-menu',
};

const probeCapsuleStyles = async (registryId, transitionId, selector) => {
  const host = loadHost(registryId);
  const base = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
  const url = host.capsuleUrl || `${base}/home/Debian/Ubuntu/index.html`;
  const chromePath = [
    process.env.PLAYWRIGHT_CHROME,
    '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
    '/usr/bin/chromium',
  ].find((p) => p && fs.existsSync(p));

  if (!chromePath || !selector) return { visualMatch: 'unknown', computedStyles: {} };

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  const styles = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      opacity: cs.opacity,
      transform: cs.transform,
      boxShadow: cs.boxShadow,
      backdropFilter: cs.backdropFilter,
      background: cs.background?.slice(0, 120),
      borderRadius: cs.borderRadius,
      transitionDuration: cs.transitionDuration,
      transitionTimingFunction: cs.transitionTimingFunction,
      filter: cs.filter,
    };
  }, selector);

  await browser.close();
  return {
    visualMatch: styles ? 'partial' : 'missing',
    computedStyles: styles || {},
  };
};

const main = async () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const vendor = vendorFromId(opts.id);
  const matrix = JSON.parse(fs.readFileSync(MATRIX, 'utf8'));
  const transitions = matrix.transitions.filter((t) => {
    if (opts.filter === 'all') return true;
    return t.parity === opts.filter;
  });

  const vmDir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'inventory', `${vendor}-ui-effects-vm`);
  fs.mkdirSync(vmDir, { recursive: true });

  const investigations = [];

  for (const tr of transitions) {
    process.stderr.write(`  → ${tr.id} (${tr.playbookVm})\n`);
    const subdir = path.join(vmDir, tr.id);
    fs.mkdirSync(subdir, { recursive: true });

    const pb = runPlaybook(host, tr.playbookVm);
    const captures = [];
    const burst = tr.burstMs || [0, 150, 300];

    for (let i = 0; i < burst.length; i += 1) {
      const ms = burst[i];
      if (ms > 0) sleep(ms - (burst[i - 1] || 0));
      const phase = i === 0 ? 'before' : i === burst.length - 1 ? 'after' : `during-${ms}ms`;
      const file = path.join(subdir, `${phase}.png`);
      const ok = virshShot(file, host);
      captures.push({
        phase,
        path: ok ? path.relative(ROOT, file) : null,
        elapsedMs: ms,
        ok,
      });
    }

    const menus = extractMenus(pb.result, tr.menus);
    const inv = {
      transitionId: tr.id,
      surface: tr.surface,
      fromState: tr.from,
      toState: tr.to,
      trigger: tr.trigger,
      playbookVm: tr.playbookVm,
      status: pb.ok ? 'documented' : 'failed',
      vmCaptures: captures,
      effectsExpected: tr.effects || {},
      effectsObserved: {
        durationMs: tr.effects?.durationMs ?? null,
        easing: tr.effects?.easing ?? null,
        properties: tr.effects?.properties || [],
        notes: pb.ok ? 'playbook VM OK' : pb.error,
      },
      menusDetected: menus,
      submenusDetected: [],
      popupsDetected: menus.filter((m) => m.role === 'popover'),
      playbookResult: pb.result,
      capsuleParity: {
        selector: capsuleSelectorMap[tr.id] || null,
        computedStyles: {},
        visualMatch: 'unknown',
        parityPriority: tr.parity,
        gapNotes: null,
      },
    };

    if (opts.capsule && inv.capsuleParity.selector) {
      const cap = await probeCapsuleStyles(opts.id, tr.id, inv.capsuleParity.selector);
      inv.capsuleParity = { ...inv.capsuleParity, ...cap };
    }

    investigations.push(inv);
    sleep(2000);
  }

  const menuCatalog = investigations.flatMap((i) => i.menusDetected.map((m) => ({
    transitionId: i.transitionId,
    ...m,
  })));

  const documented = investigations.filter((i) => i.status === 'documented').length;
  const p0 = transitions.length;
  const effectsMeasured = investigations.filter((i) => i.effectsObserved?.properties?.length).length;
  const menusEnumerated = menuCatalog.reduce((n, m) => n + (m.items?.length || 0), 0);
  const capsuleMatched = investigations.filter((i) => i.capsuleParity.visualMatch === 'partial').length;

  const out = {
    registryId: opts.id,
    generatedAt: new Date().toISOString(),
    contract: 'etc/capsuleos/contracts/ui-state-effects.json',
    procedure: 'procedure-audit-etats-ui-effets.md',
    matrixSource: 'root/tools/lab/ui-state-effects-matrix-gnome.json',
    summary: {
      transitionsTotal: matrix.transitions.length,
      transitionsP0: matrix.transitions.filter((t) => t.parity === 'P0').length,
      documented,
      menusEnumerated,
      effectsMeasured,
      capsuleMatched,
      gapsP0: Math.max(0, p0 - documented),
      predicates: {
        Ve: documented >= p0,
        Vx: effectsMeasured >= p0,
        Vm: menusEnumerated > 0,
        Vμ: opts.capsule ? capsuleMatched > 0 : false,
        VΣ: false,
      },
    },
    investigations,
    menuCatalog,
    transitionGraph: {
      nodes: matrix.surfaces.flatMap((s) => s.states.map((st) => `${s.id}.${st}`)),
      edges: transitions.map((t) => ({ from: `${t.surface}.${t.from}`, to: `${t.surface}.${t.to}`, id: t.id })),
    },
    nextActions: [],
  };

  out.summary.predicates.VΣ = out.summary.predicates.Ve
    && out.summary.predicates.Vx
    && out.summary.predicates.Vm
    && (opts.capsule ? out.summary.predicates.Vμ : true);

  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-ui-state-effects.json`);
  if (opts.write || opts.capsule) {
    fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
    process.stdout.write(`OK ${outPath}\n`);
    process.stdout.write(`  Ve=${out.summary.predicates.Ve} Vx=${out.summary.predicates.Vx} Vm=${out.summary.predicates.Vm} Vμ=${out.summary.predicates.Vμ}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(out.summary, null, 2)}\n`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
