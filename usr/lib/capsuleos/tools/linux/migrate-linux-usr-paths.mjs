#!/usr/bin/env node
/**
 * Met à jour les chemins shared/kernel dans usr/lib/shells/linux et usr/share/capsuleos/linux.
 * Usage : node usr/lib/capsuleos/tools/linux/migrate-linux-usr-paths.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const USR_ROOTS = [
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux'),
    path.join(ROOT, 'usr/share/capsuleos/linux'),
    path.join(ROOT, 'usr/share/capsuleos/themes/linux')
];

const TEXT_EXT = new Set(['.html', '.css', '.js', '.json', '.md', '.txt']);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            walk(full, out);
        } else if (TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
            out.push(full);
        }
    }
    return out;
}

function migrateText(text) {
    let t = text;

    t = t.replaceAll('../../../shared/content/', '../../../usr/share/capsuleos/linux/content/');
    t = t.replaceAll('../../../shared/apps/', '../../../usr/share/capsuleos/linux/apps/');
    t = t.replaceAll('../../../shared/media/', '../../../usr/share/capsuleos/linux/media/');

    t = t.replaceAll('../../../../../OS/linux/shared/apps/',
        '../../../usr/share/capsuleos/linux/apps/');
    t = t.replaceAll('OS/linux/shared/apps', 'usr/share/capsuleos/linux/apps');
    t = t.replaceAll('OS/linux/shared/content', 'usr/share/capsuleos/linux/content');
    t = t.replaceAll('OS/linux/kernel/js', 'usr/lib/capsuleos/shells/linux');
    t = t.replaceAll('OS/linux/families/debian/mint/index.html',
        'OS/linux/families/debian/mint/index.html');

    return t;
}

function main() {
    let files = 0;
    let changed = 0;
    for (const usrRoot of USR_ROOTS) {
        for (const file of walk(usrRoot)) {
            files += 1;
            const before = fs.readFileSync(file, 'utf8');
            const after = migrateText(before);
            if (after !== before) {
                fs.writeFileSync(file, after, 'utf8');
                changed += 1;
            }
        }
    }
    console.log(`usr Linux: ${files} fichiers texte, ${changed} modifiés`);
}

main();
