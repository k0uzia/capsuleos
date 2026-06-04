#!/usr/bin/env node
/**
 * Retire de l'index Git les images legacy supprimées du disque (media/, assets skin, android…).
 * Usage : node usr/lib/capsuleos/tools/prune-git-legacy-media.mjs [--dry-run]
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');

const LEGACY_RE =
  /^home\/|^(OS\/(linux|windows|android|ios|macos|bsd)\/)|^(usr\/share\/capsuleos\/linux\/)/;

const isLegacyMediaPath = (rel) => {
  if (!LEGACY_RE.test(rel)) return false;
  if (/\/media\//.test(rel)) return true;
  if (/^OS\/android\/assets\//.test(rel)) return true;
  if (/^OS\/ios\/15\/assets\//.test(rel)) return true;
  if (/^home\/[^/]+\/[^/]+\/assets\//.test(rel)) return true;
  if (/^OS\/linux\/families\/[^/]+\/[^/]+\/assets\//.test(rel)) return true;
  return false;
};

const listed = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
if (listed.status !== 0) {
  console.error('git ls-files failed');
  process.exit(1);
}

const toRemove = listed.stdout
  .split('\n')
  .filter(Boolean)
  .filter(isLegacyMediaPath)
  .filter((rel) => !fs.existsSync(path.join(ROOT, rel)));

console.log(`${toRemove.length} entrée(s) Git legacy à retirer (fichier absent du disque)`);

if (!toRemove.length) {
  process.exit(0);
}

if (DRY) {
  toRemove.slice(0, 20).forEach((f) => console.log(' ', f));
  if (toRemove.length > 20) console.log(`  ... et ${toRemove.length - 20} autres`);
  process.exit(0);
}

const BATCH = 200;
let removed = 0;
for (let i = 0; i < toRemove.length; i += BATCH) {
  const batch = toRemove.slice(i, i + BATCH);
  const r = spawnSync('git', ['rm', '--cached', '-f', '--', ...batch], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  removed += batch.length;
  process.stdout.write(`\r${removed}/${toRemove.length}`);
}
console.log(`\n✓ ${removed} entrée(s) retirées de l'index Git`);
