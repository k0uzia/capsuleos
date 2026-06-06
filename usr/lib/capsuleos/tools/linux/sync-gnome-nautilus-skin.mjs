#!/usr/bin/env node
/**
 * Propage le skin Nautilus GNOME canonique (Rocky) vers Fedora/Ubuntu.
 * Usage : node usr/lib/capsuleos/tools/linux/sync-gnome-nautilus-skin.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const SOURCE = path.join(ROOT, 'home/RedHat/Rocky/style/apps/nautilus.skin.css');

const TARGETS = [
    {
        id: 'fedora',
        bodyId: 'fedora',
        out: path.join(ROOT, 'home/RedHat/Fedora/style/apps/nautilus.skin.css'),
        header: '/**\n * Fedora — Fichiers (Nautilus GNOME). Structure calquée sur Rocky (référence GNOME).\n */\n',
        dockWidthVar: '--fedora-dock-width',
        topBarVar: '--fedora-top-bar-height',
        tokenPatch: null
    },
    {
        id: 'ubuntu',
        bodyId: 'ubuntu',
        out: path.join(ROOT, 'home/Debian/Ubuntu/style/apps/nautilus.skin.css'),
        header: '/**\n * Ubuntu 25.10 — Fichiers (Nautilus GNOME). Structure calquée sur Rocky (référence GNOME).\n */\n',
        dockWidthVar: '--ubuntu-dock-width',
        topBarVar: '--ubuntu-top-bar-height',
        tokenPatch: (css) => css
            .replace('--nemo-accent: #3584e4;', '--nemo-accent: #E95420;')
            .replace('rgba(53, 132, 228, 0.16)', 'rgba(233, 84, 32, 0.16)')
            .replace('rgba(53, 132, 228, 0.14)', 'rgba(233, 84, 32, 0.14)')
            .replace('rgba(53, 132, 228, 0.12)', 'rgba(233, 84, 32, 0.12)')
    },
    {
        id: 'alma',
        bodyId: 'alma',
        out: path.join(ROOT, 'home/RedHat/Alma/style/apps/nautilus.skin.css'),
        header: '/**\n * AlmaLinux — Fichiers (Nautilus GNOME). Structure calquée sur Rocky (référence GNOME).\n */\n',
        dockWidthVar: '--fedora-dock-width',
        topBarVar: '--fedora-top-bar-height',
        tokenPatch: null
    },
    {
        id: 'anduinos',
        bodyId: 'anduinos',
        out: path.join(ROOT, 'home/Debian/AnduinOS/style/apps/nautilus.skin.css'),
        header: '/**\n * AnduinOS — Fichiers (Nautilus GNOME). Structure calquée sur Rocky (référence GNOME).\n */\n',
        dockWidthVar: null,
        topBarVar: '--anduin-taskbar-height',
        layoutPatch: (css) => css
            .replace(
                /width: calc\(100vw - var\(--fedora-dock-width\) - 0\.75rem\);/g,
                'width: min(61rem, calc(100vw - 2rem));'
            )
            .replace(
                /height: calc\(100vh - var\(--fedora-top-bar-height\) - 0\.5rem\);/g,
                'height: min(38.5rem, calc(100vh - var(--anduin-taskbar-height) - 2rem));'
            ),
        tokenPatch: null
    }
];

function buildForTarget(target, sourceText) {
    let css = sourceText
        .replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '')
        .replace(/body#rocky/g, `body#${target.bodyId}`)
        .replace(/html\[data-theme="light"\]:has\(#rocky\)/g, `html[data-theme="light"]:has(#${target.bodyId})`)
        .replace(/#rocky/g, `#${target.bodyId}`)
        .replace(/Rocky/g, target.id === 'fedora' ? 'Fedora' : 'Ubuntu');

    if (target.dockWidthVar && target.dockWidthVar !== '--fedora-dock-width') {
        css = css.replace(/var\(--fedora-dock-width\)/g, `var(${target.dockWidthVar})`);
    }
    if (target.topBarVar && target.topBarVar !== '--fedora-top-bar-height') {
        css = css.replace(/var\(--fedora-top-bar-height\)/g, `var(${target.topBarVar})`);
    }

    if (typeof target.layoutPatch === 'function') {
        css = target.layoutPatch(css);
    }
    if (typeof target.tokenPatch === 'function') {
        css = target.tokenPatch(css);
    }

    return `${target.header}${css.trim()}\n`;
}

if (!fs.existsSync(SOURCE)) {
    console.error(`Source introuvable: ${SOURCE}`);
    process.exit(1);
}

const sourceText = fs.readFileSync(SOURCE, 'utf8');

for (const target of TARGETS) {
    fs.writeFileSync(target.out, buildForTarget(target, sourceText), 'utf8');
    console.log(`Écrit ${path.relative(ROOT, target.out)}`);
}

console.log('✓ sync-gnome-nautilus-skin OK');
