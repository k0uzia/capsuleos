#!/usr/bin/env node
/**
 * Inventaire branchement — section Discover « À découvrir » (linux-kde-neon).
 * Vérifie que chaque iconClass du catalogue magasin pointe vers un asset existant dans le dépôt.
 *
 * Usage :
 *   node root/tools/lab/inventory-kde-neon-discover-store-icons.mjs
 *   node root/tools/lab/inventory-kde-neon-discover-store-icons.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { buildStoreCatalogEntries } from '../../../usr/lib/capsuleos/tools/lab/capsule-app-resolver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-discover-store-icons.json');
const REGISTRY = 'linux-kde-neon';
const ASSET_BASE = 'usr/share/capsuleos/assets/images/toolkits/gnome/apps';

/** Branchement repo — aligné update_manager_gnome.base.css (pas de pull VM). */
/** Chemins avec extension (.svg / .png) — requis pour background-image HTTP (MIME correct). */
const ICON_BRANCH = {
    'gnome-software__cardicon--calendar': `${ASSET_BASE}/dash/org.gnome.Calendar.svg`,
    'gnome-software__cardicon--file-roller': `${ASSET_BASE}/org.gnome.FileRoller.svg`,
    'gnome-software__cardicon--libreoffice': `${ASSET_BASE}/overview/libreoffice-writer.svg`,
    'gnome-software__cardicon--thunderbird': `${ASSET_BASE}/thunderbird.png`,
    'gnome-software__cardicon--transmission': `${ASSET_BASE}/transmission-gtk.svg`,
    'gnome-software__cardicon--rhythmbox': `${ASSET_BASE}/org.gnome.Rhythmbox3.svg`,
    'gnome-software__cardicon--lecteur-multimedia': `${ASSET_BASE}/io.github.celluloid_player.Celluloid.svg`,
    'gnome-software__cardicon--drawing': `${ASSET_BASE}/com.github.maoschanz.drawing.svg`,
    'gnome-software__cardicon--simple-scan': `${ASSET_BASE}/simple-scan.svg`,
    'gnome-software__cardicon--warpinator': `${ASSET_BASE}/org.x.Warpinator.png`,
    'gnome-software__cardicon--timeshift': `${ASSET_BASE}/timeshift-gtk.png`,
};

const write = process.argv.includes('--write');

const entries = buildStoreCatalogEntries(REGISTRY);
const icons = [];
const missing = [];

for (const entry of entries) {
    const iconClass = entry.iconClass;
    const repoPath = ICON_BRANCH[iconClass];
    const abs = repoPath ? path.join(ROOT, repoPath) : null;
    const exists = abs ? fs.existsSync(abs) : false;
    let sha256 = null;
    let bytes = null;
    if (exists) {
        const buf = fs.readFileSync(abs);
        sha256 = createHash('sha256').update(buf).digest('hex');
        bytes = buf.length;
    }
    const row = {
        id: entry.id,
        title: entry.title,
        storeSlot: entry.storeSlot,
        iconClass,
        repoPath: repoPath || null,
        css: 'home/Debian/KDE-Neon/style/apps/discover-store-icons.skin.css',
        exists,
        sha256,
        bytes,
        campaign: 'branchement',
    };
    icons.push(row);
    if (!exists) {
        missing.push(row);
    }
}

const doc = {
    registryId: REGISTRY,
    surface: 'discover-store-a-decouvrir',
    sectionTitle: 'À découvrir',
    collectedAt: new Date().toISOString(),
    campaign: 'discover-store-icons-branchement-kde-neon',
    note: 'Assets partagés toolkit gnome/apps — déjà dans le dépôt, pas de pull VM',
    catalogEntries: entries.length,
    icons,
    missing,
    counts: {
        resolved: icons.filter((i) => i.exists).length,
        missing: missing.length,
    },
};

if (write) {
    fs.writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`  → ${path.relative(ROOT, OUT)}`);
}

console.log(`=== Inventaire À découvrir — ${REGISTRY} ===`);
console.log(`  apps magasin: ${entries.length} · assets trouvés: ${doc.counts.resolved} · manquants: ${doc.counts.missing}`);

if (missing.length) {
    for (const m of missing) {
        console.error(`  ✗ ${m.id} (${m.iconClass}) → ${m.repoPath || 'non mappé'}`);
    }
    process.exit(1);
}

for (const i of icons) {
    console.log(`  ✓ ${i.id} ← ${i.repoPath}`);
}

process.exit(0);
