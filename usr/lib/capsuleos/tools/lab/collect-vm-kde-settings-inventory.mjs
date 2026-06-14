#!/usr/bin/env node
/**
 * Collecte inventaire front Paramètres KDE Plasma (VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write
 *   node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --local --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadHost } from './lab-ssh.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const PLAYBOOK = path.join(ROOT, 'root/tools/lab/vm-kde-settings-inventory.sh');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon', write: false, local: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--local') opts.local = true;
  }
  return opts;
};

const remoteEnv = (host) => [
  `export DISPLAY=${host.display || ':1'}`,
  'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
  'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
  host.xauthorityDiscovery === 'plasma-xauth'
    ? 'export XAUTHORITY=$(ls /run/user/$(id -u)/xauth_* 2>/dev/null | head -1)'
    : '',
].filter(Boolean).join('; ');

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const runLocal = (registryId) => {
  const res = spawnSync('bash', [PLAYBOOK], {
    encoding: 'utf8',
    cwd: ROOT,
    env: { ...process.env, CAPSULE_REGISTRY_ID: registryId },
    timeout: 120000,
  });
  if (res.status !== 0) {
    throw new Error(`Inventaire local échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const runOnVm = (host, registryId) => {
  const body = fs.readFileSync(PLAYBOOK, 'utf8');
  const remoteScript = `
${remoteEnv(host)}
export CAPSULE_REGISTRY_ID=${registryId}
bash -s <<'PLAYBOOK_EOF'
${body}
PLAYBOOK_EOF
`;
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = process.env.CAPSULE_LAB_SSH_IDENTITY
    || path.join(process.env.HOME || '', (host.sshIdentity || '~/.ssh/capsuleos-lab').replace(/^~\//, ''));
  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: remoteScript, encoding: 'utf8', timeout: 180000 },
  );
  if (res.status !== 0) {
    throw new Error(`SSH inventaire KDE échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const main = () => {
  const opts = parseArgs();
  const payload = opts.local
    ? runLocal(opts.id)
    : runOnVm(loadHost(opts.id), opts.id);

  payload.registryId = opts.id;
  payload.collectedAt = new Date().toISOString();
  const vmCount = payload.moduleCount || 0;
  const p0 = payload.p0Count || 0;
  payload.predicates = {
    KdF: vmCount >= 80,
    coveragePct: vmCount > 0 ? Math.round((vmCount / vmCount) * 100) : 0,
    p0Documented: p0,
  };

  const outInv = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-kde-settings-front-inventory.json`);
  const outRegistry = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');

  if (opts.write) {
    fs.writeFileSync(outInv, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`✓ ${path.relative(ROOT, outInv)} — ${vmCount} modules, P0=${p0}`);
  } else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  if (fs.existsSync(outRegistry)) {
    const reg = JSON.parse(fs.readFileSync(outRegistry, 'utf8'));
    reg.vmInventory = {
      source: path.relative(ROOT, outInv),
      moduleCount: vmCount,
      collectedAt: payload.collectedAt,
    };
    reg.hubCategories = payload.hubCategories;
    fs.writeFileSync(outRegistry, `${JSON.stringify(reg, null, 2)}\n`);
    console.log(`✓ ${path.relative(ROOT, outRegistry)} — hubCategories fusionnées`);
  }
};

main();
