#!/usr/bin/env node
/**
 * Compare parité panel : VM réelle (SSH + os-probe) vs CapsuleOS (JSON export CDP).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-mint --scenario panel-checklist
 *   node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-mint --vm-state-only
 *   node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-mint --capsule-json /tmp/capsule-state.json
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
const SNIPPET = path.join(__dirname, 'capsule-probe-snippet.js');

const SCENARIOS = {
  'panel-checklist': [
    {
      step: 0,
      label: 'Nemo seul, focus Nemo',
      actions: [
        { type: 'vm', cmd: 'action open-launcher nemo' },
        { type: 'vm', cmd: 'action focus-launcher nemo' },
      ],
      expect: (s) => s.launchers && s.launchers.nemo && s.launchers.nemo.active === true,
    },
    {
      step: 1,
      label: '+ Firefox, focus Firefox',
      actions: [
        { type: 'vm', cmd: 'action open-launcher firefox' },
        { type: 'vm', cmd: 'action focus-launcher firefox' },
      ],
      expect: (s) => s.launchers
        && s.launchers.firefox
        && s.launchers.firefox.active === true
        && s.launchers.nemo
        && s.launchers.nemo.running === true,
    },
    {
      step: 2,
      label: '+ Terminal, focus Terminal',
      actions: [
        { type: 'vm', cmd: 'action open-launcher terminal' },
        { type: 'vm', cmd: 'action focus-launcher terminal' },
      ],
      expect: (s) => s.launchers
        && s.launchers.terminal
        && s.launchers.terminal.active === true,
    },
    {
      step: 3,
      label: 'Focus Nemo via lanceur',
      actions: [{ type: 'vm', cmd: 'action focus-launcher nemo' }],
      expect: (s) => s.launchers && s.launchers.nemo && s.launchers.nemo.active === true,
    },
    {
      step: 4,
      label: 'Minimize Nemo (P1: running peut rester true sur Cinnamon)',
      actions: [{ type: 'vm', cmd: 'action minimize-launcher nemo' }],
      expect: (s) => s.launchers
        && s.launchers.nemo
        && s.launchers.nemo.active === false
        && s.launchers.nemo.running === true,
      p1Note: 'Parité Cinnamon : running-link conservé, active-link retiré',
    },
    {
      step: 5,
      label: 'Sidebar Nemo → Documents',
      actions: [{ type: 'vm', cmd: 'action nemo-sidebar Documents' }],
      expect: (s) => {
        const p = s.explorer && s.explorer.nemo ? s.explorer.nemo.currentPath : '';
        return typeof p === 'string' && /documents/i.test(p);
      },
      capsuleOnlyPath: true,
    },
  ],
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: null,
    scenario: 'panel-checklist',
    vmStateOnly: false,
    capsuleJson: null,
    dryRun: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--scenario' && args[i + 1]) opts.scenario = args[++i];
    else if (a === '--vm-state-only') opts.vmStateOnly = true;
    else if (a === '--capsule-json' && args[i + 1]) opts.capsuleJson = args[++i];
    else if (a === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const expandHome = (p) => {
  if (!p || p[0] !== '~') return p;
  const home = process.env.HOME || '';
  return path.join(home, p.slice(2));
};

const loadInventory = () => {
  if (!fs.existsSync(INVENTORY)) {
    throw new Error(`Inventaire manquant : ${INVENTORY} (copier depuis lab-inventory.example.json)`);
  }
  return JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
};

const findHost = (inv, registryId) => {
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) {
    throw new Error(`Hôte non trouvé pour registryId=${registryId}`);
  }
  return host;
};

const sshTarget = (host) => {
  const at = host.ssh.indexOf('@');
  if (at < 0) throw new Error(`ssh invalide : ${host.ssh}`);
  return { user: host.ssh.slice(0, at), host: host.ssh.slice(at + 1) };
};

const runSsh = (host, remoteCmd) => {
  const { user, host: ip } = sshTarget(host);
  const identity = expandHome(host.sshIdentity || '~/.ssh/capsuleos-lab');
  const probe = remoteProbeCmd(host);
  const full = `${buildX11ExportScript(host)}; export PATH=$HOME/.local/bin:$PATH; ${probe} ${remoteCmd}`;
  const res = spawnSync(
    'ssh',
    [
      '-o', 'BatchMode=yes',
      '-o', 'IdentitiesOnly=yes',
      '-i', identity,
      `${user}@${ip}`,
      full,
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  if (res.status !== 0) {
    const err = (res.stderr || res.stdout || '').trim();
    throw new Error(`SSH échec (${user}@${ip}): ${err || `code ${res.status}`}`);
  }
  const out = (res.stdout || '').trim();
  const jsonLine = out.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{')).pop();
  return JSON.parse(jsonLine || '{}');
};

/** Export unique ou tableau `{ step, state }[]` (run-capsule-panel-browser.mjs). */
const loadCapsuleStatesByStep = (filePath) => {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(raw)) {
    return new Map([[0, raw]]);
  }
  const map = new Map();
  for (const entry of raw) {
    if (entry && typeof entry === 'object' && entry.state) {
      map.set(entry.step, entry.state);
    }
  }
  return map;
};

