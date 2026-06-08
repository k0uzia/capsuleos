#!/usr/bin/env node
/**
 * Passe visuelle autonome VM ↔ Capsule — captures PNG + journal événements JSON.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-fedora --skip-vm
 *   node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-rocky --vm-only
 *
 * Skill agent : root/skills/visual-parity-lab/SKILL.md
 */
import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { labVirshListNames } from './lab-session-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const MANIFEST = path.join(ROOT, 'root/tools/lab/visual-parity-manifest.json');
const REMOTE_CAPTURE = path.join(ROOT, 'root/tools/lab/vm-gnome-visual-capture-remote.sh');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-ubuntu',
    skipVm: false,
    skipCapsule: false,
    skipCompare: false,
    vmOnly: false,
    capsuleOnly: false,
    httpBase: (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, ''),
    forceRemoteVm: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--skip-vm') opts.skipVm = true;
    else if (a === '--skip-capsule') opts.skipCapsule = true;
    else if (a === '--skip-compare') opts.skipCompare = true;
    else if (a === '--vm-only') opts.vmOnly = true;
    else if (a === '--capsule-only') opts.capsuleOnly = true;
    else if (a === '--http-base' && args[i + 1]) opts.httpBase = args[++i].replace(/\/$/, '');
    else if (a === '--force-remote-vm') opts.forceRemoteVm = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(`Usage: node run-visual-parity-pass.mjs --id <registryId> [--skip-vm] [--skip-capsule] [--force-remote-vm]\n`);
      process.exit(0);
    }
  }
  if (opts.vmOnly) {
    opts.skipCapsule = true;
    opts.skipCompare = true;
  }
  if (opts.capsuleOnly) {
    opts.skipVm = true;
  }
  return opts;
};

const loadJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) {
    throw new Error('etc/capsuleos/lab-inventory.json manquant — copier lab-inventory.example.json');
  }
  const host = (loadJson(INVENTORY).hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu dans lab-inventory: ${registryId}`);
  return host;
};

const loadEntry = (registryId) => {
  const manifest = loadJson(MANIFEST);
  const entry = manifest.entries?.[registryId];
  if (!entry) throw new Error(`Entrée absente dans visual-parity-manifest: ${registryId}`);
  return entry;
};

const sshIdentity = (host) => {
  const raw = process.env.CAPSULE_LAB_SSH_IDENTITY || host.sshIdentity || '~/.ssh/capsuleos-lab';
  return raw.replace(/^~/, process.env.HOME || '');
};

const sshTarget = (host) => {
  const at = host.ssh.indexOf('@');
  return { user: host.ssh.slice(0, at), ip: host.ssh.slice(at + 1) };
};

const portOpen = (port, host = '127.0.0.1') => new Promise((resolve) => {
  const sock = net.createConnection({ port, host }, () => {
    sock.end();
    resolve(true);
  });
  sock.on('error', () => resolve(false));
  sock.setTimeout(1500, () => {
    sock.destroy();
    resolve(false);
  });
});

const ensureHttpServer = async (httpBase) => {
  const url = new URL(httpBase);
  const port = Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
  const host = url.hostname || '127.0.0.1';
  if (await portOpen(port, host)) {
    return { ok: true, started: false, url: httpBase };
  }
  if (host !== '127.0.0.1' && host !== 'localhost') {
    return { ok: false, error: `Port ${port} fermé sur ${host}` };
  }
  process.stderr.write(`=== Démarrage serveur HTTP :${port} ===\n`);
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  for (let i = 0; i < 12; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    if (await portOpen(port, '127.0.0.1')) {
      return { ok: true, started: true, url: httpBase, pid: child.pid };
    }
  }
  return { ok: false, error: `Impossible d'ouvrir le port ${port}` };
};

const runCmd = (cmd, args, env = {}) => {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 600000,
  });
  return {
    ok: res.status === 0,
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
};

const countPng = (dir) => {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.png')) n += 1;
    }
  };
  walk(dir);
  return n;
};

const clearPng = (dir) => {
  if (!fs.existsSync(dir)) return;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.png')) fs.unlinkSync(p);
    }
  };
  walk(dir);
};

