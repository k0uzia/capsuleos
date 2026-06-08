#!/usr/bin/env node
/**
 * Checklist panel 0→5 : VM (SSH) + rapport Capsule (fichier JSON par étapes).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-panel-checklist.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-panel-checklist.mjs --id linux-mint --capsule-states /tmp/capsule-panel.json
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { buildX11ExportScript } from './lab-x11-env.mjs';
import { remoteProbeCmd } from './lab-probe-resolve.mjs';
import { applyPanelLabels } from './panel-checklist-labels.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const DRIVER = fs.readFileSync(path.join(__dirname, 'capsule-panel-driver.js'), 'utf8');
const SNIPPET = fs.readFileSync(path.join(__dirname, 'capsule-probe-snippet.js'), 'utf8');

const STEPS = [
  {
    step: 0,
    label: 'Nemo seul, focus Nemo',
    actions: [
      { cmd: 'action open-launcher nemo' },
      { cmd: 'action focus-launcher nemo' },
    ],
  },
  {
    step: 1,
    label: '+ Firefox, focus Firefox',
    actions: [
      { cmd: 'action open-launcher firefox' },
      { cmd: 'action focus-launcher firefox' },
    ],
  },
  {
    step: 2,
    label: '+ Terminal, focus Terminal',
    actions: [
      { cmd: 'action open-launcher terminal' },
      { cmd: 'action focus-launcher terminal' },
    ],
  },
  { step: 3, label: 'Focus Nemo via lanceur', actions: [{ cmd: 'action focus-launcher nemo' }] },
  { step: 4, label: 'Minimize Nemo', actions: [{ cmd: 'action minimize-launcher nemo' }], p1Note: 'P1 VM : running peut rester true' },
  { step: 5, label: 'Sidebar Nemo → Documents', actions: [{ cmd: 'action nemo-sidebar Documents' }] },
];

const EXPECT = {
  0: (s) => s.launchers && s.launchers.nemo && s.launchers.nemo.active === true,
  1: (s) => s.launchers && s.launchers.firefox && s.launchers.firefox.active === true
    && s.launchers.nemo && s.launchers.nemo.running === true,
  2: (s) => s.launchers && s.launchers.terminal && s.launchers.terminal.active === true,
  3: (s) => s.launchers && s.launchers.nemo && s.launchers.nemo.active === true,
  4: (s) => s.launchers
    && s.launchers.nemo
    && s.launchers.nemo.active === false
    && s.launchers.nemo.running === true,
  5: (s) => {
    const p = s.explorer && s.explorer.nemo ? s.explorer.nemo.currentPath : '';
    return typeof p === 'string' && /documents/i.test(p);
  },
};

const expandHome = (p) => {
  if (!p || p[0] !== '~') return p;
  return path.join(process.env.HOME || '', p.slice(2));
};

const loadHost = (id) => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === id);
  if (!host) throw new Error(`registryId inconnu: ${id}`);
  return host;
};

const runSsh = (host, remoteCmd) => {
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identityPath = expandHome(host.sshIdentity || '~/.ssh/capsuleos-lab');
  const probe = remoteProbeCmd(host);
  const full = `${buildX11ExportScript(host)}; export PATH=$HOME/.local/bin:$PATH; ${probe} ${remoteCmd}`;
  const sshArgs = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes'];
  if (fs.existsSync(identityPath)) {
    sshArgs.push('-i', identityPath);
  }
  sshArgs.push(`${user}@${ip}`, full);
  const res = spawnSync('ssh', sshArgs, { encoding: 'utf8', timeout: 120000 });
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || '').trim());
  }
  const jsonLine = (res.stdout || '').trim().split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{')).pop();
  return JSON.parse(jsonLine || '{}');
};

const prepVm = (host) => {
  const at = host.ssh.indexOf('@');
  const target = host.ssh;
  const identity = expandHome(host.sshIdentity || '~/.ssh/capsuleos-lab');
  const script = `${buildX11ExportScript(host)}; export PATH=$HOME/.local/bin:$PATH
wmctrl -lx 2>/dev/null | while read -r line; do
  cls=$(echo "$line" | awk '{print $3}')
  id=$(echo "$line" | awk '{print $1}')
  echo "$cls" | grep -qi nemo-desktop && continue
  case "$cls" in
    *Firefox*|*Navigator*|*gnome-terminal*|*.Nemo|*Ptyxis*|*ptyxis*|*Nautilus*)
      wmctrl -ic "$id" 2>/dev/null || true
      ;;
  esac
done
pkill -x ptyxis 2>/dev/null || true
pkill -x firefox 2>/dev/null || true
pkill -x nautilus 2>/dev/null || true
sleep 0.35`;
  spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, target, script],
    { encoding: 'utf8', timeout: 60000 },
  );
};

const parseArgs = () => {
  const opts = { id: 'linux-mint', capsuleStates: null };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--capsule-states' && args[i + 1]) opts.capsuleStates = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const steps = applyPanelLabels(STEPS, host.toolkit || 'cinnamon');
  prepVm(host);

  const vmResults = [];
  for (const step of steps) {
    for (const act of step.actions) {
      runSsh(host, act.cmd);
    }
    const state = runSsh(host, 'state');
    const ok = EXPECT[step.step](state);
    vmResults.push({ step: step.step, label: step.label, ok, state, p1Note: step.p1Note || '' });
  }

  let capResults = null;
  if (opts.capsuleStates && fs.existsSync(opts.capsuleStates)) {
    capResults = JSON.parse(fs.readFileSync(opts.capsuleStates, 'utf8'));
  }

  const lines = [];
  lines.push(`# Checklist panel — ${opts.id}`);
  lines.push('');
  lines.push('| Étape | VM | Capsule | Note |');
  lines.push('|-------|-----|---------|------|');
  let failures = 0;
  for (const row of vmResults) {
    let capCell = '—';
    if (capResults && Array.isArray(capResults)) {
      const cap = capResults.find((c) => c.step === row.step);
      if (cap) {
        const capOk = EXPECT[row.step](cap.state);
        capCell = capOk ? 'OK' : 'ÉCART';
        if (!capOk) failures += 1;
      }
    }
    const vmCell = row.ok ? 'OK' : 'ÉCART';
    if (!row.ok) failures += 1;
    const note = row.p1Note || (row.ok ? '' : JSON.stringify(row.state.launchers || row.state.error || ''));
    lines.push(`| ${row.step} ${row.label} | ${vmCell} | ${capCell} | ${note} |`);
  }

  process.stdout.write(`${lines.join('\n')}\n\n`);
  if (!opts.capsuleStates) {
    process.stdout.write('Capsule : générer /tmp/capsule-panel.json via navigateur (voir run-panel-checklist --help-capsule)\n');
    process.stdout.write(`Driver+snippet dans ${path.join(__dirname, '')}\n`);
  }
  process.exit(failures > 0 ? 1 : 0);
};

if (process.argv.includes('--help-capsule')) {
  process.stdout.write(`${DRIVER}\n${SNIPPET}\n`);
  process.exit(0);
}

main();
