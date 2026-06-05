#!/usr/bin/env node
/**
 * Propage gnome-workstation.css depuis Rocky vers Fedora/Ubuntu (tokens vendor conservés).
 * Usage : node usr/lib/capsuleos/tools/linux/sync-gnome-workstation-skin.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const SOURCE = path.join(ROOT, 'home/RedHat/Rocky/style/gnome-workstation.css');

const TARGETS = [
    {
        id: 'fedora',
        bodyId: 'fedora',
        out: path.join(ROOT, 'home/RedHat/Fedora/style/gnome-workstation.css'),
        header: '/**\n * Fedora Workstation — coque GNOME (structure Rocky).\n */\n',
        rootBlock: `#${'fedora'} {
    --linux-skin-label: "Fedora Linux";
    --fedora-dock-gap: calc(var(--head) / 11);
    --fedora-dock-item: calc(var(--head) * 1.02);
    --fedora-bg: linear-gradient(155deg, #2b4a7a 0%, #1e3d66 32%, #122a4a 58%, #0a1628 100%);
    --gnome-shell-taskbar-bg: var(--fedora-top-bar-bg);`,
        dockDisplay: 'none',
        lightThemeBg: null
    },
    {
        id: 'alma',
        bodyId: 'alma',
        out: path.join(ROOT, 'home/RedHat/Alma/style/gnome-workstation.css'),
        header: '/**\n * AlmaLinux — coque GNOME (structure Rocky).\n */\n',
        rootBlock: `#${'alma'} {
    --linux-skin-label: "AlmaLinux";
    --fedora-dock-gap: calc(var(--head) / 11);
    --fedora-dock-item: calc(var(--head) * 1.02);
    --fedora-bg: linear-gradient(155deg, #1a4d6e 0%, #0f3d52 32%, #0a2a3a 58%, #051820 100%);
    --gnome-shell-taskbar-bg: var(--fedora-top-bar-bg);`,
        dockDisplay: 'none',
        lightThemeBg: null
    },
    {
        id: 'ubuntu',
        bodyId: 'ubuntu',
        out: path.join(ROOT, 'home/Debian/Ubuntu/style/gnome-workstation.css'),
        header: '/**\n * Ubuntu 25.10 — coque GNOME (structure Rocky, dock Unity).\n */\n',
        rootBlock: `#${'ubuntu'} {
    --linux-skin-label: "Ubuntu 25.10";
    --ubuntu-dock-gap: calc(var(--head) / 11);
    --ubuntu-dock-item: calc(var(--head) * 1.02);
    --ubuntu-bg: url(../../../../usr/share/capsuleos/assets/images/vendors/ubuntu/wallpaper/wallpaper-racoon.png) center/cover no-repeat;
    --gnome-shell-taskbar-bg: var(--ubuntu-top-bar-bg);`,
        dockDisplay: 'flex',
        lightThemeBg: null,
        varMap: [
            ['--fedora-dock-', '--ubuntu-dock-'],
            ['--fedora-top-bar-', '--ubuntu-top-bar-'],
            ['var(--fedora-dock-width)', 'var(--ubuntu-dock-width)'],
            ['var(--fedora-top-bar-height)', 'var(--ubuntu-top-bar-height)'],
            ['var(--fedora-bg)', 'var(--ubuntu-bg)'],
            ['var(--fedora-shell-text)', 'var(--ubuntu-shell-text)'],
            ['var(--fedora-shell-border-soft)', 'var(--ubuntu-shell-border-soft)'],
            ['var(--fedora-dock-border-right)', 'var(--ubuntu-dock-border-right)'],
            ['var(--fedora-dock-bg)', 'var(--ubuntu-dock-bg)']
        ]
    }
];

function buildForTarget(target, sourceText) {
    let css = sourceText
        .replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '')
        .replace(/#rocky/g, `#${target.bodyId}`)
        .replace(/html\[data-theme="light"\]:has\(#rocky\)/g, `html[data-theme="light"]:has(#${target.bodyId})`);

    if (target.varMap) {
        for (const [from, to] of target.varMap) {
            css = css.split(from).join(to);
        }
    }

    if (target.rootBlock) {
        css = css.replace(/#[a-z]+ \{[\s\S]*?--mint-taskbar-bg:[^;]+;/m, target.rootBlock);
    }

    if (target.dockDisplay) {
        css = css.replace(
            /#([a-z]+) #tableau\.fedora-dock \{\n\s*display: none;/m,
            `#$1 #tableau.fedora-dock {\n    display: ${target.dockDisplay};`
        );
    }

    if (target.id === 'ubuntu') {
        css = css.replace('--mint-taskbar-bg: var(--ubuntu-top-bar-height);', '--mint-taskbar-bg: var(--ubuntu-top-bar-bg);');
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
console.log('✓ sync-gnome-workstation-skin OK');
