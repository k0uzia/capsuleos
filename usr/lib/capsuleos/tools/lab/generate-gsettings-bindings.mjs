#!/usr/bin/env node
/**
 * Génère les bindings gsettings CapsuleOS depuis gnome-settings-parity-matrix.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-gsettings-bindings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const MATRIX_PATH = path.join(ROOT, 'root/tools/lab/gnome-settings-parity-matrix.json');
const JSON_OUT = path.join(ROOT, 'usr/share/capsuleos/linux/gnome-gsettings-bindings.json');
const JS_OUT = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js');

/** Liaisons dérivées absentes de la matrice mais requises par le shell. */
const DERIVED_BINDINGS = {
  'gnome-theme': { from: 'mint-theme' },
  'gnome-event-sounds': {
    controlId: 'event-sounds',
    schema: 'org.gnome.desktop.sound',
    key: 'event-sounds',
    map: 'boolOnOff',
  },
};

const SKIP_MAPS = new Set(['volumeStepNote']);

function collectFromMatrix(matrix) {
  const bindings = {};
  for (const panel of matrix.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (!ctrl.schema || !ctrl.key || !ctrl.capsuleKey) continue;
      if (SKIP_MAPS.has(ctrl.map)) continue;
      const entry = {
        controlId: ctrl.id,
        schema: ctrl.schema,
        key: ctrl.key,
        map: ctrl.map || 'passthrough',
      };
      if (ctrl.providerId) {
        entry.providerId = ctrl.providerId;
      }
      if (ctrl.source && String(ctrl.source).includes('simulated')) {
        entry.simulated = true;
      }
      bindings[ctrl.capsuleKey] = entry;
    }
  }
  return bindings;
}

function applyDerived(bindings) {
  for (const [capsuleKey, rule] of Object.entries(DERIVED_BINDINGS)) {
    if (bindings[capsuleKey]) continue;
    if (rule.from && bindings[rule.from]) {
      bindings[capsuleKey] = { ...bindings[rule.from], controlId: 'theme', derivedFrom: rule.from };
      continue;
    }
    if (rule.schema && rule.key) {
      bindings[capsuleKey] = {
        controlId: rule.controlId,
        schema: rule.schema,
        key: rule.key,
        map: rule.map,
        derived: true,
      };
    }
  }
  return bindings;
}

function main() {
  if (!fs.existsSync(MATRIX_PATH)) {
    throw new Error(`Matrice absente: ${MATRIX_PATH}`);
  }
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const bindings = applyDerived(collectFromMatrix(matrix));

  const payload = {
    matrixVersion: matrix.version ?? null,
    generatedAt: new Date().toISOString(),
    source: path.basename(MATRIX_PATH),
    bindingCount: Object.keys(bindings).length,
    bindings,
  };

  fs.writeFileSync(JSON_OUT, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(JS_OUT, `/* Généré par generate-gsettings-bindings.mjs — ne pas éditer à la main */
window.CAPSULE_GSETTINGS_BINDINGS = ${JSON.stringify(bindings, null, 4)};
`);

  process.stdout.write(`OK ${JSON_OUT} (${payload.bindingCount} bindings)\n`);
  process.stdout.write(`OK ${JS_OUT}\n`);
}

main();
