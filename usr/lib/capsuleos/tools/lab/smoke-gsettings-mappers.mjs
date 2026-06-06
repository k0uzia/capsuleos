#!/usr/bin/env node
/**
 * Smoke mappeurs gsettings ↔ CapsuleOS (round-trip).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gsettings-mappers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function loadGsettingsMaps() {
  const src = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js');
  const sandbox = {
    window: {},
    localStorage: createMemoryStorage(),
    document: null,
    CustomEvent: null,
  };
  sandbox.window = sandbox;
  const bindingsSrc = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js');
  vm.runInNewContext(bindingsSrc, sandbox);
  vm.runInNewContext(src, sandbox);
  return sandbox.CapsuleGnomeGSettings.MAPS;
}

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; },
  };
}

const ROUND_TRIPS = [
  { map: 'boolOnOff', raw: 'true', capsule: 'on' },
  { map: 'boolOnOff', raw: 'false', capsule: 'off' },
  { map: 'enabledLabelFr', raw: 'true', capsule: 'Activé' },
  { map: 'enabledLabelFr', raw: 'false', capsule: 'Désactivé' },
  { map: 'workspaceOnlyInverted', raw: 'true', capsule: 'Désactivé' },
  { map: 'workspaceOnlyInverted', raw: 'false', capsule: 'Activé' },
  { map: 'mouseHandedness', raw: 'false', capsule: 'Gauche' },
  { map: 'scrollDirection', raw: 'true', capsule: 'Naturel' },
  { map: 'touchpadEnabled', raw: "'enabled'", capsule: 'on' },
  { map: 'privacyInverted', raw: 'false', capsule: 'on' },
  { map: 'colorScheme', raw: "'prefer-dark'", capsule: 'dark' },
  { map: 'colorScheme', raw: "'prefer-light'", capsule: 'light' },
  { map: 'accentColor', raw: "'blue'", capsule: 'blue' },
  { map: 'soundTheme', raw: "'freedesktop'", capsule: 'Ding' },
  { map: 'textScalingPercent', raw: '1.0', capsule: '100 %' },
  { map: 'fontScalePercent', raw: '1.0', capsule: '100' },
  { map: 'pointerSpeedPercent', raw: '0.0', capsule: '50' },
  { map: 'keyboardDelayMs', raw: 'uint32 500', capsule: '500 ms' },
  { map: 'lockDelayFr', raw: 'uint32 0', capsule: 'Immédiatement' },
  { map: 'powerDimTimeout', raw: '900', capsule: '15 minutes' },
  { map: 'powerSleepType', raw: "'suspend'", capsule: '30 minutes' },
  { map: 'keyboardLayoutFr', raw: "[('xkb', 'fr+oss')]", capsule: 'Français' },
  { map: 'gtkHighContrast', raw: "'Adwaita'", capsule: 'normal' },
  { map: 'powerProfile', raw: "'balanced'", capsule: 'Équilibré' },
  { map: 'powerProfile', raw: "'performance'", capsule: 'Performance' },
];

function main() {
  const MAPS = loadGsettingsMaps();
  for (const sample of ROUND_TRIPS) {
    const mapper = MAPS[sample.map];
    if (!mapper) {
      errors.push(`Mappeur absent: ${sample.map}`);
      continue;
    }
    const toCapsule = mapper.toCapsule(sample.raw);
    if (toCapsule !== sample.capsule) {
      errors.push(`${sample.map} toCapsule(${sample.raw}) → ${toCapsule} (attendu ${sample.capsule})`);
    }
    const fromCapsule = mapper.fromCapsule(sample.capsule);
    const roundTrip = mapper.toCapsule(fromCapsule);
    if (roundTrip !== sample.capsule) {
      errors.push(`${sample.map} round-trip ${sample.capsule} → ${fromCapsule} → ${roundTrip}`);
    }
  }

  if (errors.length) {
    console.error('smoke-gsettings-mappers — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gsettings-mappers OK (${ROUND_TRIPS.length} round-trips)`);
}

main();
