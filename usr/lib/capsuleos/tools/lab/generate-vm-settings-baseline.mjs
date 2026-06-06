#!/usr/bin/env node
/**
 * Génère la baseline VM Rocky pour gnome-settings-parity (défauts alignés playbook).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-vm-settings-baseline.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-vm-settings-baseline.mjs --registry linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  let registry = 'linux-rocky';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--registry' && args[i + 1]) registry = args[++i];
  }
  return { registry };
};

const main = () => {
  const { registry } = parseArgs();
  const playbookPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-playbook.json`);
  if (!fs.existsSync(playbookPath)) {
    throw new Error(`Playbook absent: ${playbookPath}`);
  }
  const playbook = JSON.parse(fs.readFileSync(playbookPath, 'utf8'));
  const controls = {};

  for (const panel of playbook.panels || []) {
    for (const ctrl of panel.controls || []) {
      if (ctrl.status === 'mapped' && ctrl.capsuleExpected != null && ctrl.capsuleExpected !== '') {
        controls[ctrl.id] = {
          capsuleExpected: String(ctrl.capsuleExpected),
          capsuleKey: ctrl.capsuleKey || null,
          schema: ctrl.schema || null,
          key: ctrl.key || null,
          panelId: panel.id,
        };
      }
    }
  }

  const payload = {
    registry,
    generatedAt: new Date().toISOString(),
    source: path.basename(playbookPath),
    controlCount: Object.keys(controls).length,
    controls,
  };

  const jsonOut = path.join(ROOT, 'usr/share/capsuleos/linux', `gnome-settings-vm-baseline-${registry}.json`);
  const jsOut = path.join(ROOT, 'usr/lib/capsuleos/shells/linux', `gnome-settings-vm-baseline-${registry}.js`);

  fs.writeFileSync(jsonOut, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(jsOut, `/* Généré par generate-vm-settings-baseline.mjs — ne pas éditer à la main */
window.CAPSULE_VM_SETTINGS_BASELINE = ${JSON.stringify(controls, null, 4)};
`);

  process.stdout.write(`OK ${jsonOut} (${payload.controlCount} contrôles)\n`);
  process.stdout.write(`OK ${jsOut}\n`);
};

main();
