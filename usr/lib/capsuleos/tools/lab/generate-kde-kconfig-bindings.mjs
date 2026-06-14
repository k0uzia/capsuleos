#!/usr/bin/env node
/**
 * Génère kde-kconfig-bindings.js depuis kde-settings-controls-registry.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
const JS_OUT = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/kde-kconfig-bindings.js');

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const bindings = {};
  for (const panel of registry.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (!ctrl.capsuleKey || !ctrl.kconfigFile) continue;
      bindings[ctrl.capsuleKey] = {
        controlId: ctrl.id,
        panelId: panel.id,
        kconfigFile: ctrl.kconfigFile,
        kconfigGroup: ctrl.kconfigGroup,
        kconfigKey: ctrl.kconfigKey,
        type: ctrl.type,
        layer: ctrl.layer,
        event: ctrl.event,
      };
    }
  }
  fs.writeFileSync(JS_OUT, `/* Généré par generate-kde-kconfig-bindings.mjs — ne pas éditer à la main */
window.CAPSULE_KDE_KCONFIG_BINDINGS = ${JSON.stringify(bindings, null, 4)};
`);
  process.stdout.write(`OK ${JS_OUT} (${Object.keys(bindings).length} bindings)\n`);
}

main();
