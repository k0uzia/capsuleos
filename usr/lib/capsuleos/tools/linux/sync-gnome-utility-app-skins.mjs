#!/usr/bin/env node
/**
 * Propage text_editor, calculator, clocks, calendar skins Rocky → dérivés GNOME.
 * Usage : node usr/lib/capsuleos/tools/linux/sync-gnome-utility-app-skins.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    ROOT,
    loadGnomePack,
    getSyncTargets,
    rockyAppSkinPath,
    targetAppSkinPath,
    buildAppSkinForTarget,
} from './gnome-pack-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pack = loadGnomePack(ROOT);
const pipeline = pack.sync.pipelines.find((p) => p.id === 'utility-apps');
const APPS = pipeline?.slots || [];

for (const app of APPS) {
    const source = rockyAppSkinPath(ROOT, pack, app);
    if (!fs.existsSync(source)) {
        console.error(`Source introuvable: ${source}`);
        process.exit(1);
    }
    const sourceText = fs.readFileSync(source, 'utf8');
    for (const target of getSyncTargets(pack)) {
        const out = targetAppSkinPath(ROOT, target, app);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, buildAppSkinForTarget(sourceText, target, app), 'utf8');
        console.log(`Écrit ${path.relative(ROOT, out)}`);
    }
}
console.log('✓ sync-gnome-utility-app-skins OK');
