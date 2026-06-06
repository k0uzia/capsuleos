#!/usr/bin/env node
/**
 * Collecte enquête visuelle P0 VM → inventaire + captures locales.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id linux-rocky --filter P0
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const SCRIPT = path.join(ROOT, 'root/tools/lab/vm-gnome-settings-visual-investigation.sh');
const MATRIX = path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix.json');
const CAPTURES_BASE = path.join(ROOT, 'root/docs/inventaires/captures/linux-rocky/gnome-settings-visual');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'P0', local: false, pending: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--local') opts.local = true;
    else if (args[i] === '--pending') opts.pending = true;
  }
  return opts;
};

const pendingControlIds = (registryId, filter) => {
  const invPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-visual-investigation.json`);
  if (!fs.existsSync(invPath)) return [];
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  return (inv.investigations || [])
    .filter((i) => i.capsuleParity?.parityPriority === filter && i.status !== 'documented')
    .map((i) => i.controlId);
};

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) throw new Error('etc/capsuleos/lab-inventory.json manquant');
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const remoteEnv = (host) => {
  const parts = [
    `export DISPLAY=${host.display || ':0'}`,
    'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
    'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
    'export XDG_CURRENT_DESKTOP=GNOME',
    'export GNOME_SHELL_SESSION_MODE=default',
  ];
  if (host.xauthorityDiscovery === 'mutter-xwayland') {
    parts.push('export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)');
  }
  return parts.join('; ');
};

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const runLocal = (filter, onlyIds = []) => {
  const outDir = `/tmp/capsuleos-visual-${Date.now()}`;
  const res = spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CAPSULE_VISUAL_MATRIX: MATRIX,
      CAPSULE_VISUAL_OUT: outDir,
      CAPSULE_VISUAL_FILTER: filter,
      CAPSULE_VISUAL_ONLY_IDS: onlyIds.join(','),
    },
    timeout: 300000,
  });
  if (res.status !== 0) {
    throw new Error(`Enquête locale échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return { payload: parseJsonStdout(res.stdout || ''), remoteOutDir: outDir };
};

const runOnVm = (host, filter, onlyIds = []) => {
  const matrixB64 = Buffer.from(fs.readFileSync(MATRIX, 'utf8')).toString('base64');
  const scriptBody = fs.readFileSync(SCRIPT, 'utf8');
  const remoteOut = '/tmp/capsuleos-visual-investigation';
  const remoteScript = `
${remoteEnv(host)}
MATRIX_FILE=$(mktemp /tmp/capsule-visual-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
export CAPSULE_SETTINGS_ASSETS_MATRIX="$MATRIX_FILE"
export CAPSULE_VISUAL_MATRIX="$MATRIX_FILE"
export CAPSULE_VISUAL_OUT="${remoteOut}"
export CAPSULE_VISUAL_FILTER="${filter}"
export CAPSULE_VISUAL_ONLY_IDS="${onlyIds.join(',')}"
rm -rf "${remoteOut}" && mkdir -p "${remoteOut}"
bash -s <<'VIS_EOF'
${scriptBody}
VIS_EOF
rm -f "$MATRIX_FILE"
`;

  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = process.env.CAPSULE_LAB_SSH_IDENTITY
    || (host.sshIdentity ? path.join(process.env.HOME || '', host.sshIdentity.replace(/^~\//, '')) : null)
    || path.join(process.env.HOME || '', '.ssh/capsuleos-lab');

  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: remoteScript, encoding: 'utf8', timeout: 300000 },
  );
  if (res.status !== 0) {
    throw new Error(`SSH enquête visuelle échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return { payload: parseJsonStdout(res.stdout || ''), remoteOutDir: remoteOut, host, identity, user, ip };
};

const scpCaptures = ({ host, identity, user, ip, remoteOutDir }) => {
  fs.mkdirSync(CAPTURES_BASE, { recursive: true });
  const sshTarget = `${user}@${ip}`;
  const sshOpts = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity];
  const res = spawnSync(
    'scp',
    [...sshOpts, '-r', `${sshTarget}:${remoteOutDir}/`, `${CAPTURES_BASE}/`],
    { encoding: 'utf8', timeout: 120000 },
  );
  if (res.status !== 0) {
    process.stderr.write(`⚠ SCP captures partiel: ${(res.stderr || '').trim()}\n`);
    return false;
  }
  return true;
};

const sshRun = (host, identity, user, ip, cmd) => {
  const script = `${remoteEnv(host)}; ${cmd}`;
  return spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: script, encoding: 'utf8', timeout: 60000 },
  );
};

const virshShot = (host, relPath) => {
  const vmName = host.virshName || process.env.ROCKY_VIRSH_NAME || 'Rocky10';
  const abs = path.join(CAPTURES_BASE, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const res = spawnSync(
    'virsh',
    ['-c', 'qemu:///system', 'screenshot', vmName, '--file', abs],
    { encoding: 'utf8', timeout: 90000 },
  );
  return res.status === 0 && fs.existsSync(abs) && fs.statSync(abs).size > 0;
};

const relCapture = (controlId, file) =>
  path.join('root/docs/inventaires/captures/linux-rocky/gnome-settings-visual', controlId, file);

const applyControlState = (host, identity, user, ip, controlId, rawValue) => {
  const value = String(rawValue || '').replace(/'/g, '').trim();
  if (controlId === 'dnd' && value === 'toggle') {
    const script = "const qs = Main.panel.statusArea.quickSettings; if (qs && qs._dndToggle) qs._dndToggle.toggle(); 'ok';";
    sshRun(
      host,
      identity,
      user,
      ip,
      `gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "${script}"`,
    );
    return true;
  }
  if (!value || value.includes('toggled') || value.startsWith('(')) {
    return false;
  }
  if (controlId === 'theme') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.interface color-scheme '${value}'`);
    return true;
  }
  if (controlId === 'night-light') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.settings-daemon.plugins.color night-light-enabled ${value}`);
    return true;
  }
  if (controlId === 'dynamic-workspaces') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.mutter dynamic-workspaces ${value}`);
    return true;
  }
  if (controlId === 'accent') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.interface accent-color '${value}'`);
    return true;
  }
  if (controlId === 'wallpaper') {
    const uri = value.startsWith('file://') ? value : `file://${value}`;
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.background picture-uri '${uri}'`);
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.background picture-uri-dark '${uri}'`);
    return true;
  }
  if (controlId === 'hot-corner') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.interface enable-hot-corners ${value}`);
    return true;
  }
  if (controlId === 'display-scale' || controlId === 'font-scale') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.interface text-scaling-factor ${value}`);
    return true;
  }
  if (controlId === 'power-mode') {
    const profile = value.replace(/'/g, '').trim();
    if (profile && profile !== 'unavailable' && profile !== 'unknown') {
      sshRun(host, identity, user, ip, `powerprofilesctl set ${profile} 2>/dev/null || true`);
      sshRun(
        host,
        identity,
        user,
        ip,
        `gdbus call --system --dest org.freedesktop.UPower.PowerProfiles `
        + `--object-path /org/freedesktop/UPower/PowerProfiles `
        + `--method org.freedesktop.UPower.PowerProfiles.SetActiveProfile '${profile}'`,
      );
      return true;
    }
    return false;
  }
  if (controlId === 'contrast') {
    const theme = value.replace(/'/g, '').trim();
    if (theme) {
      sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.interface gtk-theme '${theme}'`);
      return true;
    }
    return false;
  }
  if (controlId === 'notifications') {
    sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.notifications show-banners ${value}`);
    return true;
  }
  if (controlId === 'power-dim') {
    const timeout = String(rawValue || '').trim();
    if (timeout.startsWith('uint32')) {
      sshRun(host, identity, user, ip, `gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout ${timeout}`);
      return true;
    }
    return false;
  }
  if (controlId === 'wifi') {
    const on = String(rawValue || '').toLowerCase().includes('enabled');
    sshRun(host, identity, user, ip, `nmcli radio wifi ${on ? 'on' : 'off'} 2>/dev/null || true`);
    return true;
  }
  if (controlId === 'search-files') {
    const raw = String(rawValue || '').trim();
    if (raw.startsWith('@as')) {
      sshRun(host, identity, user, ip, `gsettings set org.gnome.desktop.search-providers disabled "${raw}"`);
      return true;
    }
    return false;
  }
  if (controlId === 'dnd') {
    const script = "const qs = Main.panel.statusArea.quickSettings; if (qs && qs._dndToggle) qs._dndToggle.toggle(); 'ok';";
    sshRun(
      host,
      identity,
      user,
      ip,
      `gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "${script}"`,
    );
    return true;
  }
  return false;
};

const enrichVirshCaptures = (host, identity, user, ip, payload) => {
  if (payload.screenshotBackend !== 'host-virsh') {
    return payload;
  }
  if (host.hypervisor !== 'libvirt') {
    process.stderr.write('⚠ captureStrategy host-virsh mais hypervisor absent\n');
    return payload;
  }

  process.stderr.write('=== captures host-virsh (Shell.Screenshot refusé en SSH) ===\n');
  fs.mkdirSync(CAPTURES_BASE, { recursive: true });

  for (const inv of payload.investigations || []) {
    if (inv.status !== 'documented') continue;
    const { controlId } = inv;
    const before = inv.vmToggle?.before;
    const after = inv.vmToggle?.after;
    const transMs = inv.transitionExpected?.durationMs || 500;
    const captures = [];

    if (before && applyControlState(host, identity, user, ip, controlId, before)) {
      spawnSync('sleep', ['1']);
    }
    if (virshShot(host, `${controlId}/before.png`)) {
      captures.push({ phase: 'before', path: relCapture(controlId, 'before.png'), timestamp: new Date().toISOString() });
    }

    const appliedAfter = controlId === 'dnd'
      ? applyControlState(host, identity, user, ip, controlId, 'toggle')
      : applyControlState(host, identity, user, ip, controlId, after);
    if (appliedAfter) {
      spawnSync('sleep', [String(Math.max(transMs / 2000, 0.25))]);
      if (virshShot(host, `${controlId}/during-${Math.round(transMs / 2)}ms.png`)) {
        captures.push({
          phase: 'during-transition',
          path: relCapture(controlId, `during-${Math.round(transMs / 2)}ms.png`),
          elapsedMs: Math.round(transMs / 2),
        });
      }
      spawnSync('sleep', [String(Math.max(transMs / 2000, 0.25))]);
      if (virshShot(host, `${controlId}/after.png`)) {
        captures.push({ phase: 'after', path: relCapture(controlId, 'after.png'), elapsedMs: transMs });
      }
    }

    if (before && applyControlState(host, identity, user, ip, controlId, before)) {
      spawnSync('sleep', ['0.5']);
    }

    inv.vmCaptures = captures;
    if (captures.length) {
      inv.transitionObserved = {
        ...(inv.transitionObserved || {}),
        notes: `captures host-virsh (${host.virshName || process.env.ROCKY_VIRSH_NAME || 'Rocky10'}) — app Snapshot présente sur VM pour usage interactif`,
      };
    }
  }

  const withPng = (payload.investigations || []).some((i) => (i.vmCaptures || []).length > 0);
  payload.screenshotTool = withPng;
  payload.captureStrategy = 'host-virsh';
  return payload;
};

const remapCapturePath = (vmPath, generatedAt) => {
  if (!vmPath) return null;
  if (vmPath.startsWith('root/docs/')) {
    const abs = path.join(ROOT, vmPath);
    return fs.existsSync(abs) ? vmPath : vmPath;
  }
  const rel = path.basename(path.dirname(vmPath));
  const file = path.basename(vmPath);
  const local = path.join('root/docs/inventaires/captures/linux-rocky/gnome-settings-visual', rel, file);
  const abs = path.join(ROOT, local);
  return fs.existsSync(abs) ? local : vmPath;
};

const mergeInventory = (registryId, payload) => {
  const invPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-visual-investigation.json`);
  const base = fs.existsSync(invPath)
    ? JSON.parse(fs.readFileSync(invPath, 'utf8'))
    : { registry: registryId, investigations: [] };

  const byId = new Map((base.investigations || []).map((row) => [row.controlId, row]));
  let documented = 0;

  for (const row of payload.investigations || []) {
    if (row.status !== 'documented') continue;
    const prev = byId.get(row.controlId) || {};
    const vmCaptures = (row.vmCaptures || []).map((cap) => ({
      ...cap,
      path: remapCapturePath(cap.path, payload.generatedAt),
    }));
    const { capsuleParity: rowParity, ...rowRest } = row;
    const mergedParity = { ...(prev.capsuleParity || {}), ...(rowParity || {}) };
    if (
      prev.capsuleParity?.visualMatch
      && prev.capsuleParity.visualMatch !== 'unknown'
      && (!rowParity?.visualMatch || rowParity.visualMatch === 'unknown')
    ) {
      mergedParity.visualMatch = prev.capsuleParity.visualMatch;
      mergedParity.gapNotes = prev.capsuleParity.gapNotes ?? mergedParity.gapNotes;
      mergedParity.datasetPresent = prev.capsuleParity.datasetPresent ?? mergedParity.datasetPresent;
      mergedParity.cssHookPresent = prev.capsuleParity.cssHookPresent ?? mergedParity.cssHookPresent;
    }
    byId.set(row.controlId, {
      ...prev,
      ...rowRest,
      status: 'documented',
      vmCaptures,
      capsuleParity: mergedParity,
      generatedAt: payload.generatedAt,
      visualParityClosedAt: prev.visualParityClosedAt ?? row.visualParityClosedAt,
    });
    documented += 1;
  }

  const investigations = [...byId.values()];
  const p0Open = investigations.filter(
    (i) => i.capsuleParity?.parityPriority === 'P0' && i.status !== 'documented',
  ).length;

  const out = {
    ...base,
    generatedAt: payload.generatedAt,
    investigator: 'collect-vm-gnome-settings-visual-investigation.mjs',
    vmEnvironment: {
      ...(base.vmEnvironment || {}),
      sessionType: 'wayland',
      screenshotTool: payload.screenshotTool || payload.captureStrategy === 'host-virsh',
      screenshotBackend: payload.screenshotBackend || null,
      captureStrategy: payload.captureStrategy || null,
      snapshotAppInstalled: payload.snapshotAppInstalled ?? null,
      note: payload.captureStrategy === 'host-virsh'
        ? 'Rocky 10 : Snapshot (GUI) sur VM ; captures lab automatisées via virsh screenshot depuis l’hôte'
        : (base.vmEnvironment?.note || null),
    },
    summary: {
      investigationsTotal: investigations.length,
      documented: investigations.filter((i) => i.status === 'documented').length,
      capsuleImplemented: base.summary?.capsuleImplemented || 0,
      gaps: base.summary?.gaps || 0,
      p0Open,
    },
    investigations,
  };

  fs.writeFileSync(invPath, `${JSON.stringify(out, null, 2)}\n`);
  return invPath;
};

const main = () => {
  const opts = parseArgs();
  const onlyIds = opts.pending ? pendingControlIds(opts.id, opts.filter) : [];
  if (opts.pending && !onlyIds.length) {
    process.stderr.write(`✓ Aucun contrôle ${opts.filter} en attente — rien à collecter\n`);
    process.exit(0);
  }
  process.stderr.write(
    `=== collect-vm-gnome-settings-visual-investigation ${opts.id} filter=${opts.filter}`
    + `${onlyIds.length ? ` pending=${onlyIds.join(',')}` : ''} ===\n`,
  );

  const { payload, remoteOutDir, host, identity, user, ip } = opts.local
    ? { ...runLocal(opts.filter, onlyIds), host: null }
    : runOnVm(loadHost(opts.id), opts.filter, onlyIds);

  if (!opts.local && host) {
    if (payload.screenshotBackend === 'host-virsh') {
      enrichVirshCaptures(host, identity, user, ip, payload);
    } else if (payload.screenshotTool) {
      scpCaptures({ host, identity, user, ip, remoteOutDir });
    }
  }

  const rawPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-run.json`);
  fs.writeFileSync(rawPath, `${JSON.stringify(payload, null, 2)}\n`);

  const invPath = mergeInventory(opts.id, payload);
  process.stdout.write(`OK ${rawPath}\n`);
  process.stdout.write(`OK ${invPath}\n`);
  process.stdout.write(
    `Résumé: ${(payload.investigations || []).filter((i) => i.status === 'documented').length} enquêtes ${opts.filter} documentées, `
    + `screenshot=${payload.screenshotTool} backend=${payload.screenshotBackend || 'none'}\n`,
  );
};

main();
