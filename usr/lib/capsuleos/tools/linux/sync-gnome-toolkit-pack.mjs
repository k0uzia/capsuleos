#!/usr/bin/env node
/**
 * Orchestrateur sync toolkit GNOME — lit pack.json et exécute toutes les pipelines.
 * Usage : node usr/lib/capsuleos/tools/linux/sync-gnome-toolkit-pack.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadGnomePack, ROOT, syncGenericAppSkins } from './gnome-pack-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pack = loadGnomePack(ROOT);
const pipelines = pack.sync?.pipelines || [];

console.log(`sync-gnome-toolkit-pack — ${pack.label} (${pipelines.length} pipeline(s))`);

let failed = false;

for (const pipeline of pipelines) {
    console.log(`\n── ${pipeline.id} ──`);
    if (pipeline.type === 'script') {
        const scriptPath = path.join(ROOT, pipeline.path);
        const r = spawnSync(process.execPath, [scriptPath], { cwd: ROOT, stdio: 'inherit' });
        if (r.status !== 0) {
            failed = true;
        }
        continue;
    }
    if (pipeline.type === 'app-skins') {
        try {
            const written = syncGenericAppSkins(ROOT, { pack });
            written.forEach((rel) => console.log(`Écrit ${rel}`));
        } catch (err) {
            console.error(err.message);
            failed = true;
        }
        continue;
    }
    console.error(`Pipeline inconnue : ${pipeline.id} (type=${pipeline.type})`);
    failed = true;
}

if (failed) {
    console.error('\n✗ sync-gnome-toolkit-pack — échec');
    process.exit(1);
}

console.log('\n✓ sync-gnome-toolkit-pack OK');
