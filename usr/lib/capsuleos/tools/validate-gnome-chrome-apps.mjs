#!/usr/bin/env node
/**
 * Vérifie que chaque slot fenêtré des skins GNOME actifs utilise le provider chrome attendu
 * et que les gabarits CSD exposent l’ancre HTML requise.
 * Usage : node usr/lib/capsuleos/tools/validate-gnome-chrome-apps.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadGnomePack } from './linux/gnome-pack-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const pack = loadGnomePack(ROOT);
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const APPS_DIR = path.join(ROOT, 'usr/share/capsuleos/linux/apps');
const CHROME_JS = path.join(ROOT, 'usr/lib/capsuleos/common/window/chrome.js');

const SKIP_SLOTS = new Set(['mainMenu']);

/** Provider GNOME par slot (défaut header-context + contrat). */
const GNOME_SLOT_PROVIDERS = {
    nemo: 'nemo-gnome',
    firefox: 'firefox-gnome',
    terminal: 'terminal-gnome',
    calculator: 'libadwaita-gnome',
    text_editor: 'libadwaita-gnome',
    calendar: 'libadwaita-gnome',
    clocks: 'libadwaita-gnome',
    update_manager: 'libadwaita-gnome',
    profile: 'libadwaita-gnome',
    checklist: 'libadwaita-gnome',
    librewriter: 'libadwaita-gnome',
    themes: 'libadwaita-gnome',
    visionneur_images: 'libadwaita-gnome',
    visionneur_pdf: 'libadwaita-gnome',
    lecteur_multimedia: 'libadwaita-gnome',
    snapshot: 'libadwaita-gnome',
    screenshot: 'libadwaita-gnome',
    baobab: 'libadwaita-gnome',
    system_monitor: 'libadwaita-gnome',
    tour: 'libadwaita-gnome',
    characters: 'libadwaita-gnome',
    file_roller: 'file-roller-gtk',
};

/** Ancres CSD libadwaita (manifeste toolkit-gnome/pack.json). */
const LIBADWAITA_ANCHORS = Object.fromEntries(
    Object.entries(pack.libadwaita?.slots || {}).map(([slotId, meta]) => [slotId, meta.anchor])
);
const LIBADWAITA_RUNTIME_ANCHORS = new Set(
    Object.entries(pack.libadwaita?.slots || {})
        .filter(([, meta]) => meta.runtimeAnchor)
        .map(([slotId]) => slotId)
);

const PROFILE_PROVIDER_OVERRIDES = {
    'linux-ubuntu': {
        update_manager: 'update-manager-ubuntu',
    },
};

const PROFILE_TEMPLATE_OVERRIDES = {
    'linux-ubuntu': {
        update_manager: 'update_manager_ubuntu.html',
        themes: 'themes_gnome.html',
    },
};

const EMBED_GNOME_TEMPLATE_OVERRIDES = {
    rocky: { update_manager: 'update_manager_gnome.html', themes: 'themes_gnome.html' },
    fedora: { update_manager: 'update_manager_gnome.html', themes: 'themes_gnome.html' },
    alma: { update_manager: 'update_manager_gnome.html', themes: 'themes_gnome.html' },
    anduinos: { update_manager: 'update_manager_gnome.html', themes: 'themes_gnome.html' },
    ubuntu: { themes: 'themes_gnome.html' },
};

const errors = [];
const chromeSrc = fs.readFileSync(CHROME_JS, 'utf8');

Object.values(GNOME_SLOT_PROVIDERS).forEach((providerId) => {
    if (!chromeSrc.includes(`'${providerId}'`) && !chromeSrc.includes(`"${providerId}"`)) {
        errors.push(`chrome.js : provider « ${providerId} » manquant`);
    }
});
if (!chromeSrc.includes("'update-manager-ubuntu'")) {
    errors.push('chrome.js : provider update-manager-ubuntu manquant');
}

function readTemplateHtml(profileId, slotId, embedKey) {
    const overrides = PROFILE_TEMPLATE_OVERRIDES[profileId] || {};
    const embedOverrides = EMBED_GNOME_TEMPLATE_OVERRIDES[embedKey] || {};
    const fileName = overrides[slotId] || embedOverrides[slotId] || `${slotId}.html`;
    const full = path.join(APPS_DIR, fileName);
    if (!fs.existsSync(full)) {
        return null;
    }
    return fs.readFileSync(full, 'utf8');
}

function expectedProvider(profileId, slotId) {
    const overrides = PROFILE_PROVIDER_OVERRIDES[profileId] || {};
    return overrides[slotId] || GNOME_SLOT_PROVIDERS[slotId] || 'default';
}

