#!/usr/bin/env node
/**
 * Aligne les sources linux-mint dans store-installable-apps.json sur le menu VM (dataLink null → magasin).
 * Usage : node usr/lib/capsuleos/tools/lab/align-mint-store-vm-ground.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/store-installable-apps.json');
const write = process.argv.includes('--write');

const VM_INSTALLED_SLOTS = new Set([
  'firefox',
  'text_editor',
  'calculator',
  'file_roller',
  'calendar',
  'mintdrivers',
  'mintinstall',
  'baobab',
]);

const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
const changes = [];

for (const app of data.apps || []) {
  const src = app.sources && app.sources['linux-mint'];
  if (!src || !app.slot) {
    continue;
  }
  if (VM_INSTALLED_SLOTS.has(app.slot)) {
    if (src.defaultInstalled !== true || src.storeInstallable === true) {
      changes.push({ slot: app.slot, defaultInstalled: true, storeInstallable: false });
      if (write) {
        src.defaultInstalled = true;
        delete src.storeInstallable;
      }
    }
    continue;
  }
  if (src.defaultInstalled === false && src.storeInstallable === true) {
    continue;
  }
  changes.push({ slot: app.slot, defaultInstalled: false, storeInstallable: true });
  if (write) {
    src.defaultInstalled = false;
    src.storeInstallable = true;
  }
}

console.log(JSON.stringify({ write, changes: changes.length, slots: changes.map((c) => c.slot) }, null, 2));

if (!write) {
  console.log('Dry-run — ajouter --write pour appliquer puis generate-store-catalog.mjs');
  process.exit(0);
}

fs.writeFileSync(STORE_PATH, `${JSON.stringify(data, null, 2)}\n`);
const gen = spawnSync(process.execPath, ['usr/lib/capsuleos/tools/generate-store-catalog.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
});
process.exit(gen.status === 0 ? 0 : 1);
