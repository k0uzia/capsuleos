#!/usr/bin/env node
/**
 * Smoke statique Mint — épingles panel Phase 1 (xed, logithèque, médias).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-mint-panel-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        errors.push(`Fichier manquant: ${rel}`);
        return '';
    }
    return fs.readFileSync(abs, 'utf8');
}

const indexHtml = read('home/Debian/Mint/index.html');
const parityJs = read('home/Debian/Mint/content/mint-menu-parity.js');

const panelSection = indexHtml.match(/<footer id="tableau">[\s\S]*?<\/footer>/)?.[0] || '';
if (!panelSection) {
    errors.push('index.html : footer#tableau manquant');
}
['text_editor', 'update_manager', 'lecteur_multimedia', 'visionneur_images', 'visionneur_pdf'].forEach((link) => {
    if (!panelSection.includes(`data-link="${link}"`)) {
        errors.push(`index.html : épinglage panel ${link} manquant`);
    }
});

if (!parityJs.includes("dataLink: 'text_editor'") || !parityJs.includes("dataLink: 'update_manager'")) {
    errors.push('mint-menu-parity.js : menu xed / logithèque non branchés');
}

if (errors.length) {
    console.error('smoke-mint-panel-apps — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ smoke-mint-panel-apps OK');
