#!/usr/bin/env node
/**
 * Collecte playbook interaction kconfig Paramètres KDE (VM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-interaction.mjs --id linux-kde-neon --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadHost } from './lab-ssh.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const PLAYBOOK = path.join(ROOT, 'root/tools/lab/vm-kde-settings-interaction-playbook.sh');
const REGISTRY = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');

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

const runOnVm = (host) => {
  const regB64 = Buffer.from(fs.readFileSync(REGISTRY, 'utf8')).toString('base64');
  const body = fs.readFileSync(PLAYBOOK, 'utf8');
  const remoteScript = `
${remoteEnv(host)}
REG_FILE=$(mktemp /tmp/capsule-kde-registry.XXXXXX.json)
echo '${regB64}' | base64 -d > "$REG_FILE"
export CAPSULE_KDE_REGISTRY="$REG_FILE"
bash -s <<'PLAYBOOK_EOF'
${body}
PLAYBOOK_EOF
rm -f "$REG_FILE"
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
    throw new Error(`SSH interaction KDE échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const main = () => {
  const opts = parseArgs();
  const payload = opts.local
    ? parseJsonStdout(spawnSync('bash', [PLAYBOOK], {
      encoding: 'utf8',
      cwd: ROOT,
      env: { ...process.env, CAPSULE_KDE_REGISTRY: REGISTRY },
    }).stdout || '')
    : runOnVm(loadHost(opts.id));

  payload.registryId = opts.id;
  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-kde-settings-interaction.json`);

  if (opts.write) {
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
    const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
    for (const row of payload.interactions || []) {
      for (const panel of reg.panels || []) {
        for (const ctrl of panel.controls || []) {
          if (ctrl.id === row.controlId && row.vmValue) {
            ctrl.vmValue = row.vmValue;
          }
        }
      }
    }
    reg.interactionCollectedAt = payload.generatedAt;
    fs.writeFileSync(REGISTRY, `${JSON.stringify(reg, null, 2)}\n`);
    console.log(`✓ ${path.relative(ROOT, outPath)} — ${payload.interactionCount} interactions`);
  } else {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  }
};

main();
