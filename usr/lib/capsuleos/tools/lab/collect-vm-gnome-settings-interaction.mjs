#!/usr/bin/env node
/**
 * Collecte playbook interaction Paramètres GNOME (bascule + gsettings monitor).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-interaction.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-interaction.mjs --local
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const PLAYBOOK = path.join(ROOT, 'root/tools/lab/vm-gnome-settings-interaction-playbook.sh');
const MATRIX = path.join(ROOT, 'root/tools/lab/gnome-settings-parity-matrix.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', panel: '', local: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--panel' && args[i + 1]) opts.panel = args[++i];
    else if (args[i] === '--local') opts.local = true;
  }
  return opts;
};

const loadHost = (registryId) => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const remoteEnv = (host) => [
  `export DISPLAY=${host.display || ':0'}`,
  'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
  'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
  'export XDG_CURRENT_DESKTOP=GNOME',
  'export GNOME_SHELL_SESSION_MODE=default',
  'export DESKTOP_SESSION=gnome',
  host.xauthorityDiscovery === 'mutter-xwayland'
    ? 'export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)'
    : '',
].filter(Boolean).join('; ');

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const runLocal = (panel) => {
  const env = {
    ...process.env,
    CAPSULE_SETTINGS_MATRIX: MATRIX,
    CAPSULE_SETTINGS_DWELL_MS: process.env.CAPSULE_SETTINGS_DWELL_MS || '600',
    CAPSULE_SETTINGS_MONITOR_MS: process.env.CAPSULE_SETTINGS_MONITOR_MS || '800',
  };
  const args = panel ? ['--panel', panel] : [];
  const res = spawnSync('bash', [PLAYBOOK, ...args], { encoding: 'utf8', env, timeout: 600000 });
  if (res.status !== 0) {
    throw new Error(`Playbook local échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const runOnVm = (host, panel) => {
  const matrixB64 = Buffer.from(fs.readFileSync(MATRIX, 'utf8')).toString('base64');
  const playbookBody = fs.readFileSync(PLAYBOOK, 'utf8');
  const panelArg = panel ? ` --panel ${panel}` : '';
  const remoteScript = `
${remoteEnv(host)}
MATRIX_FILE=$(mktemp /tmp/capsule-settings-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
export CAPSULE_SETTINGS_MATRIX="$MATRIX_FILE"
export CAPSULE_SETTINGS_DWELL_MS=${process.env.CAPSULE_SETTINGS_DWELL_MS || '900'}
export CAPSULE_SETTINGS_MONITOR_MS=${process.env.CAPSULE_SETTINGS_MONITOR_MS || '1200'}
bash -s${panelArg} <<'PLAYBOOK_EOF'
${playbookBody}
PLAYBOOK_EOF
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
    { input: remoteScript, encoding: 'utf8', timeout: 900000 },
  );
  if (res.status !== 0) {
    throw new Error(`SSH interaction playbook échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const writeOutputs = (registryId, payload) => {
  const jsonPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-interaction.json`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  const mdPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-interaction.md`);
  const lines = [
    `# Interactions Paramètres GNOME — ${registryId}`,
    '',
    `> Généré : ${payload.generatedAt}`,
    '',
    '## Résumé',
    '',
    '| Statut | Nombre |',
    '|--------|--------|',
    `| OK | ${payload.summary?.ok ?? 0} |`,
    `| Partiel | ${payload.summary?.partial ?? 0} |`,
    `| Échec | ${payload.summary?.failed ?? 0} |`,
    `| Ignoré | ${payload.summary?.skipped ?? 0} |`,
    '',
    '## Détail par panneau',
    '',
    '| Panneau | Contrôle | Statut | Monitor | Restauré |',
    '|---------|----------|--------|---------|----------|',
  ];
  for (const panel of payload.panels || []) {
    for (const it of panel.interactions || []) {
      lines.push(
        `| ${panel.label || panel.id} | ${it.controlId} | ${it.status} | ${it.monitorEvent ? 'oui' : (it.monitorEvent === false ? 'non' : '—')} | ${it.restoredOk === false ? 'non' : (it.restoredOk ? 'oui' : '—')} |`,
      );
    }
  }
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  return { jsonPath, mdPath };
};

const main = () => {
  const opts = parseArgs();
  process.stderr.write(`=== collect-vm-gnome-settings-interaction ${opts.id} ===\n`);
  const payload = opts.local ? runLocal(opts.panel) : runOnVm(loadHost(opts.id), opts.panel);
  const paths = writeOutputs(opts.id, payload);
  process.stdout.write(`OK ${paths.jsonPath}\n`);
  process.stdout.write(`OK ${paths.mdPath}\n`);
  const s = payload.summary || {};
  process.stdout.write(`Résumé: ok=${s.ok || 0} partial=${s.partial || 0} failed=${s.failed || 0} skipped=${s.skipped || 0}\n`);
  if ((s.failed || 0) > 0) {
    process.stderr.write(`Attention: ${s.failed} interaction(s) en échec\n`);
  }
};

main();
