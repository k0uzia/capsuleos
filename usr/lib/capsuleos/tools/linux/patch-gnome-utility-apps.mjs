#!/usr/bin/env node
/**
 * Ajoute slots + scripts utilitaires GNOME aux skins Rocky/Fedora/Ubuntu/Alma/AnduinOS.
 * Usage : node usr/lib/capsuleos/tools/linux/patch-gnome-utility-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const SKINS = [
    'home/RedHat/Rocky',
    'home/RedHat/Fedora',
    'home/RedHat/Alma',
    'home/Debian/Ubuntu',
    'home/Debian/AnduinOS'
];

const SLOTS = [
    'calculator',
    'clocks',
    'calendar'
];

const SCRIPTS = [
    'text-editor.js',
    'calculator.js',
    'clocks.js',
    'calendar-app.js'
];

function patchIndex(rel) {
    const file = path.join(ROOT, rel, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const slot of SLOTS) {
        const marker = `data-link="${slot}"`;
        if (!html.includes(marker)) {
            const anchor = '<div class="windowElement" data-link="text_editor"';
            const insert = SLOTS.map((s) =>
                `                <div class="windowElement" data-link="${s}" id="${s}" style="display: none;"></div>`
            ).join('\n') + '\n';
            if (html.includes(anchor)) {
                html = html.replace(
                    /(<div class="windowElement" data-link="text_editor"[^>]*><\/div>\n)/,
                    `$1${insert}`
                );
                changed = true;
                break;
            }
        }
    }

    for (const slot of SLOTS) {
        if (!html.includes(`data-link="${slot}"`)) {
            console.warn(`${rel}: slot ${slot} manquant`);
        }
    }

    const scriptBlock = SCRIPTS.map((s) =>
        `    <script src="../../../usr/lib/capsuleos/shells/linux/${s}"></script>`
    ).join('\n');

    if (!html.includes('text-editor.js')) {
        html = html.replace(
            /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/linux\/librewriter\.js"><\/script>)/,
            `$1\n${scriptBlock}`
        );
        changed = true;
    }

    const overviewPatches = [
        ['aria-label="Horloges"', 'data-overview-link="clocks" aria-label="Horloges"'],
        ['aria-label="Calendrier">\n                <img src="../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/dash/org.gnome.Calendar.svg"',
            'data-overview-link="calendar" aria-label="Calendrier">\n                <img src="../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/dash/org.gnome.Calendar.svg"']
    ];
    for (const [from, to] of overviewPatches) {
        if (html.includes(from) && !html.includes(to.split(' ')[0])) {
            html = html.replace(from, to);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, html, 'utf8');
        console.log(`Patch ${rel}/index.html`);
    }
}

function patchOverview(rel) {
    const overviewPath = path.join(ROOT, rel, 'js/overview.js');
    if (!fs.existsSync(overviewPath)) {
        return;
    }
    let js = fs.readFileSync(overviewPath, 'utf8');
    let changed = false;

    if (js.includes("label: 'Calculatrice'") && !js.includes("dataLink: 'calculator'")) {
        js = js.replace(
            /label: 'Calculatrice',[\s\S]*?icon: '[^']+'\n(\s+)\}/,
            "label: 'Calculatrice',\n            aliases: ['calculator', 'calcul', 'maths'],\n            description: 'Effectuer des calculs',\n            icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.clocks.svg',\n            dataLink: 'calculator'\n        }"
        );
        changed = true;
    }
    if (!js.includes("dataLink: 'clocks'")) {
        js = js.replace(
            /label: 'Calendrier',[\s\S]*?icon: '[^']+'\n(\s+)\}/,
            "label: 'Calendrier',\n            aliases: ['calendar', 'agenda', 'date'],\n            description: 'Consulter le calendrier',\n            icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.Calendar.svg',\n            dataLink: 'calendar'\n        }"
        );
        js = js.replace(
            /label: 'Horloges'[\s\S]*?\n(\s+)\},/,
            "label: 'Horloges',\n            aliases: ['clocks', 'world clock', 'fuseau'],\n            description: 'Horloges mondiales',\n            icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.clocks.svg',\n            dataLink: 'clocks'\n        },"
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(overviewPath, js, 'utf8');
        console.log(`Patch ${rel}/js/overview.js`);
    }
}

for (const skin of SKINS) {
    patchIndex(skin);
    patchOverview(skin);
}
console.log('✓ patch-gnome-utility-apps OK');
