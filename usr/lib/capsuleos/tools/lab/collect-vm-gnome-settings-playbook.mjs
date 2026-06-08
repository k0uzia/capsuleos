#!/usr/bin/env node
/**
 * Collecte playbook Paramètres GNOME sur la VM — tour interactif gnome-control-center + gsettings.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-rocky --panel wifi
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-rocky --local
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadRegistryEntry } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const PLAYBOOK = path.join(ROOT, 'root/tools/lab/vm-gnome-settings-playbook.sh');

const resolveParityMatrix = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const vendor = entry.vendor || registryId.replace(/^linux-/, '');
  const vendorMatrix = path.join(ROOT, 'root/tools/lab', `gnome-settings-parity-matrix-${vendor}.json`);
  if (fs.existsSync(vendorMatrix)) return vendorMatrix;
  return path.join(ROOT, 'root/tools/lab/gnome-settings-parity-matrix.json');
};

const resolveAssetsMatrix = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const vendor = entry.vendor || registryId.replace(/^linux-/, '');
  const vendorMatrix = path.join(ROOT, 'root/tools/lab', `gnome-settings-assets-matrix-${vendor}.json`);
  if (fs.existsSync(vendorMatrix)) return vendorMatrix;
  return path.join(ROOT, 'root/tools/lab/gnome-settings-assets-matrix.json');
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', panel: '', local: false, writeDoc: true };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--panel' && args[i + 1]) opts.panel = args[++i];
    else if (args[i] === '--local') opts.local = true;
    else if (args[i] === '--no-doc') opts.writeDoc = false;
  }
  return opts;
};

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) {
    throw new Error('etc/capsuleos/lab-inventory.json manquant');
  }
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
    'export DESKTOP_SESSION=gnome',
  ];
  if (host.xauthorityDiscovery === 'mutter-xwayland') {
    parts.push('export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)');
  }
  return parts.join('; ');
};

const runLocal = (registryId, panel) => {
  const matrixPath = resolveParityMatrix(registryId);
  const assetsPath = resolveAssetsMatrix(registryId);
  const env = {
    ...process.env,
    CAPSULE_SETTINGS_MATRIX: matrixPath,
    CAPSULE_SETTINGS_ASSETS_MATRIX: assetsPath,
    CAPSULE_SETTINGS_DWELL_MS: process.env.CAPSULE_SETTINGS_DWELL_MS || '800',
  };
  const args = panel ? ['--panel', panel] : [];
  const res = spawnSync('bash', [PLAYBOOK, ...args], { encoding: 'utf8', env, timeout: 300000 });
  if (res.status !== 0) {
    throw new Error(`Playbook local échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const runOnVm = (host, registryId, panel) => {
  const matrixPath = resolveParityMatrix(registryId);
  const assetsPath = resolveAssetsMatrix(registryId);
  if (!fs.existsSync(PLAYBOOK)) throw new Error(`Script absent: ${PLAYBOOK}`);
  if (!fs.existsSync(matrixPath)) throw new Error(`Matrice absente: ${matrixPath}`);

  const matrixB64 = Buffer.from(fs.readFileSync(matrixPath, 'utf8')).toString('base64');
  const assetsB64 = Buffer.from(fs.readFileSync(assetsPath, 'utf8')).toString('base64');
  const playbookBody = fs.readFileSync(PLAYBOOK, 'utf8');
  const panelArg = panel ? ` --panel ${panel}` : '';

  const remoteScript = `
${remoteEnv(host)}
export PATH=\$HOME/.local/bin:\$PATH
MATRIX_FILE=$(mktemp /tmp/capsule-settings-matrix.XXXXXX.json)
ASSETS_FILE=$(mktemp /tmp/capsule-assets-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
echo '${assetsB64}' | base64 -d > "$ASSETS_FILE"
export CAPSULE_SETTINGS_MATRIX="$MATRIX_FILE"
export CAPSULE_SETTINGS_ASSETS_MATRIX="$ASSETS_FILE"
export CAPSULE_SETTINGS_DWELL_MS=${process.env.CAPSULE_SETTINGS_DWELL_MS || '1400'}
bash -s${panelArg} <<'PLAYBOOK_EOF'
${playbookBody}
PLAYBOOK_EOF
rm -f "$MATRIX_FILE" "$ASSETS_FILE"
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
    throw new Error(`SSH playbook échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const writeOutputs = (registryId, payload) => {
  const jsonPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-playbook.json`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  const mdPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-playbook.md`);
  const lines = [
    `# Playbook Paramètres GNOME — ${registryId}`,
    '',
    `> Généré : ${payload.generatedAt}`,
    `> Script : [\`vm-gnome-settings-playbook.sh\`](../../tools/lab/vm-gnome-settings-playbook.sh)`,
    '',
    '## Résumé',
    '',
    '| Métrique | Valeur |',
    '|----------|--------|',
    `| Panneaux parcourus | ${payload.summary?.panelsTotal ?? '—'} |`,
    `| Panneaux ouverts (gcc) | ${payload.summary?.panelsOpened ?? '—'} |`,
    `| Contrôles mappés gsettings | ${payload.summary?.controlsMapped ?? '—'} |`,
    `| Contrôles simulés / non mappés | ${payload.summary?.controlsUnmapped ?? '—'} |`,
    '',
    '## Panneaux',
    '',
    '| Panneau | gcc | Fenêtre | gsettings stable | Contrôles mappés |',
    '|---------|-----|---------|------------------|------------------|',
  ];

  for (const panel of payload.panels || []) {
    const mapped = (panel.controls || []).filter((c) => c.status === 'mapped').length;
    const total = (panel.controls || []).length;
    lines.push(
      `| ${panel.label || panel.id} | ${panel.gccArgvLaunched || '—'} | ${panel.windowDetected ? 'oui' : 'non'} | ${panel.gsettingsStable ? 'oui' : 'non'} | ${mapped}/${total} |`,
    );
  }

  lines.push('', '## Détail gsettings ↔ CapsuleOS', '');
  for (const panel of payload.panels || []) {
    const mappedControls = (panel.controls || []).filter((c) => c.status === 'mapped');
    if (!mappedControls.length) continue;
    lines.push(`### ${panel.label || panel.id}`, '');
    lines.push('| Contrôle | VM (gsettings) | Capsule attendu |');
    lines.push('|----------|----------------|-----------------|');
    for (const ctrl of mappedControls) {
      const raw = String(ctrl.vmRaw || '').replace(/\|/g, '\\|').slice(0, 80);
      lines.push(`| ${ctrl.id} | \`${raw}\` | \`${ctrl.capsuleExpected}\` |`);
    }
    lines.push('');
  }

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
  return { jsonPath, mdPath };
};

const main = () => {
  const opts = parseArgs();
  const matrixPath = resolveParityMatrix(opts.id);
  process.stderr.write(
    `=== collect-vm-gnome-settings-playbook ${opts.id}${opts.panel ? ` panel=${opts.panel}` : ''} ===\n`
    + `Matrice : ${path.relative(ROOT, matrixPath)}\n`,
  );

  const payload = opts.local
    ? runLocal(opts.id, opts.panel)
    : runOnVm(loadHost(opts.id), opts.id, opts.panel);

  if (payload.error) {
    throw new Error(payload.error);
  }

  const paths = writeOutputs(opts.id, payload);
  process.stdout.write(`OK ${paths.jsonPath}\n`);
  if (opts.writeDoc) {
    process.stdout.write(`OK ${paths.mdPath}\n`);
  }
  const driftRes = spawnSync(
    process.execPath,
    [path.join(ROOT, 'usr/lib/capsuleos/tools/lab/compare-vm-parity-defaults.mjs'), '--registry', opts.id],
    { encoding: 'utf8', cwd: ROOT },
  );
  if (driftRes.stdout) process.stdout.write(driftRes.stdout);
  if (driftRes.stderr) process.stderr.write(driftRes.stderr);
  process.stdout.write(
    `Résumé: ${payload.summary?.panelsOpened}/${payload.summary?.panelsTotal} panneaux ouverts, `
    + `${payload.summary?.controlsMapped} contrôles mappés\n`,
  );
};

main();
