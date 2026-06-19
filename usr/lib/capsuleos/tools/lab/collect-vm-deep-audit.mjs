#!/usr/bin/env node
/**
 * Collecte audit VM profond — exécute les scripts lab sur la VM et écrit l'inventaire JSON.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --phase static
 *   node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --write-doc
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { runSshCommand } from './lab-ssh.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const SCRIPT_BY_TOOLKIT = {
  gnome: 'root/tools/lab/vm-gnome-deep-inventory.sh',
  cinnamon: 'root/tools/lab/vm-mint-inventory.sh',
  cosmic: 'root/tools/lab/vm-gnome-deep-inventory.sh',
};

const PHASE_SCRIPT = {
  'settings-playbook': 'root/tools/lab/vm-gnome-settings-playbook.sh',
  'settings-interaction': 'root/tools/lab/vm-gnome-settings-interaction-playbook.sh',
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', phase: 'static', writeDoc: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--phase' && args[i + 1]) opts.phase = args[++i];
    else if (args[i] === '--write-doc') opts.writeDoc = true;
  }
  return opts;
};

const loadInventory = () => {
  const invPath = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
  if (!fs.existsSync(invPath)) {
    throw new Error('etc/capsuleos/lab-inventory.json manquant');
  }
  return JSON.parse(fs.readFileSync(invPath, 'utf8'));
};

const loadHost = (registryId, inv) => {
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte inconnu: ${registryId}`);
  return host;
};

const remoteEnv = (host) => {
  const parts = [];
  if (host.toolkit === 'cosmic' || host.sessionEnvFromProcess) {
    parts.push('COSMIC_PID=$(pgrep -u $(id -u) cosmic-panel 2>/dev/null | head -1)');
    parts.push('if [ -n "$COSMIC_PID" ] && [ -r "/proc/$COSMIC_PID/environ" ]; then eval $(tr "\\0" "\\n" < /proc/$COSMIC_PID/environ | grep -E "^(XDG_|DISPLAY=|WAYLAND_DISPLAY=)" | sed "s/^/export /"); fi');
  }
  if (!parts.length) {
    parts.push(`export DISPLAY=${host.display || ':0'}`);
  } else if (host.display) {
    parts.push(`export DISPLAY=${host.display}`);
  }
  if (host.xauthorityDiscovery === 'mutter-xwayland') {
    parts.push('export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)');
  }
  return parts.join('; ');
};

const runLocalScriptOnVm = (host, scriptRel) => {
  const scriptPath = path.join(ROOT, scriptRel);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script absent: ${scriptRel}`);
  }
  const body = fs.readFileSync(scriptPath, 'utf8');
  const remoteCmd = `${remoteEnv(host)}; bash -s`;
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = process.env.CAPSULE_LAB_SSH_IDENTITY
    || (host.sshIdentity ? path.join(process.env.HOME || '', host.sshIdentity.replace(/^~\//, '')) : null)
    || path.join(process.env.HOME || '', '.ssh/capsuleos-lab');

  const res = spawnSync(
    'ssh',
    [
      '-o', 'BatchMode=yes',
      '-o', 'IdentitiesOnly=yes',
      '-i', identity,
      `${user}@${ip}`,
      remoteCmd,
    ],
    { input: body, encoding: 'utf8', timeout: 120000 },
  );
  if (res.status !== 0) {
    throw new Error(`SSH script échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const stdout = (res.stdout || '').trim();
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const mergeAudit = (registryId, phase, payload) => {
  const outPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.json`);
  let existing = { auditVersion: 1, registryId, phases: {} };
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }
  existing.registryId = registryId;
  existing.updatedAt = new Date().toISOString();
  existing.phases = existing.phases || {};
  existing.phases[phase] = payload;
  fs.writeFileSync(outPath, `${JSON.stringify(existing, null, 2)}\n`);
  return outPath;
};

const writeSummaryMd = (registryId, auditPath) => {
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const staticPhase = audit.phases?.static || {};
  const mdPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.md`);
  const lines = [
    `# Audit VM profond — ${registryId}`,
    '',
    `> Généré : ${audit.updatedAt} · JSON : [\`${path.basename(auditPath)}\`](${path.basename(auditPath)})`,
    `> Procédure : [procedure-audit-vm-profonde.md](../procedure-audit-vm-profonde.md)`,
    '',
    '## Phase static',
    '',
    '| Champ | Valeur |',
    '|-------|--------|',
    `| OS | ${staticPhase.os?.PRETTY_NAME || '—'} |`,
    `| GNOME Shell | ${staticPhase.versions?.gnomeShell || '—'} |`,
    `| Thème GTK | ${staticPhase.theme?.gtkTheme || '—'} |`,
    `| Accent | ${staticPhase.theme?.accentColor || '—'} |`,
    `| Favoris dash | ${(staticPhase.dashFavorites || []).length} |`,
    `| Familles polices | ${staticPhase.fonts?.totalFamilies ?? '—'} |`,
    `| Schémas raccourcis | ${Object.keys(staticPhase.keybindings || {}).length} |`,
    '',
    '## Phases restantes',
    '',
    ...((staticPhase.nextPhases || ['interaction-matrix', 'context-menus', 'animations', 'workspace-gestures'])
      .map((p) => `- [ ] ${p}`)),
    '',
  ];
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  return mdPath;
};

const main = () => {
  const opts = parseArgs();
  const inv = loadInventory();
  const host = loadHost(opts.id, inv);
  const toolkit = host.toolkit || 'gnome';
  const scriptRel = PHASE_SCRIPT[opts.phase] || SCRIPT_BY_TOOLKIT[toolkit];
  if (!scriptRel) {
    throw new Error(`Phase/toolkit non supporté: ${opts.phase} / ${toolkit}`);
  }

  process.stderr.write(`=== collect-vm-deep-audit ${opts.id} phase=${opts.phase} ===\n`);
  let payload;
  if (opts.phase === 'settings-playbook' || opts.phase === 'settings-interaction') {
    const matrixB64 = Buffer.from(
      fs.readFileSync(path.join(ROOT, 'root/tools/lab/gnome-settings-parity-matrix.json'), 'utf8'),
    ).toString('base64');
    const playbookBody = fs.readFileSync(path.join(ROOT, scriptRel), 'utf8');
    const dwell = opts.phase === 'settings-interaction'
      ? (process.env.CAPSULE_SETTINGS_DWELL_MS || '900')
      : (process.env.CAPSULE_SETTINGS_DWELL_MS || '1400');
    const monitor = opts.phase === 'settings-interaction'
      ? `export CAPSULE_SETTINGS_MONITOR_MS=${process.env.CAPSULE_SETTINGS_MONITOR_MS || '1200'}`
      : '';
    const remoteScript = `
${remoteEnv(host)}
MATRIX_FILE=$(mktemp /tmp/capsule-settings-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
export CAPSULE_SETTINGS_MATRIX="$MATRIX_FILE"
export CAPSULE_SETTINGS_DWELL_MS=${dwell}
${monitor}
bash -s <<'PLAYBOOK_EOF'
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
      { input: remoteScript, encoding: 'utf8', timeout: 600000 },
    );
    if (res.status !== 0) {
      throw new Error(`SSH settings-playbook échec: ${(res.stderr || res.stdout || '').trim()}`);
    }
    const stdout = (res.stdout || '').trim();
    const jsonStart = stdout.indexOf('{');
    if (jsonStart < 0) throw new Error('Sortie JSON playbook introuvable');
    payload = JSON.parse(stdout.slice(jsonStart));
    const outName = opts.phase === 'settings-interaction'
      ? `${opts.id}-gnome-settings-interaction.json`
      : `${opts.id}-gnome-settings-playbook.json`;
    const outPlaybook = path.join(ROOT, 'root/docs/inventaires', outName);
    fs.writeFileSync(outPlaybook, `${JSON.stringify(payload, null, 2)}\n`);
    process.stdout.write(`OK ${outPlaybook}\n`);
  } else {
    payload = runLocalScriptOnVm(host, scriptRel);
  }
  const outPath = mergeAudit(opts.id, opts.phase, payload);
  process.stdout.write(`OK ${outPath}\n`);

  if (opts.writeDoc) {
    const mdPath = writeSummaryMd(opts.id, outPath);
    process.stdout.write(`OK ${mdPath}\n`);
  }
};

main();
