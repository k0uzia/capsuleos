#!/usr/bin/env node
/**
 * Collecte checklist interactions par slot — VM doc/JSON + template + SSH optionnel.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/collect-app-interaction-inventory.mjs --id linux-mint --slot nemo
 *   node usr/lib/capsuleos/tools/lab/collect-app-interaction-inventory.mjs --id linux-mint --slot nemo --write
 *   node usr/lib/capsuleos/tools/lab/collect-app-interaction-inventory.mjs --id linux-mint --all --write
 */
import fs from 'fs';
import path from 'path';
import { SLOT_TEMPLATES } from './app-interaction-templates.mjs';
import {
  ROOT,
  inventoryPath,
  inventoryDir,
  vmDocCandidates,
} from './parity-index-lib.mjs';
import { loadHost, runSshCommand } from './lab-ssh.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', slot: null, all: false, write: false, ssh: false };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--slot' && args[i + 1]) opts.slot = args[++i];
    else if (a === '--all') opts.all = true;
    else if (a === '--write') opts.write = true;
    else if (a === '--ssh') opts.ssh = true;
  }
  return opts;
};

const readVmGroundTruth = (registryId, slot) => {
  const docs = vmDocCandidates(registryId, slot);
  const out = { md: null, json: null };
  docs.forEach((p) => {
    if (!fs.existsSync(p)) return;
    if (p.endsWith('.md')) out.md = p.replace(`${ROOT}/`, '');
    if (p.endsWith('.json')) {
      try {
        out.json = JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        out.json = { error: String(e.message) };
      }
    }
  });
  return out;
};

const probeVmTools = async (registryId) => {
  try {
    const host = loadHost(registryId);
    const tools = await runSshCommand(host, 'which xdotool wmctrl python3 2>/dev/null | tr "\\n" " "');
    return { available: true, tools: tools.stdout };
  } catch (e) {
    return { available: false, error: String(e.message) };
  }
};

const buildInventory = (registryId, slot, vmProbe) => {
  const template = SLOT_TEMPLATES[slot];
  if (!template) {
    return {
      registryId,
      slot,
      label: slot,
      collectedAt: new Date().toISOString(),
      source: 'unknown-slot',
      checks: [],
      vm: readVmGroundTruth(registryId, slot),
      vmProbe,
    };
  }

  const vm = readVmGroundTruth(registryId, slot);
  const checks = template.checks.map((c) => ({
    ...c,
    pass: null,
    note: c.expect ? String(c.expect) : '',
  }));

  return {
    registryId,
    slot,
    label: template.label,
    collectedAt: new Date().toISOString(),
    source: vm.md || vm.json ? 'vm-doc+template' : 'template',
    vmDoc: template.vmDoc || vm.md || null,
    vm,
    vmProbe,
    checks,
  };
};

const main = async () => {
  const opts = parseArgs();
  const slots = opts.all
    ? Object.keys(SLOT_TEMPLATES)
    : opts.slot
      ? [opts.slot]
      : [];

  if (!slots.length) {
    console.error('Usage: --slot <slot> ou --all');
    process.exit(1);
  }

  const vmProbe = opts.ssh ? await probeVmTools(opts.id) : { skipped: true };

  const results = slots.map((slot) => {
    const inv = buildInventory(opts.id, slot, vmProbe);
    if (opts.write) {
      const out = inventoryPath(opts.id, slot);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, `${JSON.stringify(inv, null, 2)}\n`);
      inv.written = out.replace(`${ROOT}/`, '');
    }
    return inv;
  });

  console.log(JSON.stringify(opts.all || slots.length > 1 ? results : results[0], null, 2));
};

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
