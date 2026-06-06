#!/usr/bin/env node
/**
 * Compare les valeurs VM (playbook) aux défauts CapsuleOS (gnome-settings-parity.js).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-vm-parity-defaults.mjs
 *   node usr/lib/capsuleos/tools/lab/compare-vm-parity-defaults.mjs --registry linux-rocky --strict
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { registry: 'linux-rocky', strict: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--registry' && args[i + 1]) opts.registry = args[++i];
    else if (args[i] === '--strict') opts.strict = true;
  }
  return opts;
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

function extractParityDefaults(parityJs) {
  const defaults = {};
  const switchBlock = parityJs.match(/const SWITCH_HANDLERS = \{([\s\S]*?)\n    \};/);
  const selectBlock = parityJs.match(/const SELECT_HANDLERS = \{([\s\S]*?)\n    \};/);
  const sliderBlock = parityJs.match(/const SLIDER_HANDLERS = \{([\s\S]*?)\n    \};/);

  const idRe = /^\s{8}(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*\{/gm;
  const defaultOnRe = /defaultOn:\s*(true|false)/;
  const defaultRe = /default:\s*('([^']*)'|(\d+))/;

  function walk(block, type) {
    if (!block) return;
    const body = block[1];
    let m;
    const ids = [];
    while ((m = idRe.exec(body)) !== null) {
      ids.push({ id: m[1] || m[2], index: m.index });
    }
    ids.forEach((entry, idx) => {
      const end = idx + 1 < ids.length ? ids[idx + 1].index : body.length;
      const chunk = body.slice(entry.index, end);
      if (type === 'switch') {
        const on = chunk.match(defaultOnRe);
        if (on) defaults[entry.id] = on[1] === 'true' ? 'on' : 'off';
      } else if (type === 'select') {
        const d = chunk.match(defaultRe);
        if (d) defaults[entry.id] = d[2] ?? d[3];
      } else {
        const d = chunk.match(defaultRe);
        if (d) defaults[entry.id] = String(d[2] ?? d[3]);
      }
    });
  }

  walk(switchBlock, 'switch');
  walk(selectBlock, 'select');
  walk(sliderBlock, 'slider');
  return defaults;
}

function loadPlaybookVmValues(registry) {
  const jsonPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-playbook.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Playbook absent: ${jsonPath}`);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const vm = {};
  for (const panel of data.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (ctrl.status === 'mapped' && ctrl.capsuleExpected != null) {
        vm[ctrl.id] = String(ctrl.capsuleExpected);
      }
    }
  }
  return vm;
}

const NORMALIZE = {
  on: ['on', 'true', 'activé', 'enabled'],
  off: ['off', 'false', 'désactivé', 'disabled'],
};

function normalize(value) {
  const v = String(value).trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(NORMALIZE)) {
    if (aliases.includes(v)) return canonical;
  }
  return String(value).trim();
}

function main() {
  const opts = parseArgs();
  const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
  const parityDefaults = extractParityDefaults(parityJs);
  const vmValues = loadPlaybookVmValues(opts.registry);

  const drifts = [];
  const aligned = [];

  for (const [controlId, vmExpected] of Object.entries(vmValues)) {
    const parityDefault = parityDefaults[controlId];
    if (parityDefault === undefined) continue;
    const a = normalize(parityDefault);
    const b = normalize(vmExpected);
    if (a !== b && parityDefault !== vmExpected) {
      drifts.push({ controlId, parityDefault, vmExpected });
    } else {
      aligned.push(controlId);
    }
  }

  const report = {
    registry: opts.registry,
    generatedAt: new Date().toISOString(),
    alignedCount: aligned.length,
    driftCount: drifts.length,
    drifts,
    aligned,
  };

  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.registry}-gnome-settings-parity-drift.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  process.stdout.write(`OK ${outPath}\n`);
  process.stdout.write(`Alignés: ${aligned.length}, dérives: ${drifts.length}\n`);
  if (drifts.length) {
    drifts.forEach((d) => process.stderr.write(`  Δ ${d.controlId}: parity=${d.parityDefault} vm=${d.vmExpected}\n`));
    if (opts.strict) process.exit(1);
  }
}

main();
