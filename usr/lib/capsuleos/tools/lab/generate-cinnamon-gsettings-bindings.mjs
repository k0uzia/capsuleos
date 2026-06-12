#!/usr/bin/env node
/**
 * Génère cinnamon-gsettings-bindings.js depuis cinnamon-settings-parity-matrix.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const MATRIX_PATH = path.join(ROOT, 'root/tools/lab/cinnamon-settings-parity-matrix.json');
const JS_OUT = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/cinnamon-gsettings-bindings.js');

function main() {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const bindings = {};
  for (const panel of matrix.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (!ctrl.schema || !ctrl.key || !ctrl.capsuleKey) {
        continue;
      }
      bindings[ctrl.capsuleKey] = {
        controlId: ctrl.id,
        panelId: panel.id,
        schema: ctrl.schema,
        key: ctrl.key,
        map: ctrl.map || 'passthrough',
        effect: ctrl.effect || null,
        effectArg: ctrl.effectArg || null,
      };
    }
  }
  fs.writeFileSync(JS_OUT, `/* Généré par generate-cinnamon-gsettings-bindings.mjs — ne pas éditer à la main */
window.CAPSULE_CINNAMON_GSETTINGS_BINDINGS = ${JSON.stringify(bindings, null, 4)};
`);
  process.stdout.write(`OK ${JS_OUT} (${Object.keys(bindings).length} bindings)\n`);
}

main();
