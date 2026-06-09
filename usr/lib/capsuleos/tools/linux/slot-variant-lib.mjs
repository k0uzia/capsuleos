/**
 * Résolution slot logique → variant (gabarit + CSS base) par toolkit / registry.
 * Contrats : apps-catalog.json · taxonomy.json · convention-taxonomie-semantique.md
 *
 * Modèle taxonomique :
 *   - Slot stable (data-link) : update_manager, themes, nemo…
 *   - Variant toolkit : update_manager_gnome.html (GNOME) vs update_manager.html (Cinnamon)
 *   - Skin vendor : home/<branch>/<vendor>/style/apps/*.skin.css (tokens Adwaita vs Mint-Aqua)
 *   - Scripts partagés : usr/lib/capsuleos/… (indépendants du toolkit)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');
export const CATALOG_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');
export const APPS_REL = '../../../usr/share/capsuleos/linux/apps';
export const APPS_DIR = path.join(ROOT, 'usr/share/capsuleos/linux/apps');
export const STYLE_DIR = path.join(APPS_DIR, 'style');

/** Slots multi-variants — collision historique entre toolkits (apps, pas explorateurs). */
export const MULTI_VARIANT_SLOTS = new Set(['update_manager', 'themes']);

/** Résolus via CAPSULE_EXPLORER_TEMPLATE / registre explorateurs — pas CAPSULE_TEMPLATE_OVERRIDES. */
export const EXPLORER_SLOTS = new Set(['nemo', 'mainMenu']);

let catalogCache = null;

export function loadAppsCatalog(root = ROOT) {
    if (catalogCache && root === ROOT) {
        return catalogCache;
    }
    const catalogPath = path.join(root, 'etc/capsuleos/contracts/apps-catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    if (root === ROOT) {
        catalogCache = catalog;
    }
    return catalog;
}

/**
 * Overrides registry explicites (Ubuntu Snap Store, etc.).
 * Clé = registryId (linux-ubuntu), pas branchId.
 */
export function getRegistrySlotOverride(catalog, registryId, slotId) {
    const block = catalog.slotVariantOverrides && catalog.slotVariantOverrides[registryId];
    return block && block[slotId] ? block[slotId] : null;
}

/**
 * @param {object} catalog
 * @param {{ toolkitId: string, registryId?: string, branchId?: string }} ctx
 * @param {string} slotId
 */
export function resolveSlotVariant(catalog, ctx, slotId) {
    const toolkitId = ctx.toolkitId;
    const toolkit = catalog.toolkits && catalog.toolkits[toolkitId];
    if (!toolkit || !toolkit.slotSpecs || !toolkit.slotSpecs[slotId]) {
        return null;
    }

    const base = { ...toolkit.slotSpecs[slotId] };
    const registryOverride = ctx.registryId
        ? getRegistrySlotOverride(catalog, ctx.registryId, slotId)
        : null;
    if (registryOverride) {
        Object.assign(base, registryOverride);
    }

    const template = String(base.template || `${slotId}.html`);
    const templateFile = template.endsWith('.html') ? template : `${template}.html`;
    const baseCssStem = templateFile.replace(/\.html$/i, '');

    return {
        slotId,
        toolkitId,
        template: templateFile,
        templatePath: `${APPS_REL}/${templateFile}`,
        baseCssStem,
        baseCssFile: `style/${baseCssStem}.base.css`,
        chromeProvider: base.chromeProvider || null,
        skinCss: base.skinCss || `${slotId}.skin.css`,
        functionalDepth: base.functionalDepth || null,
    };
}

/** True si le profil doit déclarer CAPSULE_TEMPLATE_OVERRIDES pour ce slot. */
export function slotNeedsTemplateOverride(variant) {
    if (!variant) {
        return false;
    }
    const defaultName = `${variant.slotId}.html`;
    return variant.template !== defaultName;
}

/**
 * Map slot → chemin override attendu pour un profil actif.
 * @param {object} profile — profil etc/capsuleos/profiles/*.json
 */
export function buildExpectedTemplateOverrides(catalog, profile) {
    const toolkitId = profile.toolkit && profile.toolkit.id;
    if (!toolkitId) {
        return {};
    }
    const ctx = {
        toolkitId,
        registryId: profile.id,
        branchId: profile.branchId,
    };
    const overrides = {};
    const toolkit = catalog.toolkits && catalog.toolkits[toolkitId];
    if (!toolkit || !toolkit.slotSpecs) {
        return overrides;
    }

    for (const slotId of Object.keys(toolkit.slotSpecs)) {
        if (EXPLORER_SLOTS.has(slotId)) {
            continue;
        }
        const variant = resolveSlotVariant(catalog, ctx, slotId);
        if (variant && slotNeedsTemplateOverride(variant)) {
            overrides[slotId] = variant.templatePath;
        }
    }
    return overrides;
}

export function templateStemFromPath(templatePath) {
    const fileName = String(templatePath).split('/').pop() || '';
    return fileName.replace(/\.html$/i, '');
}

export function readVariantBaseCss(variant, root = ROOT) {
    if (!variant) {
        return '';
    }
    const basePath = path.join(root, APPS_DIR.replace(`${root}/`, ''), variant.baseCssFile);
    const resolved = path.join(STYLE_DIR, `${variant.baseCssStem}.base.css`);
    const file = fs.existsSync(resolved) ? resolved : basePath;
    if (!fs.existsSync(file)) {
        return '';
    }
    return fs.readFileSync(file, 'utf8');
}

/** Interdit : un gabarit d'un autre toolkit dans les overrides d'un profil. */
export const TOOLKIT_TEMPLATE_MARKERS = {
    gnome: ['_gnome.html', 'themes_gnome', 'nemo-gnome', 'nautilus/shell-gnome'],
    cinnamon: ['cinnamon_settings', 'update_manager.html', '/nemo.html', 'mainMenu.html'],
    kde: ['_kde.html', 'update_manager_kde', 'dolphin/'],
};

export function detectToolkitFromTemplatePath(templatePath) {
    const p = String(templatePath);
    if (p.includes('update_manager_ubuntu') || p.includes('ubuntu-software')) {
        return 'gnome-ubuntu';
    }
    if (p.includes('_gnome') || p.includes('themes_gnome') || p.includes('nemo-gnome')) {
        return 'gnome';
    }
    if (p.includes('_kde') || p.includes('dolphin/')) {
        return 'kde';
    }
    if (p.includes('cinnamon_settings') || (p.includes('update_manager.html') && !p.includes('_gnome'))) {
        return 'cinnamon';
    }
    if (p.includes('update_manager.html')) {
        return 'cinnamon';
    }
    return null;
}

export function assertTemplateMatchesToolkit(toolkitId, templatePath) {
    const detected = detectToolkitFromTemplatePath(templatePath);
    if (!detected) {
        return null;
    }
    if (detected === 'gnome-ubuntu' && toolkitId === 'gnome') {
        return null;
    }
    if (detected === 'gnome' && toolkitId === 'gnome') {
        return null;
    }
    if (detected === 'cinnamon' && toolkitId === 'cinnamon') {
        return null;
    }
    if (detected === 'kde' && toolkitId === 'kde') {
        return null;
    }
    return `toolkit ${toolkitId} ↔ gabarit ${detected} (${templatePath})`;
}
