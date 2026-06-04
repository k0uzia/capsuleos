#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-skin-profiles.js depuis etc/capsuleos/profiles/*.json
 * Usage : node usr/lib/capsuleos/tools/build-skin-profiles.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-skin-profiles.js');

const byBodyId = {};
const byRegistryId = {};

if (fs.existsSync(PROFILES_DIR)) {
  for (const file of fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'))) {
    const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
    const registryId = profile.id || file.replace('.json', '');
    byRegistryId[registryId] = profile;
    if (profile.bodyId) {
      byBodyId[profile.bodyId] = profile;
    }
  }
}

const banner = `/**
 * Profils skin CapsuleOS (généré).
 * Source : etc/capsuleos/profiles/*.json
 * Regénérer : node usr/lib/capsuleos/tools/build-skin-profiles.mjs
 */
`;

const out = `${banner}window.CAPSULE_SKIN_PROFILES = ${JSON.stringify(byBodyId, null, 2)};
window.CAPSULE_SKIN_PROFILES_BY_ID = ${JSON.stringify(byRegistryId, null, 2)};
`;

fs.writeFileSync(OUT, out, 'utf8');
console.log(`Écrit ${OUT} — ${Object.keys(byRegistryId).length} profils`);

const sync = path.join(__dirname, 'sync-capsule-resource.mjs');
spawnSync(process.execPath, [sync], { stdio: 'inherit', cwd: ROOT });
