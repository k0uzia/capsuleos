#!/usr/bin/env node
/**
 * Gate taxonomique CapsuleOS — prédicats Tax, TaxV (embed), collisions slot-default / embed-css.
 * Contrat : etc/capsuleos/contracts/taxonomy.json
 * Convention : root/docs/convention-taxonomie-semantique.md
 *
 * Usage : node usr/lib/capsuleos/tools/validate-taxonomy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    ROOT,
    loadAppsCatalog,
    resolveSlotVariant,
    MULTI_VARIANT_SLOTS,
    templateStemFromPath,
} from './linux/slot-variant-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAXONOMY_PATH = path.join(ROOT, 'etc/capsuleos/contracts/taxonomy.json');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');
const CLUSTER_PATH = path.join(ROOT, 'etc/capsuleos/cluster-registry.json');
const EMBED_PATH = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');

const errors = [];
const warnings = [];

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readProfile(file) {
    return loadJson(path.join(PROFILES_DIR, file));
}

function extractBalancedJson(raw, marker) {
    const start = raw.indexOf(marker);
    if (start < 0) {
        return null;
    }
    let i = start + marker.length;
    while (i < raw.length && /\s/.test(raw[i])) {
        i += 1;
    }
    if (raw[i] !== '{') {
        return null;
    }
    let depth = 0;
    let inString = false;
    let escape = false;
    const begin = i;
    for (; i < raw.length; i += 1) {
        const ch = raw[i];
        if (inString) {
            if (escape) {
                escape = false;
                continue;
            }
            if (ch === '\\') {
                escape = true;
                continue;
            }
            if (ch === '"') {
                inString = false;
            }
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '{') {
            depth += 1;
        } else if (ch === '}') {
            depth -= 1;
            if (depth === 0) {
                return raw.slice(begin, i + 1);
            }
        }
    }
    return null;
}

/** @returns {object|null} */
function loadEmbed() {
    if (!fs.existsSync(EMBED_PATH)) {
        warnings.push('embed absent — régénérer via sync-all-views.mjs');
        return null;
    }
    const raw = fs.readFileSync(EMBED_PATH, 'utf8');
    const marker = 'window.CAPSULE_APP_EMBED = ';
    const jsonText = extractBalancedJson(raw, marker);
    if (!jsonText) {
        errors.push('capsule-app-embed.js — CAPSULE_APP_EMBED illisible');
        return null;
    }
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        errors.push(`capsule-app-embed.js — parse JSON : ${e.message}`);
        return null;
    }
}

function clusterToolkitMap(clusters) {
    const map = new Map();
    for (const c of clusters) {
        map.set(c.id, c);
    }
    return map;
}

function expectedToolkitPack(toolkitId) {
    return `toolkits/${toolkitId}`;
}

function htmlToolkitMarkers(html) {
    const h = String(html || '');
    if (h.includes('kde-systemsettings') || h.includes('data-kde-settings') || h.includes('kcmshell')) {
        return 'kde';
    }
    if (h.includes('gnome-software') || h.includes('gnome-baobab') || h.includes('adw-') || h.includes('libadwaita')) {
        return 'gnome';
    }
    if (h.includes('cinnamon-') || h.includes('xapp-') || h.includes('mint-')) {
        return 'cinnamon';
    }
    if (h.includes('plasma-') || h.includes('discover-')) {
        return 'kde';
    }
    return null;
}

function cssToolkitMarkers(css) {
    const c = String(css || '');
    if (c.includes('kde-systemsettings') || c.includes('data-kde-settings')) {
        return 'kde';
    }
    if (c.includes('gnome-software') || c.includes('gnome-baobab') || c.includes('.adw-')) {
        return 'gnome';
    }
    if (c.includes('cinnamon-') || c.includes('.xapp-')) {
        return 'cinnamon';
    }
    if (c.includes('discover-') || c.includes('plasma-')) {
        return 'kde';
    }
    return null;
}

// ── Contrat taxonomie ─────────────────────────────────────────────────────
if (!fs.existsSync(TAXONOMY_PATH)) {
    errors.push('etc/capsuleos/contracts/taxonomy.json manquant');
    process.exit(1);
}

const taxonomy = loadJson(TAXONOMY_PATH);
const extendsRe = new RegExp(taxonomy.hierarchy.extendsPattern);
const registryRe = new RegExp(taxonomy.hierarchy.registryIdPattern);
const conventionDoc = path.join(ROOT, taxonomy.conventionDoc);
if (!fs.existsSync(conventionDoc)) {
    errors.push(`conventionDoc introuvable : ${taxonomy.conventionDoc}`);
}

const catalog = loadAppsCatalog(ROOT);
const clusterRegistry = loadJson(CLUSTER_PATH);
const clusterById = clusterToolkitMap(clusterRegistry.clusters || []);

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'));
const activeProfiles = [];

