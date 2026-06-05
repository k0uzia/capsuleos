#!/usr/bin/env node
/**
 * Ajoute ou retire une entrée de la file de réactivation, puis régénère le registre.
 * Usage :
 *   node usr/lib/capsuleos/tools/reactivate-os.mjs linux-mint
 *   node usr/lib/capsuleos/tools/reactivate-os.mjs --remove linux-mint
 *   node usr/lib/capsuleos/tools/reactivate-os.mjs --list
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const QUEUE = path.join(ROOT, 'etc/capsuleos/reactivation-queue.json');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const args = process.argv.slice(2);
const remove = args[0] === '--remove';
const list = args[0] === '--list';
const id = remove ? args[1] : (list ? null : args[0]);

const queue = fs.existsSync(QUEUE)
  ? JSON.parse(fs.readFileSync(QUEUE, 'utf8'))
  : { version: 1, ids: [] };

if (list) {
  console.log('File de réactivation:', queue.ids.length ? queue.ids.join(', ') : '(vide)');
  process.exit(0);
}

if (!id) {
  console.error('Usage: reactivate-os.mjs <registryId> | --remove <id> | --list');
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
if (!registry.entries.find((e) => e.id === id)) {
  console.error(`Entrée inconnue: ${id}`);
  process.exit(1);
}

if (remove) {
  queue.ids = queue.ids.filter((x) => x !== id);
} else if (!queue.ids.includes(id)) {
  queue.ids.push(id);
}

fs.writeFileSync(QUEUE, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
console.log(remove ? `Retiré: ${id}` : `Ajouté: ${id}`);

const scripts = [
  'build-os-registry.mjs',
  'build-profiles-from-registry.mjs',
  'build-pick-os.mjs'
];
for (const s of scripts) {
  spawnSync(process.execPath, [path.join(__dirname, s)], { stdio: 'inherit', cwd: ROOT });
}

console.log(`\nRéactivation ${remove ? 'annulée' : 'programmée'} pour ${id}.`);
if (!remove) {
  console.log('Vérifier : node usr/lib/capsuleos/tools/validate-all.mjs');
}