const remotePngCount = (stdout) => {
  const m = (stdout || '').match(/Terminé\s*:\s*(\d+)\s*PNG/i);
  return m ? Number(m[1]) : null;
};

const vmCaptureOk = (result) => {
  if (result.events?.some((e) => e.ok)) return true;
  const remote = remotePngCount(result.stdout);
  if (remote !== null) return remote > 0;
  return result.method === 'virsh-host' && result.ok && result.pngCount > 0;
};

const tryVirsh = (virshName) => {
  const listed = labVirshListNames();
  if (!listed.ok) return { ok: false, error: listed.error };
  if (!listed.names.includes(virshName)) {
    return { ok: false, error: `domaine « ${virshName} » absent (${listed.names.join(', ') || 'aucun'})` };
  }
  return { ok: true, domains: listed.names };
};

const runVmHostCapture = (entry) => {
  const script = path.join(ROOT, entry.vmCaptureHost);
  const dest = path.join(ROOT, entry.inventoryVm);
  fs.mkdirSync(dest, { recursive: true });
  clearPng(dest);
  const res = runCmd('bash', [script, dest]);
  return {
    method: 'virsh-host',
    script: entry.vmCaptureHost,
    ...res,
    pngCount: countPng(dest),
  };
};

const runVmRemoteCapture = (host, entry) => {
  const { user, ip } = sshTarget(host);
  const identity = sshIdentity(host);
  const dest = path.join(ROOT, entry.inventoryVm);
  const remoteOut = '/tmp/capsule-visual-parity';
  const prefix = entry.prefix;
  fs.mkdirSync(dest, { recursive: true });
  clearPng(dest);

  spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`,
      `rm -rf ${remoteOut} && mkdir -p ${remoteOut}/audit`],
    { encoding: 'utf8', timeout: 30000 },
  );

  const body = fs.readFileSync(REMOTE_CAPTURE, 'utf8');
  const remoteCmd = `VISUAL_PREFIX=${prefix} VISUAL_OUT=${remoteOut} bash -s`;

  const sshRes = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, remoteCmd],
    { input: body, encoding: 'utf8', timeout: 300000 },
  );

  const scpRes = spawnSync(
    'scp',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, '-r',
      `${user}@${ip}:${remoteOut}/.`, `${dest}/`],
    { encoding: 'utf8', timeout: 120000 },
  );

  const events = [];
  const eventsFile = path.join(dest, 'events.jsonl');
  if (fs.existsSync(eventsFile)) {
    for (const line of fs.readFileSync(eventsFile, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line)); } catch (_) { /* skip */ }
    }
  }

  const pngCount = countPng(dest);
  const result = {
    method: 'ssh-screenshot',
    script: 'root/tools/lab/vm-gnome-visual-capture-remote.sh',
    sshStatus: sshRes.status,
    scpStatus: scpRes.status,
    stdout: sshRes.stdout || '',
    stderr: (sshRes.stderr || '') + (scpRes.stderr || ''),
    pngCount,
    events,
  };
  result.ok = vmCaptureOk(result);
  return result;
};

const parseCapsuleEvents = (stdout) => {
  const events = [];
  for (const line of (stdout || '').split('\n')) {
    const m = line.match(/→\s+(.+\.png)\s+\((\d+)\s+octets\)/);
    if (m) {
      events.push({
        phase: 'capsule',
        file: path.basename(m[1]),
        bytes: Number(m[2]),
        ok: true,
        timestamp: new Date().toISOString(),
      });
    }
  }
  return events;
};

const runCapsuleCapture = (entry, httpBase, host) => {
  const script = path.join(ROOT, entry.capsuleCapture);
  const dest = path.join(ROOT, entry.inventoryCapsule);
  const vendor = entry.vendor.toUpperCase();
  const env = {
    CAPSULE_HTTP_BASE: httpBase,
    [`CAPSULE_${vendor}_URL`]: host?.capsuleUrl || `${httpBase}/home/`,
  };
  const res = runCmd('node', [script, dest], env);
  return {
    script: entry.capsuleCapture,
    ...res,
    pngCount: countPng(dest),
    events: parseCapsuleEvents(res.stdout),
  };
};

const runCompare = (entry) => {
  const script = path.join(ROOT, entry.compare);
  const res = runCmd('node', [script]);
  let pairs = null;
  const report = path.join(ROOT, entry.compareReport);
  if (fs.existsSync(report)) {
    const m = fs.readFileSync(report, 'utf8').match(/\*\*(\d+)\/(\d+)\*\*/);
    if (m) pairs = { complete: Number(m[1]), total: Number(m[2]) };
  }
  return { script: entry.compare, ...res, pairs, report: entry.compareReport };
};

const sshPing = (host) => {
  const { user, ip } = sshTarget(host);
  const identity = sshIdentity(host);
  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'echo SSH_OK'],
    { encoding: 'utf8', timeout: 20000 },
  );
  return res.status === 0;
};

const main = async () => {
  const opts = parseArgs();
  const entry = loadEntry(opts.id);
  const host = loadHost(opts.id);
  const journal = {
    registryId: opts.id,
    generatedAt: new Date().toISOString(),
    httpBase: opts.httpBase,
    phases: {},
  };

  process.stderr.write(`=== Passe visuelle ${opts.id} ===\n`);

  if (!opts.skipCapsule) {
    journal.phases.http = await ensureHttpServer(opts.httpBase);
    if (!journal.phases.http.ok) {
      process.stderr.write(`✗ HTTP: ${journal.phases.http.error}\n`);
      process.exit(1);
    }
  }

  if (!opts.skipVm) {
    journal.phases.precheck = {
      ssh: sshPing(host),
      virshName: host.virshName || null,
      virsh: host.virshName ? tryVirsh(host.virshName) : { ok: false, error: 'virshName absent' },
    };

    let vmResult;
    if (!opts.forceRemoteVm && journal.phases.precheck.virsh.ok) {
      vmResult = runVmHostCapture(entry);
      if (!vmResult.ok || vmResult.pngCount === 0) {
        process.stderr.write('  ⚠ virsh-host échec ou 0 PNG — repli SSH screenshot\n');
        vmResult = runVmRemoteCapture(host, entry);
      }
    } else {
      process.stderr.write(`  → capture VM via SSH (${opts.forceRemoteVm ? 'forcé' : 'virsh indisponible'})\n`);
      vmResult = runVmRemoteCapture(host, entry);
    }
    journal.phases.vm = { ...vmResult, ok: vmCaptureOk(vmResult) };
    process.stderr.write(`  VM : ${vmResult.method} — ${vmResult.pngCount} PNG (${journal.phases.vm.ok ? 'OK' : 'échec'})\n`);
    if (!journal.phases.vm.ok) {
      process.stderr.write('  ⚠ VM : D-Bus screenshot SSH souvent bloqué — privilégier virsh (domaine allumé, session GNOME active)\n');
      if (!opts.skipCompare) {
        process.stderr.write('  ⚠ Compare poursuivi avec PNG VM existants (si présents)\n');
      }
    }
  }

  if (!opts.skipCapsule) {
    const cap = runCapsuleCapture(entry, opts.httpBase, host);
    journal.phases.capsule = cap;
    process.stderr.write(`  Capsule : ${cap.pngCount} PNG (${cap.ok ? 'OK' : 'échec'})\n`);
    if (!cap.ok) process.exit(1);
  }

  if (!opts.skipCompare && !opts.vmOnly) {
    const cmp = runCompare(entry);
    journal.phases.compare = cmp;
    const p = cmp.pairs;
    process.stderr.write(`  Compare : ${p ? `${p.complete}/${p.total}` : (cmp.ok ? 'OK' : 'incomplet')}\n`);
    journal.summary = {
      vmPng: journal.phases.vm?.pngCount ?? null,
      capsulePng: journal.phases.capsule?.pngCount ?? null,
      pairs: cmp.pairs,
      success: cmp.ok && (journal.phases.vm?.pngCount > 0 || opts.skipVm),
    };

    const out = path.join(ROOT, entry.eventsOut);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `${JSON.stringify(journal, null, 2)}\n`);
    process.stdout.write(`OK journal → ${entry.eventsOut}\n`);

    if (!cmp.ok) process.exit(1);
    return;
  }

  const out = path.join(ROOT, entry.eventsOut);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(journal, null, 2)}\n`);
  process.stdout.write(`OK journal → ${entry.eventsOut}\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
