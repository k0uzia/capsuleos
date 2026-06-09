#!/usr/bin/env node
/**
 * Campagne menus contextuels Nemo — VM Mint (SSH + xdotool + pyatspi).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs
 *   node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs --id nemo.list.background.home
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadHost } from './lab-ssh.mjs';
import {
  ROOT,
  SCENARIOS_PATH,
  readJson,
} from './mint-nemo-context-campaign-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-vm.json',
);
const VM_PY = path.join(__dirname, 'mint-nemo-context-campaign-vm.py');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const opts = parseArgs();
const scenariosDoc = readJson(SCENARIOS_PATH);
let scenarios = scenariosDoc.scenarios || [];
if (opts.id) {
  scenarios = scenarios.filter((s) => s.id === opts.id);
}

const vmScenarios = scenarios.filter((s) => s.group === 'nemo' || s.id === 'window.title');
const host = loadHost('linux-mint');
const at = host.ssh.indexOf('@');
const user = host.ssh.slice(0, at);
const ip = host.ssh.slice(at + 1);
const identity = process.env.CAPSULE_LAB_SSH_IDENTITY
  || host.sshIdentity
  || `${process.env.HOME}/.ssh/capsuleos-lab`;

const stdinPayload = JSON.stringify({ scenarios: vmScenarios });

const scp = spawnSync('scp', [
  '-o', 'BatchMode=yes',
  '-o', 'IdentitiesOnly=yes',
  '-i', identity,
  VM_PY,
  `${user}@${ip}:/tmp/capsule-nemo-ctx-campaign.py`,
], { encoding: 'utf8' });

if (scp.status !== 0) {
  console.error(scp.stderr || scp.stdout);
  process.exit(1);
}

const ssh = spawnSync('ssh', [
  '-o', 'BatchMode=yes',
  '-o', 'IdentitiesOnly=yes',
  '-i', identity,
  `${user}@${ip}`,
  'DISPLAY=:0 python3 /tmp/capsule-nemo-ctx-campaign.py',
], { input: stdinPayload, encoding: 'utf8', timeout: 600000 });

if (ssh.status !== 0) {
  console.error(ssh.stderr || ssh.stdout);
  process.exit(1);
}

let parsed;
try {
  const lines = ssh.stdout.trim().split('\n').filter(Boolean);
  parsed = JSON.parse(lines[lines.length - 1]);
} catch (e) {
  parsed = { results: {}, parseError: String(e.message), raw: ssh.stdout.slice(-2000) };
}

const out = {
  collectedAt: new Date().toISOString(),
  source: 'vm-xdotool-pyatspi',
  host: host.ssh,
  scenarioCount: vmScenarios.length,
  results: parsed.results || {},
};

fs.writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({
  out: OUT_PATH.replace(`${ROOT}/`, ''),
  scenarioCount: vmScenarios.length,
  visible: Object.values(out.results).filter((r) => r.visible).length,
}, null, 2));
