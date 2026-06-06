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
  const opts = { id: 'linux-rocky', filter: 'P0', local: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--local') opts.local = true;
  }
  return opts;
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

const runLocal = (filter) => {
  const outDir = `/tmp/capsuleos-visual-${Date.now()}`;
  const res = spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CAPSULE_VISUAL_MATRIX: MATRIX,
      CAPSULE_VISUAL_OUT: outDir,
      CAPSULE_VISUAL_FILTER: filter,
    },
    timeout: 300000,
  });
  if (res.status !== 0) {
    throw new Error(`Enquête locale échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return { payload: parseJsonStdout(res.stdout || ''), remoteOutDir: outDir };
};

const runOnVm = (host, filter) => {
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

const remapCapturePath = (vmPath, generatedAt) => {
  if (!vmPath) return null;
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
    byId.set(row.controlId, {
      ...prev,
      ...row,
      status: 'documented',
      vmCaptures,
      generatedAt: payload.generatedAt,
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
      screenshotTool: payload.screenshotTool,
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
  process.stderr.write(`=== collect-vm-gnome-settings-visual-investigation ${opts.id} filter=${opts.filter} ===\n`);

  const { payload, remoteOutDir, host, identity, user, ip } = opts.local
    ? { ...runLocal(opts.filter), host: null }
    : runOnVm(loadHost(opts.id), opts.filter);

  if (!opts.local && host) {
    scpCaptures({ host, identity, user, ip, remoteOutDir });
  }

  const rawPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-run.json`);
  fs.writeFileSync(rawPath, `${JSON.stringify(payload, null, 2)}\n`);

  const invPath = mergeInventory(opts.id, payload);
  process.stdout.write(`OK ${rawPath}\n`);
  process.stdout.write(`OK ${invPath}\n`);
  process.stdout.write(
    `Résumé: ${(payload.investigations || []).filter((i) => i.status === 'documented').length} enquêtes P0 documentées, `
    + `screenshot=${payload.screenshotTool}\n`,
  );
};

main();