for (const file of profileFiles) {
    const profile = readProfile(file);
    if (profile.status !== 'active') {
        continue;
    }
    activeProfiles.push(profile);

    const profileId = profile.id || file.replace('.json', '');
    const toolkitId = profile.toolkit && profile.toolkit.id;
    const kernelId = profile.kernelId || profile.family;
    const branchId = profile.branchId;

    if (!registryRe.test(profileId)) {
        errors.push(`${profileId}: registryId ne respecte pas ${taxonomy.hierarchy.registryIdPattern}`);
    }
    if (profileId !== file.replace('.json', '')) {
        errors.push(`${profileId}: id profil ≠ nom fichier ${file}`);
    }

    if (!profile.extends) {
        errors.push(`${profileId}: extends manquant`);
    } else {
        const m = profile.extends.match(extendsRe);
        if (!m) {
            errors.push(`${profileId}: extends invalide "${profile.extends}"`);
        } else {
            const [, extKernel, extBranch, extToolkit] = m;
            if (extKernel !== kernelId) {
                errors.push(`${profileId}: extends kernel:${extKernel} ≠ kernelId ${kernelId}`);
            }
            if (extBranch !== branchId) {
                errors.push(`${profileId}: extends branch:${extBranch} ≠ branchId ${branchId}`);
            }
            if (extToolkit !== toolkitId) {
                errors.push(`${profileId}: extends toolkit:${extToolkit} ≠ toolkit.id ${toolkitId}`);
            }
        }
    }

    const allowedBranches = taxonomy.dimensions.branchId.allowed || [];
    if (branchId && allowedBranches.length && !allowedBranches.includes(branchId)) {
        warnings.push(`${profileId}: branchId "${branchId}" hors liste taxonomy`);
    }

    const allowedToolkits = taxonomy.dimensions.toolkitId.allowed || [];
    if (toolkitId && allowedToolkits.length && !allowedToolkits.includes(toolkitId)) {
        errors.push(`${profileId}: toolkitId "${toolkitId}" non autorisé (taxonomy)`);
    }

    const pack = profile.assets && profile.assets.toolkitPack;
    const expectedPack = expectedToolkitPack(toolkitId);
    if (pack && toolkitId && pack !== expectedPack) {
        errors.push(`${profileId}: toolkitPack "${pack}" attendu "${expectedPack}"`);
    }

    const embedKey = profile.embedKey || profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_EMBED_SKIN_KEY;
    if (embedKey && profile.bodyId && embedKey !== profile.bodyId && profileId !== 'linux-mx-kde') {
        // mx-kde : embedKey mxkde ≠ bodyId mx-kde (documenté taxonomy)
        const knownMismatch = new Set(['linux-mx-kde']);
        if (!knownMismatch.has(profileId)) {
            warnings.push(`${profileId}: embedKey "${embedKey}" ≠ bodyId "${profile.bodyId}"`);
        }
    }

    const clusterIds = profile.clusterIds || [];
    if (!clusterIds.length) {
        warnings.push(`${profileId}: clusterIds vide`);
    }
    for (const cid of clusterIds) {
        const cluster = clusterById.get(cid);
        if (!cluster) {
            errors.push(`${profileId}: clusterIds référence inconnu "${cid}"`);
            continue;
        }
        if (cluster.toolkitId && cluster.toolkitId !== toolkitId) {
            errors.push(`${profileId}: cluster ${cid} toolkit ${cluster.toolkitId} ≠ profil ${toolkitId}`);
        }
        if (cluster.kernelId && cluster.kernelId !== kernelId) {
            errors.push(`${profileId}: cluster ${cid} kernel ${cluster.kernelId} ≠ profil ${kernelId}`);
        }
    }

    const toolkitClusterId = `toolkit.${toolkitId}`;
    if (toolkitId && !clusterIds.includes(toolkitClusterId)) {
        errors.push(`${profileId}: clusterIds doit inclure "${toolkitClusterId}"`);
    }

    // TaxV — slots multi-variants : collision GNOME ↔ Cinnamon uniquement si déclarés
    const toolkitBlock = catalog.toolkits && catalog.toolkits[toolkitId];
    const ctx = { toolkitId, registryId: profileId, branchId };
    for (const slotId of MULTI_VARIANT_SLOTS) {
        if (!toolkitBlock || !toolkitBlock.slotSpecs || !toolkitBlock.slotSpecs[slotId]) {
            continue;
        }
        const variant = resolveSlotVariant(catalog, ctx, slotId);
        if (!variant) {
            errors.push(`${profileId}: slotSpecs.${slotId} déclaré mais variant non résolu`);
            continue;
        }
        const defaultTemplate = `${slotId}.html`;
        // Collision documentée : {slot}.html = variant Cinnamon ; GNOME exige suffixe _gnome
        if (variant.template === defaultTemplate && toolkitId === 'gnome') {
            const cinnamonHas = catalog.toolkits.cinnamon
                && catalog.toolkits.cinnamon.slotSpecs
                && catalog.toolkits.cinnamon.slotSpecs[slotId];
            if (cinnamonHas) {
                errors.push(
                    `${profileId}: slot-default-assumption — ${slotId} utilise ${defaultTemplate} `
                    + `sur toolkit gnome (attendu variant explicite, ex. ${slotId}_gnome.html)`
                );
            }
        }
    }
}

