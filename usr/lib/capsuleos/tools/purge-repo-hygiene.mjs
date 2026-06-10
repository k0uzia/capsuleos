#!/usr/bin/env node
/**
 * Purge ciblée — legacy, captures virsh dupliquées, arborescences vides.
 * Usage : node usr/lib/capsuleos/tools/purge-repo-hygiene.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { purgeLinuxFacadeOrphans } from './linux/linux-skin-facade-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const dryRun = process.argv.includes('--dry-run');

const LEGACY_PATHS = [
    'usr/lib/capsuleos/tools/build-capsule-embed.mjs',
    'OS/linux/kernel/js/capsule-app-embed.js',
    'root/docs/toolkit-cloisonnement-audit.md',
    'OS/linux/shared/apps',
    'OS/linux/shared/content',
];

const APPS_VISUAL = path.join(ROOT, 'root/docs/inventaires/captures/linux-rocky/apps-visual');
const INVESTIGATION = path.join(ROOT, 'root/docs/inventaires/linux-rocky-apps-visual-investigation.json');

const removed = [];

function rm(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        return;
    }
    if (dryRun) {
        console.log(`[dry-run] supprimer ${rel}`);
        removed.push(rel);
        return;
    }
    fs.rmSync(abs, { force: true, recursive: true });
    removed.push(rel);
    console.log(`Supprimé ${rel}`);
}

function md5File(filePath) {
    return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

function rmEmptyDirs(dir) {
    if (!fs.existsSync(dir)) {
        return;
    }
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.isDirectory()) {
            rmEmptyDirs(path.join(dir, ent.name));
        }
    }
    if (fs.readdirSync(dir).length === 0) {
        const rel = path.relative(ROOT, dir);
        rm(rel);
    }
}

for (const rel of LEGACY_PATHS) {
    rm(rel);
}

const facadeOrphans = purgeLinuxFacadeOrphans({ dryRun });
if (facadeOrphans.length) {
    console.log(`Façades pick-os — ${facadeOrphans.length} orphelin(s)${dryRun ? ' (dry-run)' : ''}`);
    facadeOrphans.slice(0, 8).forEach((rel) => console.log(`  ${dryRun ? '[dry-run] ' : ''}${rel}`));
    if (facadeOrphans.length > 8) {
        console.log(`  … +${facadeOrphans.length - 8} autre(s)`);
    }
    removed.push(...facadeOrphans);
}

if (fs.existsSync(APPS_VISUAL)) {
    rmEmptyDirs(path.join(APPS_VISUAL, 'capsuleos-apps-visual'));

    for (const ent of fs.readdirSync(APPS_VISUAL, { withFileTypes: true })) {
        if (!ent.isDirectory() || ent.name === 'capsuleos-apps-visual') {
            continue;
        }
        const appId = ent.name;
        const defaultVm = path.join(APPS_VISUAL, `${appId}-vm.png`);
        if (!fs.existsSync(defaultVm)) {
            continue;
        }
        const defaultHash = md5File(defaultVm);
        const subDir = path.join(APPS_VISUAL, appId);
        for (const shot of fs.readdirSync(subDir).filter((n) => n.endsWith('.png'))) {
            const shotPath = path.join(subDir, shot);
            if (md5File(shotPath) === defaultHash) {
                rm(path.relative(ROOT, shotPath));
            }
        }
        if (fs.existsSync(subDir) && fs.readdirSync(subDir).length === 0) {
            rm(path.relative(ROOT, subDir));
        }
    }
}

if (fs.existsSync(INVESTIGATION) && removed.some((r) => r.includes('apps-visual/'))) {
    let inv = fs.readFileSync(INVESTIGATION, 'utf8');
    const purgedShots = removed.filter((r) => r.endsWith('.png') && r.includes('/apps-visual/'));
    for (const rel of purgedShots) {
        const appMatch = rel.match(/apps-visual\/([^/]+)\//);
        const defaultVm = appMatch
            ? `root/docs/inventaires/captures/linux-rocky/apps-visual/${appMatch[1]}-vm.png`
            : null;
        if (defaultVm) {
            inv = inv.split(rel).join(defaultVm);
        }
    }
    inv = inv.replace(
        /"note": "dérivé capture VM default \(virsh ou gnome-screenshot\)"/g,
        '"note": "placeholder virsh bureau — shot distinct purgé ; recapture gtk-launch requise"'
    );
    if (!dryRun) {
        fs.writeFileSync(INVESTIGATION, inv, 'utf8');
        console.log('Mis à jour linux-rocky-apps-visual-investigation.json');
    }
}

if (fs.existsSync(path.join(ROOT, 'OS/linux/shared/DEPRECATED.md'))) {
    const dep = `Ce répertoire est déprécié.

Les gabarits apps et contenus Linux canoniques sont sous :

- \`usr/share/capsuleos/linux/apps/\`
- \`usr/share/capsuleos/linux/content/\`
- \`usr/share/capsuleos/linux/explorers/\`

L'embed offline est généré par :

\`node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs\`

→ \`var/lib/capsuleos/generated/capsule-app-embed.js\`

Purge legacy : \`node usr/lib/capsuleos/tools/purge-repo-hygiene.mjs\`
`;
    if (!dryRun) {
        fs.writeFileSync(path.join(ROOT, 'OS/linux/shared/DEPRECATED.md'), dep, 'utf8');
    }
}

const procLink = path.join(ROOT, 'root/docs/processus-branchement-noyau.md');
if (fs.existsSync(procLink)) {
    let text = fs.readFileSync(procLink, 'utf8');
    const fixed = text.replace(
        /\[toolkit-cloisonnement-audit\.md\]\(toolkit-cloisonnement-audit\.md\)/g,
        '[inventaires/toolkit-cloisonnement-audit.md](inventaires/toolkit-cloisonnement-audit.md)'
    );
    if (fixed !== text && !dryRun) {
        fs.writeFileSync(procLink, fixed, 'utf8');
        console.log('Corrigé lien toolkit-cloisonnement-audit dans processus-branchement-noyau.md');
    }
}

console.log(`\n✓ purge-repo-hygiene — ${removed.length} élément(s)${dryRun ? ' (dry-run)' : ''}`);