function listWindowSlots(indexHtml) {
    const slots = [];
    const patterns = [
        /<div[^>]*class="windowElement"[^>]*data-link="([^"]+)"/g,
        /<div[^>]*data-link="([^"]+)"[^>]*class="windowElement"/g,
    ];
    patterns.forEach((re) => {
        let match;
        while ((match = re.exec(indexHtml)) !== null) {
            const slotId = match[1];
            if (!SKIP_SLOTS.has(slotId)) {
                slots.push(slotId);
            }
        }
    });
    return [...new Set(slots)];
}

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'));

for (const file of profileFiles) {
    const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
    if (profile.status !== 'active' || profile.toolkit?.id !== 'gnome') {
        continue;
    }
    const profileId = profile.id || file.replace('.json', '');
    const skinRel = profile.paths?.skin;
    if (!skinRel) {
        errors.push(`${profileId}: paths.skin manquant`);
        continue;
    }
    const indexPath = path.join(ROOT, skinRel);
    if (!fs.existsSync(indexPath)) {
        errors.push(`${profileId}: index.html introuvable`);
        continue;
    }
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    const embedKey = profile.embedKey || profile.capsuleGlobals?.CAPSULE_EMBED_SKIN_KEY;
    const slots = listWindowSlots(indexHtml);

    const importsPath = path.join(ROOT, skinRel.replace(/index\.html$/, 'style/imports.css'));
    if (fs.existsSync(importsPath)) {
        const importsSrc = fs.readFileSync(importsPath, 'utf8');
        if (!importsSrc.includes('toolkit-gnome/chrome.css')) {
            errors.push(`${profileId}: style/imports.css n’importe pas toolkit-gnome/chrome.css`);
        }
    }

    const templateOverrides = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES || {};
    if (slots.includes('update_manager') && profileId !== 'linux-ubuntu') {
        const overridePath = templateOverrides.update_manager || '';
        if (!overridePath.includes('update_manager_gnome.html')) {
            errors.push(
                `${profileId}: CAPSULE_TEMPLATE_OVERRIDES.update_manager doit pointer vers update_manager_gnome.html`
            );
        }
    }

    for (const slotId of slots) {
        const providerId = expectedProvider(profileId, slotId);
        if (providerId === 'default') {
            errors.push(`${profileId}: slot « ${slotId} » sans provider GNOME dédié`);
            continue;
        }

        if (providerId === 'libadwaita-gnome') {
            const anchorClass = LIBADWAITA_ANCHORS[slotId];
            if (!anchorClass) {
                errors.push(`${profileId}: slot « ${slotId} » libadwaita sans ancre définie`);
                continue;
            }
            const html = readTemplateHtml(profileId, slotId, embedKey);
            if (!html) {
                errors.push(`${profileId}: gabarit HTML introuvable pour slot « ${slotId} »`);
                continue;
            }
            if (!LIBADWAITA_RUNTIME_ANCHORS.has(slotId) && !html.includes(anchorClass)) {
                errors.push(
                    `${profileId}: slot « ${slotId} » — ancre « ${anchorClass} » absente du gabarit`
                );
            }
            const skinPath = path.join(ROOT, skinRel.replace(/index\.html$/, `style/apps/${slotId}.skin.css`));
            const explorerSkin = slotId === 'nemo'
                ? path.join(ROOT, skinRel.replace(/index\.html$/, 'style/apps/nautilus.skin.css'))
                : null;
            if (!fs.existsSync(skinPath) && !(explorerSkin && fs.existsSync(explorerSkin))) {
                errors.push(`${profileId}: skin chrome manquant — style/apps/${slotId}.skin.css`);
            }
        }

        if (providerId === 'update-manager-ubuntu') {
            const html = readTemplateHtml(profileId, slotId, embedKey);
            if (!html || !html.includes('ubuntu-software__topbar')) {
                errors.push(`${profileId}: update_manager — gabarit ubuntu-software__topbar requis`);
            }
        }

        if (providerId === 'nemo-gnome') {
            const explorerSkin = path.join(ROOT, skinRel.replace(/index\.html$/, 'style/apps/nautilus.skin.css'));
            if (!fs.existsSync(explorerSkin)) {
                errors.push(`${profileId}: nautilus.skin.css manquant pour l’explorateur`);
            }
        }
    }
}

if (errors.length) {
    console.error(`✗ validate-gnome-chrome-apps — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

const gnomeProfiles = profileFiles.filter((f) => {
    const p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), 'utf8'));
    return p.status === 'active' && p.toolkit?.id === 'gnome';
}).length;

console.log(`✓ validate-gnome-chrome-apps OK — ${gnomeProfiles} profil(s) GNOME, ${Object.keys(GNOME_SLOT_PROVIDERS).length} providers`);
