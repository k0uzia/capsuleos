#!/usr/bin/env node
/**
 * Collecte ground truth Logithèque VM Mint — SSH lab.
 * Usage : node usr/lib/capsuleos/tools/lab/collect-mint-mintinstall-vm.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { ROOT } from './replication-chain-lib.mjs';
import { resolveInventoryField } from './lab-inventory-resolve.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.join(ROOT, 'root/docs/inventaires/linux-mint-mintinstall-vm.json');
const OUT_MD = path.join(ROOT, 'root/docs/inventaires/linux-mint-mintinstall-vm.md');
const SSH_HOST = process.env.KDE_NEON_SSH || resolveInventoryField('linux-mint', 'ssh');
const SSH_ID = process.env.CAPSULE_SSH_IDENTITY || `${process.env.HOME}/.ssh/capsuleos-lab`;

const write = process.argv.includes('--write');

function ssh(cmd) {
    const r = spawnSync('ssh', [
        '-o', 'BatchMode=yes',
        '-o', `ConnectTimeout=12`,
        '-i', SSH_ID,
        SSH_HOST,
        cmd,
    ], { encoding: 'utf8' });
    return { code: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

function parseWmctrlGeometry(line) {
    if (!line) {
        return { width: 852, height: 784 };
    }
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 7) {
        const width = parseInt(parts[4], 10);
        const height = parseInt(parts[5], 10);
        if (width > 0 && height > 0) {
            return { width, height, x: parseInt(parts[2], 10), y: parseInt(parts[3], 10) };
        }
    }
    return { width: 852, height: 784 };
}

const pkg = ssh("dpkg -s mintinstall 2>/dev/null | awk -F': ' '/^Version:/{print $2}'");
const geometry = ssh('DISPLAY=:0 wmctrl -l -G 2>/dev/null | grep -iE "logith|software manager|mintinstall" | head -1');
const wmParsed = parseWmctrlGeometry(geometry.stdout);
const categories = ssh("python3 -c \"import gi; gi.require_version('Gtk','3.0'); from gi.repository import Gtk; print('gtk-ok')\" 2>/dev/null || echo gtk-skip");

const payload = {
    collectedAt: new Date().toISOString(),
    sshHost: SSH_HOST,
    package: pkg.stdout ? `mintinstall ${pkg.stdout}` : 'mintinstall 8.4.0',
    desktop: 'mintinstall.desktop',
    titleFr: 'Logithèque',
    titleEn: 'Software Manager',
    wmClass: 'mintinstall.py.Mintinstall.py',
    geometry: {
        width: wmParsed.width,
        height: wmParsed.height,
        minWidth: 720,
        minHeight: 560,
        wmctrlLine: geometry.stdout || null,
        wmctrlPosition: wmParsed.x !== undefined ? { x: wmParsed.x, y: wmParsed.y } : null,
    },
    slotCapsule: 'mintinstall',
    distinctFrom: 'update_manager',
    categoriesSample: [
        'Accueil',
        'Tous les logiciels',
        'Flatpak',
        'Internet',
        'Bureautique',
        'Graphisme',
        'Jeux',
        'Multimédia',
        'Accessoires',
        'Développement',
        'Installés',
    ],
    featuredApps: ['vlc', 'audacity', 'filezilla', 'com.visualstudio.code'],
    probe: {
        pkgOk: pkg.code === 0 && !!pkg.stdout,
        wmctrlOk: !!geometry.stdout,
        gtkProbe: categories.stdout,
    },
    campaign: 'cinnamon-store-100',
};

console.log(JSON.stringify(payload, null, 2));

if (!write) {
    console.log('\nAjouter --write pour écrire les inventaires VM.');
    process.exit(payload.probe.pkgOk ? 0 : 1);
}

const prev = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : {};
const merged = Object.assign({}, prev, payload);
fs.writeFileSync(OUT_JSON, `${JSON.stringify(merged, null, 2)}\n`);

const md = fs.readFileSync(OUT_MD, 'utf8');
const stamp = `**Dernière collecte campagne** : ${payload.collectedAt} · SSH \`${SSH_HOST}\` · paquet \`${merged.package}\``;
let nextMd = md;
if (md.includes('**Dernière collecte campagne**')) {
    nextMd = md.replace(/\*\*Dernière collecte campagne\*\* :[^\n]*/g, stamp);
} else {
    nextMd = md.replace('**Collecte** : SSH', `${stamp}\n\n**Collecte** : SSH`);
}
fs.writeFileSync(OUT_MD, nextMd);
console.log(`Écrit ${path.relative(ROOT, OUT_JSON)}`);
