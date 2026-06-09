#!/usr/bin/env node
/**
 * Collecte inventaire sources assets VM (gate S playbook Paramètres).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id linux-rocky --local
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  ROOT,
  buildRemoteEnv,
  loadLabHost,
  resolveLabMatrix,
  resolveSshIdentity,
} from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(ROOT, 'root/tools/lab/vm-gnome-settings-assets-inventory.sh');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', local: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--local') opts.local = true;
  }
  return opts;
};

const parseJsonStdout = (stdout) => {
  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Sortie JSON introuvable');
  return JSON.parse(stdout.slice(jsonStart));
};

const runLocal = (matrixPath) => {
  const res = spawnSync('bash', [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, CAPSULE_SETTINGS_ASSETS_MATRIX: matrixPath },
    timeout: 120000,
  });
  if (res.status !== 0) {
    throw new Error(`Inventaire assets local échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const runOnVm = (host, matrixPath) => {
  const matrixB64 = Buffer.from(fs.readFileSync(matrixPath, 'utf8')).toString('base64');
  const scriptBody = fs.readFileSync(SCRIPT, 'utf8');
  const remoteScript = `
${buildRemoteEnv(host)}
MATRIX_FILE=$(mktemp /tmp/capsule-assets-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
export CAPSULE_SETTINGS_ASSETS_MATRIX="$MATRIX_FILE"
bash -s <<'ASSETS_EOF'
${scriptBody}
ASSETS_EOF
rm -f "$MATRIX_FILE"
`;

  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = resolveSshIdentity(host);

  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: remoteScript, encoding: 'utf8', timeout: 120000 },
  );
  if (res.status !== 0) {
    throw new Error(`SSH inventaire assets échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return parseJsonStdout(res.stdout || '');
};

const main = () => {
  const opts = parseArgs();
  process.stderr.write(`=== collect-vm-gnome-settings-assets ${opts.id} ===\n`);

  const matrix = resolveLabMatrix(opts.id, 'assets');
  process.stderr.write(`Matrice assets : ${matrix.relative} (${matrix.source})\n`);
  const payload = opts.local ? runLocal(matrix.absolute) : runOnVm(loadLabHost(opts.id), matrix.absolute);
  const jsonPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-assets.json`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`OK ${jsonPath}\n`);
  process.stdout.write(
    `Résumé: ${payload.summary?.presentOnVm}/${payload.summary?.assetsTotal} assets VM, `
    + `${payload.summary?.missingOnVm} manquants\n`,
  );

  const cmp = spawnSync(
    process.execPath,
    [path.join(ROOT, 'usr/lib/capsuleos/tools/lab/compare-vm-settings-assets-capsule.mjs'), '--registry', opts.id, '--strict'],
    { encoding: 'utf8', cwd: ROOT, stdio: 'inherit' },
  );
  if (cmp.status !== 0) process.exit(cmp.status || 1);
};

main();
