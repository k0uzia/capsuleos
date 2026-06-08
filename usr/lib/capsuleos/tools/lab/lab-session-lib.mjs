/**
 * Helpers session lab (R-PWD1) — virsh/SSH sans invites répétées.
 * Prérequis : bash root/tools/lab/lab-capture-session.sh [--] <commande>
 */
import { spawnSync } from 'child_process';
import fs from 'fs';

export const labSessionActive = () => process.env.CAPSULE_LAB_SESSION === '1';

export const labVirshUri = () => process.env.CAPSULE_LAB_VIRSH_URI || 'qemu:///system';

/** Préfixe optionnel (ex. "sudo -n") défini par lab-capture-session.sh */
export const labVirshArgv = (virshArgs) => {
  const prefix = (process.env.CAPSULE_LAB_VIRSH_PREFIX || '').trim();
  if (!prefix) return ['virsh', ...virshArgs];
  return [...prefix.split(/\s+/).filter(Boolean), 'virsh', ...virshArgs];
};

export const spawnLabVirsh = (virshArgs, opts = {}) => {
  const argv = labVirshArgv(virshArgs);
  return spawnSync(argv[0], argv.slice(1), {
    encoding: 'utf8',
    timeout: 30000,
    ...opts,
  });
};

export const labVirshScreenshot = (vmName, destFile, uri = labVirshUri()) => {
  const res = spawnLabVirsh(['-c', uri, 'screenshot', vmName, '--file', destFile]);
  return res.status === 0 && fs.existsSync(destFile);
};

export const labVirshListNames = (uri = labVirshUri()) => {
  const res = spawnLabVirsh(['-c', uri, 'list', '--name']);
  if (res.status !== 0) {
    return { ok: false, error: (res.stderr || res.stdout || 'virsh injoignable').trim(), names: [] };
  }
  const names = (res.stdout || '').split('\n').map((s) => s.trim()).filter(Boolean);
  return { ok: true, names, error: null };
};

export const labSshIdentity = (host) => {
  const raw = process.env.CAPSULE_LAB_SSH_IDENTITY
    || host?.sshIdentity
    || '~/.ssh/capsuleos-lab';
  return raw.replace(/^~/, process.env.HOME || '');
};

export const labSshOpts = (identity) => [
  '-o', 'BatchMode=yes',
  '-o', 'IdentitiesOnly=yes',
  '-i', identity,
];

export const requireLabSessionHint = () => (
  'Session lab inactive — lancer une fois :\n'
  + '  bash root/tools/lab/lab-capture-session.sh -- node usr/lib/capsuleos/tools/lab/<script>.mjs ...'
);
