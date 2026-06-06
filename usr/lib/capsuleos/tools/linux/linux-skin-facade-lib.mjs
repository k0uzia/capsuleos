/**
 * Façades pick-os Linux : copie canonique home/ + <base href>.
 * Partagé par build-linux-facades.mjs et validate-linux-facades.mjs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

/** facade path (sous OS/linux/families) → home canonique */
export const LINUX_SKIN_FACADES = [
    { facade: 'families/debian/mint', home: 'home/Debian/Mint' },
    { facade: 'families/debian/ubuntu', home: 'home/Debian/Ubuntu' },
    { facade: 'families/debian/popos', home: 'home/Debian/PopOS' },
    { facade: 'families/debian/mx-kde', home: 'home/Debian/MX-KDE' },
    { facade: 'families/debian/debian-kde', home: 'home/Debian/Debian-KDE' },
    { facade: 'families/debian/kde-neon', home: 'home/Debian/KDE-Neon' },
    { facade: 'families/debian/anduinos', home: 'home/Debian/AnduinOS' },
    { facade: 'families/redhat/fedora', home: 'home/RedHat/Fedora' },
    { facade: 'families/redhat/rocky', home: 'home/RedHat/Rocky' },
    { facade: 'families/redhat/alma', home: 'home/RedHat/Alma' },
    { facade: 'families/suse/opensuse', home: 'home/SUSE/openSUSE' }
];

export const BASE_HREF = '../../../../../';

/** Le skin home/ ne doit pas conserver de <base> ; la façade l’injecte à chaque build. */
export function stripBaseTag(html) {
    return html.replace(/\s*<!--\s*Facade URL stable[\s\S]*?-->\s*/gi, '')
        .replace(/\s*<base\s+href="[^"]*"\s*\/?>\s*/gi, '');
}

export function buildFacadeHtml(homeRel, canonicalHtml, pickOsPath) {
    const baseLine = `    <base href="${BASE_HREF}${homeRel}/">`;
    const comment = `    <!-- Facade URL stable : pick-os.js → ./OS/linux/${pickOsPath}/index.html -->`;
    const body = stripBaseTag(canonicalHtml);

    const headMatch = body.match(/<head[^>]*>/i);
    if (!headMatch) {
        throw new Error(`Pas de <head> dans ${homeRel}/index.html`);
    }
    const insertAt = headMatch.index + headMatch[0].length;
    return (
        body.slice(0, insertAt) +
        '\n' + comment + '\n' + baseLine +
        body.slice(insertAt)
    );
}

export function expectedFacadePath(facadeRel) {
    return path.join(ROOT, 'OS/linux', facadeRel, 'index.html');
}

export function readCanonicalSkinIndex(homeRel) {
    const canonicalPath = path.join(ROOT, homeRel, 'index.html');
    if (!fs.existsSync(canonicalPath)) {
        throw new Error(`Skin canonique introuvable: ${homeRel}/index.html`);
    }
    return fs.readFileSync(canonicalPath, 'utf8');
}

export function validateLinuxFacadesSync() {
    const errors = [];
    LINUX_SKIN_FACADES.forEach(({ facade, home }) => {
        const facadePath = expectedFacadePath(facade);
        let canonical;
        try {
            canonical = readCanonicalSkinIndex(home);
        } catch (e) {
            errors.push(e.message);
            return;
        }
        const expected = buildFacadeHtml(home, canonical, facade);
        if (!fs.existsSync(facadePath)) {
            errors.push(`Façade manquante: OS/linux/${facade}/index.html (attendu depuis ${home}/)`);
            return;
        }
        const onDisk = fs.readFileSync(facadePath, 'utf8');
        if (onDisk !== expected) {
            errors.push(
                `Façade désynchronisée: OS/linux/${facade}/index.html ≠ ${home}/index.html — ` +
                'lancer node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs'
            );
        }
        const skinHtml = fs.readFileSync(path.join(ROOT, home, 'index.html'), 'utf8');
        if (/<base\s+href=/i.test(skinHtml)) {
            errors.push(`${home}/index.html ne doit pas contenir <base> (réservé à la façade pick-os)`);
        }
    });
    return errors;
}
