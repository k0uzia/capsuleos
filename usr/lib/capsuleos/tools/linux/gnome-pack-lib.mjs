/**
 * Bibliothèque partagée — manifeste toolkit GNOME (pack.json).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');
export const PACK_REL = 'usr/share/capsuleos/themes/clusters/toolkit-gnome/pack.json';

export function getPackPath(root = ROOT) {
    return path.join(root, PACK_REL);
}

export function loadGnomePack(root = ROOT) {
    const packPath = getPackPath(root);
    if (!fs.existsSync(packPath)) {
        throw new Error(`pack GNOME introuvable : ${PACK_REL}`);
    }
    return JSON.parse(fs.readFileSync(packPath, 'utf8'));
}

export function getSyncTargets(pack) {
    return pack.sync?.targets || [];
}

export function listGenericAppSkinSlots(pack) {
    const slots = new Set();
    for (const pipeline of pack.sync?.pipelines || []) {
        if (pipeline.type === 'app-skins' && Array.isArray(pipeline.slots)) {
            pipeline.slots.forEach((slot) => slots.add(slot));
        }
        if (pipeline.id === 'utility-apps' && Array.isArray(pipeline.slots)) {
            pipeline.slots.forEach((slot) => slots.add(slot));
        }
    }
    return [...slots];
}

const UBUNTU_ACCENT_PATCHES = [
    ['--nemo-accent: #3584e4;', '--nemo-accent: #E95420;'],
    ['rgba(53, 132, 228, 0.16)', 'rgba(233, 84, 32, 0.16)'],
    ['rgba(53, 132, 228, 0.14)', 'rgba(233, 84, 32, 0.14)'],
    ['rgba(53, 132, 228, 0.12)', 'rgba(233, 84, 32, 0.12)'],
];

export function stripLeadingComment(css) {
    return css.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '').trim();
}

export function transformRockyAppSkin(sourceText, target, { accentPatch = false } = {}) {
    let css = stripLeadingComment(sourceText)
        .replace(/body#rocky/g, `body#${target.bodyId}`)
        .replace(/html\[data-theme="light"\]:has\(#rocky\)/g, `html[data-theme="light"]:has(#${target.bodyId})`)
        .replace(/html\[data-theme="light"\] body#rocky/g, `html[data-theme="light"] body#${target.bodyId}`)
        .replace(/#rocky/g, `#${target.bodyId}`);

    if (target.bodyId === 'ubuntu') {
        css = css.replace(/var\(--fedora-top-bar-height/g, 'var(--ubuntu-top-bar-height');
        css = css.replace(/var\(--fedora-dock-width/g, 'var(--ubuntu-dock-width');
        if (accentPatch) {
            for (const [from, to] of UBUNTU_ACCENT_PATCHES) {
                css = css.split(from).join(to);
            }
        }
    }

    return css.trim();
}

export function buildAppSkinForTarget(sourceText, target, slotId) {
    const accentPatch = slotId === 'firefox' || slotId === 'nautilus';
    const header = `/**\n * ${target.id} — ${slotId} (structure Rocky).\n */\n`;
    return `${header}${transformRockyAppSkin(sourceText, target, { accentPatch })}\n`;
}

export function rockyAppSkinPath(root, pack, slotId) {
    return path.join(root, pack.sync.canonicalSkinRoot, 'style/apps', `${slotId}.skin.css`);
}

export function targetAppSkinPath(root, target, slotId) {
    return path.join(root, target.skinRoot, 'style/apps', `${slotId}.skin.css`);
}

export function syncGenericAppSkins(root = ROOT, { pack = loadGnomePack(root), dryRun = false } = {}) {
    const pipeline = pack.sync.pipelines.find((p) => p.type === 'app-skins');
    if (!pipeline) {
        return [];
    }
    const written = [];
    for (const slotId of pipeline.slots) {
        const sourcePath = rockyAppSkinPath(root, pack, slotId);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source Rocky introuvable : ${path.relative(root, sourcePath)}`);
        }
        const sourceText = fs.readFileSync(sourcePath, 'utf8');
        for (const target of getSyncTargets(pack)) {
            const out = targetAppSkinPath(root, target, slotId);
            const content = buildAppSkinForTarget(sourceText, target, slotId);
            if (!dryRun) {
                fs.mkdirSync(path.dirname(out), { recursive: true });
                fs.writeFileSync(out, content, 'utf8');
            }
            written.push(path.relative(root, out));
        }
    }
    return written;
}

export function normalizeCssForCompare(css) {
    return stripLeadingComment(css).replace(/\s+/g, ' ').trim();
}
