/**
 * Façades pick-os Linux : copie canonique home/ + <base href>.
 * Partagé par build-linux-facades.mjs et validate-linux-facades.mjs.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const contentHashCache = new Map();

function fileContentVersion(absPath) {
    if (contentHashCache.has(absPath)) {
        return contentHashCache.get(absPath);
    }
    let version = null;
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
        version = crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex').slice(0, 10);
    }
    contentHashCache.set(absPath, version);
    return version;
}

/**
 * Cache busting unifié : remplace les `?v=` manuels des scripts/CSS locaux par
 * un hash de contenu généré — la façade n'expose jamais de version périmée.
 */
export function injectContentVersions(html, homeRel) {
    return html.replace(
        /(<(?:script[^>]+src|link[^>]+href)=")([^"?]+\.(?:js|css))(?:\?v=[^"]*)?(")/g,
        (full, before, url, after) => {
            if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:')) {
                return full;
            }
            const abs = path.resolve(ROOT, homeRel, url.split('#')[0]);
            const version = fileContentVersion(abs);
            if (!version) {
                return full;
            }
            return `${before}${url}?v=${version}${after}`;
        },
    );
}

export function buildFacadeHtml(homeRel, canonicalHtml, pickOsPath) {
    const baseLine = `    <base href="${BASE_HREF}${homeRel}/">`;
    const comment = `    <!-- Facade URL stable : pick-os.js → ./OS/linux/${pickOsPath}/index.html -->`;
    const body = injectContentVersions(stripBaseTag(canonicalHtml), homeRel);

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

/** Seul index.html est autorisé sous OS/linux/families/<facade>/ (base → home/). */
export const FACADE_ALLOWED_RELATIVE = new Set(['index.html']);

export function listLinuxFacadeOrphans() {
    const orphans = [];
    for (const { facade } of LINUX_SKIN_FACADES) {
        const facadeRoot = path.join(ROOT, 'OS/linux', facade);
        if (!fs.existsSync(facadeRoot)) {
            continue;
        }
        const walk = (dir) => {
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                const abs = path.join(dir, ent.name);
                if (ent.isDirectory()) {
                    walk(abs);
                    continue;
                }
                const rel = path.relative(facadeRoot, abs).replace(/\\/g, '/');
                if (!FACADE_ALLOWED_RELATIVE.has(rel)) {
                    orphans.push(`OS/linux/${facade}/${rel}`);
                }
            }
        };
        walk(facadeRoot);
    }
    return orphans.sort();
}

export function validateLinuxFacadeOrphans() {
    return listLinuxFacadeOrphans().map(
        (rel) => `Fichier orphelin sous façade pick-os (supprimer ou migrer vers home/) : ${rel}`
    );
}

export function purgeLinuxFacadeOrphans({ dryRun = false } = {}) {
    const removed = [];
    for (const rel of listLinuxFacadeOrphans()) {
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) {
            continue;
        }
        if (dryRun) {
            removed.push(rel);
            continue;
        }
        fs.rmSync(abs, { force: true });
        removed.push(rel);
    }
    if (!dryRun) {
        for (const { facade } of LINUX_SKIN_FACADES) {
            const facadeRoot = path.join(ROOT, 'OS/linux', facade);
            if (!fs.existsSync(facadeRoot)) {
                continue;
            }
            const pruneEmpty = (dir) => {
                for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                    if (ent.isDirectory()) {
                        pruneEmpty(path.join(dir, ent.name));
                    }
                }
                if (dir !== facadeRoot && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
                    fs.rmdirSync(dir);
                }
            };
            pruneEmpty(facadeRoot);
        }
    }
    return removed;
}