const printSnippetHelp = () => {
  const js = fs.readFileSync(SNIPPET, 'utf8');
  process.stdout.write('\n--- CapsuleOS : coller dans CDP Runtime.evaluate ---\n');
  process.stdout.write(`${js}\n---\n`);
};

const main = () => {
  const opts = parseArgs();
  if (!opts.id) {
    console.error('Usage: --id <registryId> [--scenario panel-checklist] [--vm-state-only] [--capsule-json path]');
    process.exit(1);
  }

  const scenarioSteps = SCENARIOS[opts.scenario];
  if (!scenarioSteps) {
    console.error(`Scénario inconnu : ${opts.scenario}`);
    process.exit(1);
  }

  const inv = loadInventory();
  const host = findHost(inv, opts.id);
  const steps = applyPanelLabels(scenarioSteps, host.toolkit || 'cinnamon');

  if (opts.vmStateOnly) {
    const state = runSsh(host, 'state');
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }

  const lines = [];
  let vmFailures = 0;
  let capFailures = 0;
  const capByStep = (opts.capsuleJson && fs.existsSync(opts.capsuleJson))
    ? loadCapsuleStatesByStep(opts.capsuleJson)
    : null;

  lines.push(`# Parité ${opts.id} — ${opts.scenario}`);
  lines.push(`| Étape | VM | Capsule | Note |`);
  lines.push(`|-------|----|---------|------|`);

  for (const step of steps) {
    if (!opts.dryRun) {
      for (const act of step.actions || []) {
        if (act.type === 'vm') {
          runSsh(host, act.cmd);
        }
      }
    }

    let vmOk = false;
    let vmState = null;
    try {
      vmState = runSsh(host, 'state');
      vmOk = step.expect(vmState);
    } catch (e) {
      vmOk = false;
      vmState = { error: String(e.message || e) };
    }

    let capOk = null;
    if (capByStep) {
      const capState = capByStep.get(step.step);
      if (capState) {
        capOk = step.expect(capState);
      } else {
        capOk = false;
      }
    }

    const vmCell = vmOk ? 'OK' : 'ÉCART';
    const capCell = capOk === null ? '—' : (capOk ? 'OK' : 'ÉCART');
    const note = step.p1Note || (vmState && vmState.error ? vmState.error : '');
    lines.push(`| ${step.step} ${step.label} | ${vmCell} | ${capCell} | ${note} |`);

    if (!vmOk) vmFailures += 1;
    if (capOk === false) capFailures += 1;
  }

  process.stdout.write(`${lines.join('\n')}\n\n`);
  if (!opts.capsuleJson) {
    printSnippetHelp();
    process.stdout.write('Export Capsule : run-capsule-panel-browser.mjs puis --capsule-json /tmp/capsule-panel.json\n');
  }

  const exitCode = capByStep
    ? (vmFailures > 0 || capFailures > 0 ? 1 : 0)
    : (vmFailures > 0 ? 1 : 0);
  process.exit(exitCode);
};

main();
