#!/usr/bin/env node
/**
 * Génère home/Debian/KDE-Neon/content/mainMenu-data.js depuis l'inventaire VM.
 * Source : root/docs/inventaires/linux-kde-neon-kickoff-apps.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-kickoff-apps.json');
const DEST = path.join(ROOT, 'home/Debian/KDE-Neon/content/mainMenu-data.js');
const KICKOFF_BASE = './assets/images/vendors/neon/kickoff/';
const PANEL_BASE = './assets/images/vendors/neon/panel/';

const EXEC_LINK = {
    firefox: 'firefox',
    dolphin: 'nemo',
    'plasma-discover': 'update_manager',
    systemsettings: 'themes',
    konsole: 'terminal',
    gwenview: 'visionneur_images',
    okular: 'visionneur_pdf',
    vlc: 'lecteur_multimedia',
    '/usr/bin/vlc': 'lecteur_multimedia',
};

const PANEL_ICON = {
    firefox: 'firefox.png',
    'org.kde.dolphin': 'dolphin.svg',
    plasmadiscover: 'discover.svg',
    'utilities-terminal': 'konsole.svg',
};

function iconPath(iconName) {
    const kickoffDir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/kickoff');
    for (const ext of ['.png', '.svg']) {
        if (fs.existsSync(path.join(kickoffDir, iconName + ext))) {
            return `${KICKOFF_BASE}${iconName}${ext}`;
        }
    }
    if (PANEL_ICON[iconName]) {
        return `${PANEL_BASE}${PANEL_ICON[iconName]}`;
    }
    const discoverDir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/discover');
    for (const ext of ['.png', '.svg']) {
        if (fs.existsSync(path.join(discoverDir, iconName + ext))) {
            return `./assets/images/vendors/neon/discover/${iconName}${ext}`;
        }
    }
    return `${KICKOFF_BASE}${iconName}.png`;
}

function dataLinkFor(app) {
    const exec = (app.exec || '').replace(/^\/usr\/bin\//, '');
    return EXEC_LINK[exec] || EXEC_LINK[app.exec] || null;
}

function toMenuApp(app, catId) {
    const link = dataLinkFor(app);
    const entry = {
        catId,
        desktop: app.desktop,
        icon: iconPath(app.icon),
        name: app.name,
        desc: app.desc || '',
    };
    if (link) {
        entry.dataLink = link;
    }
    return entry;
}

// Breeze actions/22 (VM lab) — pas places/ ni categories/applications-*.
const KICKOFF_CAT_ICONS = {
    favorites: 'favorite.svg',
    all: 'application-menu.svg',
    help: 'help-about.svg',
    bureau: 'office-chart-area.svg',
    dev: 'project-development.svg',
    graph: 'graphics.svg',
    internet: 'internet-services.svg',
    sonvideo: 'view-media-playlist.svg',
    system: 'preferences-system-symbolic.svg',
    utilities: 'preferences-other.svg',
};
const KICKOFF_CAT_DIR = `${KICKOFF_BASE}actions/`;

const payload = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const MENU_CATS = [
    { id: 'favorites', label: 'Favoris', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.favorites}` },
    { id: 'all', label: 'Toutes les applications', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.all}` },
    { id: 'help', label: 'Aide', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.help}`, decorative: true, disabled: true },
    { id: 'bureau', label: 'Bureautique', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.bureau}` },
    { id: 'dev', label: 'Développement', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.dev}` },
    { id: 'graph', label: 'Graphisme', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.graph}` },
    { id: 'internet', label: 'Internet', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.internet}` },
    { id: 'sonvideo', label: 'Multimédia', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.sonvideo}` },
    { id: 'system', label: 'Système', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.system}` },
    { id: 'utilities', label: 'Utilitaires', icon: `${KICKOFF_CAT_DIR}${KICKOFF_CAT_ICONS.utilities}` },
];

const MENU_APPS = [];
const seen = new Set();

for (const app of payload.favorites) {
    const key = `favorites:${app.desktop}`;
    if (seen.has(key)) continue;
    seen.add(key);
    MENU_APPS.push(toMenuApp(app, 'favorites'));
}

for (const [catId, apps] of Object.entries(payload.categories)) {
    for (const app of apps) {
        const key = `${catId}:${app.desktop}`;
        if (seen.has(key)) continue;
        seen.add(key);
        MENU_APPS.push(toMenuApp(app, catId));
    }
}

const MENU_SHORTCUTS = {
    home: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel' },
    desktop: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Bureau' },
    documents: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Documents' },
    downloads: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Téléchargements' },
    pictures: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Images' },
    music: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Musique' },
    videos: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Vidéos' },
    trash: { dataLink: 'nemo', directory: './apps/system/Dossier_personnel/Corbeille' },
};

function serialize(obj, indent = 4) {
    const json = JSON.stringify(obj, null, indent);
    return json.replace(/"([^"]+)":/g, '$1:').replace(/'/g, "\\'");
}

const out = `// Généré depuis root/docs/inventaires/linux-kde-neon-kickoff-apps.json (VM lab)
// Regénérer : node root/tools/lab/generate-kde-neon-kickoff-data.mjs

const MENU_CATS = ${serialize(MENU_CATS)};

const MENU_SHORTCUTS = ${serialize(MENU_SHORTCUTS)};

const MENU_APPS = ${serialize(MENU_APPS)};
`;

fs.writeFileSync(DEST, out);
process.stdout.write(`OK ${DEST} (${MENU_APPS.length} apps)\n`);
