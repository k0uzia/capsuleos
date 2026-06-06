#!/usr/bin/env node
/**
 * Compare le playbook VM (vmRaw → capsuleExpected) aux mappeurs gsettings CapsuleOS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-playbook-gsettings-capsule.mjs
 *   node usr/lib/capsuleos/tools/lab/compare-playbook-gsettings-capsule.mjs --registry linux-rocky --strict
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
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

function loadMaps() {
  const sandbox = {
    window: {},
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
      key() { return null; },
      length: 0,
    },
    document: null,
    CustomEvent: null,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(read('usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js'), sandbox);
  vm.runInNewContext(read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js'), sandbox);
  return {
    maps: sandbox.CapsuleGnomeGSettings.MAPS,
    bindings: sandbox.CAPSULE_GSETTINGS_BINDINGS,
  };
}

function normalizeOnOff(value) {
  const v = String(value).trim().toLowerCase();
  if (v === 'on' || v === 'true' || v === 'activé') return 'on';
  if (v === 'off' || v === 'false' || v === 'désactivé') return 'off';
  return String(value).trim();
}

function mapSearchProviderToggle(binding, vmRaw) {
  const trimmed = String(vmRaw).trim();
  const empty = trimmed === '@as []' || trimmed === '[]';
  if (!binding.providerId) {
    return empty ? 'on' : 'off';
  }
  const ids = (trimmed.match(/'([^']+)'/g) || []).map((entry) => entry.slice(1, -1));
  return ids.includes(binding.providerId) ? 'off' : 'on';
}

function main() {
  const opts = parseArgs();
  const playbookPath = path.join(ROOT, 'root/docs/inventaires', `${opts.registry}-gnome-settings-playbook.json`);
  const bindingsPayload = JSON.parse(read('usr/share/capsuleos/linux/gnome-gsettings-bindings.json') || '{}');
  const bindings = bindingsPayload.bindings || {};

  if (!fs.existsSync(playbookPath)) {
    console.error(`Playbook absent: ${playbookPath}`);
    process.exit(1);
  }

  const playbook = JSON.parse(fs.readFileSync(playbookPath, 'utf8'));
  const { maps } = loadMaps();

  const aligned = [];
  const skipped = [];
  const drifts = [];
  const missingBinding = [];

  for (const panel of playbook.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (ctrl.status !== 'mapped' || ctrl.vmRaw == null || ctrl.capsuleExpected == null) {
        skipped.push(ctrl.id);
        continue;
      }
      const binding = bindings[ctrl.capsuleKey];
      if (!binding || !binding.map || binding.map === 'passthrough') {
        if (ctrl.schema) {
          missingBinding.push(ctrl.id);
        }
        continue;
      }
      let mapped;
      if (binding.map === 'searchProviderToggle') {
        mapped = mapSearchProviderToggle(binding, ctrl.vmRaw);
      } else {
        const mapper = maps[binding.map];
        if (!mapper || typeof mapper.toCapsule !== 'function') {
          drifts.push({ id: ctrl.id, reason: `mappeur absent: ${binding.map}` });
          continue;
        }
        mapped = mapper.toCapsule(ctrl.vmRaw);
      }
      const expected = String(ctrl.capsuleExpected);
      const a = normalizeOnOff(mapped);
      const b = normalizeOnOff(expected);
      if (mapped !== expected && a !== b) {
        drifts.push({
          id: ctrl.id,
          capsuleKey: ctrl.capsuleKey,
          vmRaw: ctrl.vmRaw,
          playbookExpected: expected,
          capsuleMapped: mapped,
          map: binding.map,
        });
      } else {
        aligned.push(ctrl.id);
      }
    }
  }

  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.registry}-gsettings-playbook-capsule-drift.json`);
  const payload = {
    registry: opts.registry,
    generatedAt: new Date().toISOString(),
    alignedCount: aligned.length,
    driftCount: drifts.length,
    missingBindingCount: missingBinding.length,
    skippedCount: skipped.length,
    drifts,
    missingBinding,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

  process.stdout.write(`Alignés playbook↔capsule: ${aligned.length}, dérives: ${drifts.length}, sans binding: ${missingBinding.length}\n`);
  process.stdout.write(`OK ${outPath}\n`);

  if (drifts.length) {
    drifts.forEach((d) => {
      process.stderr.write(`  ✗ ${d.id}: vmRaw=${d.vmRaw} → ${d.capsuleMapped} (playbook ${d.playbookExpected})\n`);
    });
    process.exit(opts.strict ? 1 : 0);
  }
  if (opts.strict && missingBinding.length) {
    process.stderr.write(`  ⚠ contrôles mappés VM sans binding gsettings: ${missingBinding.join(', ')}\n`);
    process.exit(1);
  }
}

main();
