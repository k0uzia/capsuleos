#!/usr/bin/env node
/**
 * SSH lab — identité configurable + test rapide.
 * Usage: node usr/lib/capsuleos/tools/lab/lab-ssh.mjs [--host-entry from inventory via --id]
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');

const expandHome = (p) => {
  if (!p || p[0] !== '~') return p;
  const home = process.env.HOME || '';
  return path.join(home, p.slice(2));
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', cmd: 'whoami' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--cmd' && args[i + 1]) opts.cmd = args[++i];
  }
  return opts;
};

export const loadHost = (registryId) => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const identitiesFor = (host) => {
  const list = [];
  const envId = process.env.CAPSULE_LAB_SSH_IDENTITY;
  if (envId) list.push(expandHome(envId));
  if (host.sshIdentity) list.push(expandHome(host.sshIdentity));
  const fallbacks = host.sshIdentitiesFallback || ['~/.ssh/id_ed25519', '~/.ssh/id_rsa'];
  fallbacks.forEach((p) => list.push(expandHome(p)));
  const seen = {};
  return list.filter((p) => {
    if (!p || seen[p] || !fs.existsSync(p)) return false;
    seen[p] = true;
    return true;
  });
};

const sshBaseArgs = (host, identity) => {
  const args = [
    '-o', 'BatchMode=yes',
    '-o', 'IdentitiesOnly=yes',
    '-o', 'IdentityAgent=none',
    '-i', identity,
  ];
  if (host.sshJumpHost) {
    args.push('-o', `ProxyJump=${host.sshJumpHost}`);
  }
  return args;
};

export const runSshCommand = (host, remoteCmd, options) => {
  const opts = options || {};
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const ids = opts.identities || identitiesFor(host);
  let lastErr = '';
  for (let i = 0; i < ids.length; i += 1) {
    const identity = ids[i];
    const res = spawnSync(
      'ssh',
      [
        ...sshBaseArgs(host, identity),
        `${user}@${ip}`,
        remoteCmd,
      ],
      { encoding: 'utf8', timeout: opts.timeoutMs || 60000 },
    );
    if (res.status === 0) {
      return { stdout: (res.stdout || '').trim(), identity };
    }
    lastErr = (res.stderr || res.stdout || '').trim();
  }
  throw new Error(`SSH échec (${user}@${ip}): ${lastErr}`);
};

const main = () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const result = runSshCommand(host, opts.cmd);
  process.stdout.write(`${result.stdout}\n(identity: ${result.identity})\n`);
};

if (process.argv[1] && process.argv[1].endsWith('lab-ssh.mjs')) {
  main();
}
