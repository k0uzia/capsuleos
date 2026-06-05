#!/usr/bin/env node
/**
 * Propage text_editor, calculator, clocks, calendar skins Rocky → dérivés GNOME.
 * Usage : node usr/lib/capsuleos/tools/linux/sync-gnome-utility-app-skins.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const APPS = ['text_editor', 'calculator', 'clocks', 'calendar'];

const TARGETS = [
    { id: 'fedora', bodyId: 'fedora', home: 'home/RedHat/Fedora' },
    { id: 'ubuntu', bodyId: 'ubuntu', home: 'home/Debian/Ubuntu' },
    { id: 'alma', bodyId: 'alma', home: 'home/RedHat/Alma' },
    { id: 'anduinos', bodyId: 'anduinos', home: 'home/Debian/AnduinOS' }
];

for (const app of APPS) {
    const source = path.join(ROOT, 'home/RedHat/Rocky/style/apps', `${app}.skin.css`);
    if (!fs.existsSync(source)) {
        console.error(`Source introuvable: ${source}`);
        process.exit(1);
    }
    const sourceText = fs.readFileSync(source, 'utf8');
    for (const target of TARGETS) {
        let css = sourceText
            .replace(/body#rocky/g, `body#${target.bodyId}`)
            .replace(/html\[data-theme="light"\] body#rocky/g, `html[data-theme="light"] body#${target.bodyId}`);
        if (target.id === 'ubuntu') {
            css = css.replace(/var\(--fedora-top-bar-height/g, 'var(--ubuntu-top-bar-height');
        }
        const header = `/**\n * ${target.id} — ${app} (structure Rocky).\n */\n`;
        const out = path.join(ROOT, target.home, 'style/apps', `${app}.skin.css`);
        fs.writeFileSync(out, header + css.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '').trim() + '\n', 'utf8');
        console.log(`Écrit ${path.relative(ROOT, out)}`);
    }
}
console.log('✓ sync-gnome-utility-app-skins OK');
