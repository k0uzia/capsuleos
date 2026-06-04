#!/usr/bin/env node
/**
 * Génère OS/linux/families/.../index.html (facades avec <base>).
 * Usage : node usr/lib/capsuleos/tools/linux/build-linux-facades.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** facade path (sous OS/linux/families) → home canonique */
const SKINS = [
    { facade: 'families/debian/mint', home: 'home/Debian/Mint' },
    { facade: 'families/debian/ubuntu', home: 'home/Debian/Ubuntu' },
    { facade: 'families/debian/popos', home: 'home/Debian/PopOS' },
    { facade: 'families/debian/mx-kde', home: 'home/Debian/MX-KDE' },
    { facade: 'families/debian/debian-kde', home: 'home/Debian/Debian-KDE' },
    { facade: 'families/debian/anduinos', home: 'home/Debian/AnduinOS' },
    { facade: 'families/redhat/fedora', home: 'home/RedHat/Fedora' },
    { facade: 'families/suse/opensuse', home: 'home/SUSE/openSUSE' }
];

const BASE_HREF = '../../../../../';

function buildFacade(homeRel, canonicalHtml, pickOsPath) {
    const baseLine = `    <base href="${BASE_HREF}${homeRel}/">`;
    const comment = `    <!-- Facade URL stable : pick-os.js → ./OS/linux/${pickOsPath}/index.html -->`;

    if (canonicalHtml.includes('<base href=')) {
        return canonicalHtml;
    }

    const headMatch = canonicalHtml.match(/<head[^>]*>/i);
    if (!headMatch) {
        throw new Error(`Pas de <head> dans ${homeRel}/index.html`);
    }
    const insertAt = headMatch.index + headMatch[0].length;
    return (
        canonicalHtml.slice(0, insertAt) +
        '\n' + comment + '\n' + baseLine +
        canonicalHtml.slice(insertAt)
    );
}

function main() {
    for (const { facade, home } of SKINS) {
        const canonicalPath = path.join(ROOT, home, 'index.html');
        const facadePath = path.join(ROOT, 'OS/linux', facade, 'index.html');
        const canonical = fs.readFileSync(canonicalPath, 'utf8');
        const facadeHtml = buildFacade(home, canonical, facade);
        fs.mkdirSync(path.dirname(facadePath), { recursive: true });
        fs.writeFileSync(facadePath, facadeHtml, 'utf8');
        console.log(`Facade: OS/linux/${facade}/index.html → ${home}/`);
    }
}

main();