// ── Embed : html ↔ cssBase même variant ───────────────────────────────────
const embed = loadEmbed();
if (embed && embed.skinTemplates) {
    const embedKeyToProfile = new Map();
    for (const profile of activeProfiles) {
        const key = profile.embedKey
            || (profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_EMBED_SKIN_KEY)
            || profile.bodyId;
        if (key) {
            embedKeyToProfile.set(key, profile);
        }
    }

    for (const [embedKey, slots] of Object.entries(embed.skinTemplates)) {
        const profile = embedKeyToProfile.get(embedKey);
        const toolkitId = profile && profile.toolkit && profile.toolkit.id;

        for (const [slotId, entry] of Object.entries(slots || {})) {
            if (!entry || !entry.html) {
                continue;
            }

            const htmlMarker = htmlToolkitMarkers(entry.html);
            const cssMarker = cssToolkitMarkers(entry.cssBase || '');

            if (MULTI_VARIANT_SLOTS.has(slotId) && profile) {
                const variant = resolveSlotVariant(catalog, {
                    toolkitId,
                    registryId: profile.id,
                    branchId: profile.branchId,
                }, slotId);
                if (variant) {
                    const expectedStem = variant.baseCssStem;
                    const baseCssFile = path.join(
                        ROOT,
                        'usr/share/capsuleos/linux/apps/style',
                        `${expectedStem}.base.css`
                    );
                    if (fs.existsSync(baseCssFile) && entry.cssBase) {
                        const expectedCss = fs.readFileSync(baseCssFile, 'utf8').trim();
                        const actualCss = String(entry.cssBase).trim();
                        if (expectedCss && actualCss && expectedCss !== actualCss) {
                            const expectedMarker = cssToolkitMarkers(expectedCss);
                            if (expectedMarker && cssMarker && expectedMarker !== cssMarker) {
                                errors.push(
                                    `embed skinTemplates.${embedKey}.${slotId}: cssBase ne correspond pas `
                                    + `à ${expectedStem}.base.css (collision toolkit)`
                                );
                            }
                        }
                    } else if (fs.existsSync(baseCssFile) && !entry.cssBase && toolkitId === 'gnome') {
                        errors.push(
                            `embed skinTemplates.${embedKey}.${slotId}: cssBase manquant `
                            + `(requis pour variant ${expectedStem})`
                        );
                    }
                }
            }

            if (htmlMarker && cssMarker && htmlMarker !== cssMarker) {
                errors.push(
                    `embed skinTemplates.${embedKey}.${slotId}: embed-css-mismatch `
                    + `html→${htmlMarker} cssBase→${cssMarker}`
                );
            }

            if (toolkitId && htmlMarker && htmlMarker !== toolkitId && htmlMarker !== 'gnome-ubuntu') {
                if (!(toolkitId === 'gnome' && htmlMarker === 'gnome')) {
                    errors.push(
                        `embed skinTemplates.${embedKey}.${slotId}: gabarit ${htmlMarker} `
                        + `sur profil toolkit ${toolkitId}`
                    );
                }
            }
        }
    }

    // templates globaux : pas de collision Cinnamon sur slot GNOME-only dans overrides profils
    for (const profile of activeProfiles) {
        const toolkitId = profile.toolkit && profile.toolkit.id;
        if (toolkitId !== 'gnome') {
            continue;
        }
        const overrides = (profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_TEMPLATE_OVERRIDES) || {};
        for (const [slotId, templatePath] of Object.entries(overrides)) {
            const stem = templateStemFromPath(templatePath);
            if (MULTI_VARIANT_SLOTS.has(slotId) && stem === slotId) {
                errors.push(
                    `${profile.id}: override ${slotId} → ${stem}.html (slot-default-assumption)`
                );
            }
        }
    }
}

// ── skin-toolkit-recipe ↔ taxonomy ────────────────────────────────────────
const recipePath = path.join(ROOT, taxonomy.catalogs.recipe);
if (fs.existsSync(recipePath)) {
    const recipe = loadJson(recipePath);
    if (!recipe.taxonomyContract) {
        warnings.push('skin-toolkit-recipe.json : taxonomyContract non lié (attendu taxonomy.json)');
    }
}

if (warnings.length) {
    console.warn(`validate-taxonomy — ${warnings.length} avertissement(s)`);
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
    console.error(`✗ validate-taxonomy — ${errors.length} erreur(s) — prédicat Tax échoué`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log(
    `✓ validate-taxonomy OK — Tax : ${activeProfiles.length} profil(s) actifs, `
    + `embed ${embed ? 'vérifié' : 'non chargé'}, convention ${taxonomy.conventionDoc}`
);
