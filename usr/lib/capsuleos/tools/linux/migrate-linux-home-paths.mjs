#!/usr/bin/env node
/**
 * Met à jour les chemins legacy (kernel/, shared/) dans home/Debian|RedHat|SUSE/.
 * Usage : node usr/lib/capsuleos/tools/linux/migrate-linux-home-paths.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HOME_ROOTS = [
    path.join(ROOT, 'home/Debian'),
    path.join(ROOT, 'home/RedHat'),
    path.join(ROOT, 'home/SUSE')
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

    t = t.replaceAll('../../../../../../style/reset.css',
        '../../../../usr/share/capsuleos/themes/global/reset.css');
    t = t.replaceAll('../../../../../../style/variables.css',
        '../../../../usr/share/capsuleos/themes/global/variables.css');
    t = t.replaceAll('../../../../kernel/style/variables-linux.css',
        '../../../../usr/share/capsuleos/themes/linux/variables-linux.css');
    t = t.replaceAll('../../../kernel/style/variables-linux.css',
        '../../../../usr/share/capsuleos/themes/linux/variables-linux.css');

    t = t.replaceAll('../../../kernel/js/capsule-app-embed.js',
        '../../../var/lib/capsuleos/generated/capsule-app-embed.js');
    t = t.replaceAll('../../../kernel/js/', '../../../usr/lib/capsuleos/shells/linux/');
    t = t.replaceAll('../../../kernel/style/', '../../../usr/share/capsuleos/themes/linux/');

    t = t.replaceAll('../../../shared/apps/', '../../../usr/share/capsuleos/linux/apps/');
    t = t.replaceAll('../../../shared/content/', '../../../usr/share/capsuleos/linux/content/');
    t = t.replaceAll('../../../shared/media/', '../../../usr/share/capsuleos/linux/media/');

    t = t.replaceAll('../../../usr/lib/capsuleos/shells/linux/capsule-app-embed.js',
        '../../../var/lib/capsuleos/generated/capsule-app-embed.js');

    t = t.replaceAll('../../../../../usr/lib/capsuleos/common/',
        '../../../usr/lib/capsuleos/common/');
    t = t.replaceAll('../../../../../js/', '../../../usr/lib/capsuleos/site/');
    t = t.replaceAll('../../../../../assets/', '../../../usr/share/capsuleos/branding/');
    t = t.replaceAll('../../../../../index.html', '../../../index.html');

    t = t.replaceAll("window.CAPSULE_APPS_BASE = '../../../shared/apps'",
        "window.CAPSULE_APPS_BASE = '../../../usr/share/capsuleos/linux/apps'");
    t = t.replaceAll("window.CAPSULE_CONTENT_ROOT = '../../../shared/content/Dossier_personnel'",
        "window.CAPSULE_CONTENT_ROOT = '../../../usr/share/capsuleos/linux/content/Dossier_personnel'");
    t = t.replaceAll("window.CAPSULE_SITE_HOME = '../../../../../index.html'",
        "window.CAPSULE_SITE_HOME = '../../../index.html'");
    t = t.replaceAll("window.CAPSULE_LINUX_HUB = '../../../index.html'",
        "window.CAPSULE_LINUX_HUB = '../../../OS/linux/index.html'");

    return t;
}

function main() {
    let files = 0;
    let changed = 0;
    for (const homeRoot of HOME_ROOTS) {
        for (const file of walk(homeRoot)) {
            files += 1;
            const before = fs.readFileSync(file, 'utf8');
            const after = migrateText(before);
            if (after !== before) {
                fs.writeFileSync(file, after, 'utf8');
                changed += 1;
            }
        }
    }
    console.log(`home Linux skins: ${files} fichiers texte, ${changed} modifiés`);
}

main();
