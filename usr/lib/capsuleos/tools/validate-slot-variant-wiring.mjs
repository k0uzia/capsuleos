#!/usr/bin/env node
/**
 * Vérifie l'isolation slot → variant (toolkit / registry) :
 * - profils actifs : CAPSULE_TEMPLATE_OVERRIDES cohérents avec apps-catalog
 * - pas de gabarit GNOME sur profil Cinnamon (et inversement)
 * - miroir skin.profile.json === profil canon (si présent)
 *
 * Usage : node usr/lib/capsuleos/tools/validate-slot-variant-wiring.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    ROOT,
    loadAppsCatalog,
    buildExpectedTemplateOverrides,
    assertTemplateMatchesToolkit,
    resolveSlotVariant,
    MULTI_VARIANT_SLOTS,
} from './linux/slot-variant-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');

const catalog = loadAppsCatalog(ROOT);
const errors = [];

function readProfile(file) {
    return JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf8'));
}

const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.startsWith('linux-') && f.endsWith('.json'));

for (const file of profileFiles) {
    const profile = readProfile(file);
    if (profile.status !== 'active') {
        continue;
    }
    const profileId = profile.id || file.replace('.json', '');
    const toolkitId = profile.toolkit && profile.toolkit.id;
    if (!toolkitId || !catalog.toolkits[toolkitId]) {
        continue;
    }

    const expected = buildExpectedTemplateOverrides(catalog, profile);
    const actual = (profile.capsuleGlobals && profile.capsuleGlobals.CAPSULE_TEMPLATE_OVERRIDES) || {};

    for (const [slotId, templatePath] of Object.entries(actual)) {
        const mismatch = assertTemplateMatchesToolkit(toolkitId, templatePath);
        if (mismatch) {
            errors.push(`${profileId}: ${mismatch}`);
        }
    }

    for (const slotId of Object.keys(actual)) {
        if (!expected[slotId]) {
            errors.push(
                `${profileId}: override inattendu CAPSULE_TEMPLATE_OVERRIDES.${slotId} `
                + `→ "${actual[slotId]}" (hors slotSpecs toolkit)`
            );
        }
    }

    for (const [slotId, templatePath] of Object.entries(expected)) {
        if (actual[slotId] !== templatePath) {
            errors.push(
                `${profileId}: CAPSULE_TEMPLATE_OVERRIDES.${slotId} attendu `
                + `"${templatePath}", trouvé "${actual[slotId] || '(absent)'}"`
            );
        }
    }

    for (const slotId of MULTI_VARIANT_SLOTS) {
        const variant = resolveSlotVariant(catalog, {
            toolkitId,
            registryId: profileId,
            branchId: profile.branchId,
        }, slotId);
        if (!variant) {
            continue;
        }
        const baseCssPath = path.join(ROOT, 'usr/share/capsuleos/linux/apps/style', `${variant.baseCssStem}.base.css`);
        if (!fs.existsSync(baseCssPath)) {
            errors.push(`${profileId}: CSS base manquant pour ${slotId} — ${variant.baseCssStem}.base.css`);
        }
    }

    const skinRel = profile.paths && profile.paths.skin;
    if (skinRel) {
        const mirrorPath = path.join(ROOT, skinRel.replace(/index\.html$/, 'skin.profile.json'));
        if (fs.existsSync(mirrorPath)) {
            const mirror = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
            const mirrorOverrides = (mirror.capsuleGlobals && mirror.capsuleGlobals.CAPSULE_TEMPLATE_OVERRIDES) || {};
            for (const [slotId, templatePath] of Object.entries(expected)) {
                if (mirrorOverrides[slotId] !== templatePath) {
                    errors.push(
                        `${profileId}: skin.profile.json désynchronisé — ${slotId} `
                        + `canon="${templatePath}" miroir="${mirrorOverrides[slotId] || '(absent)'}"`
                    );
                }
            }
        }
    }
}

if (errors.length) {
    console.error(`✗ validate-slot-variant-wiring — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

const active = profileFiles.filter((f) => readProfile(f).status === 'active').length;
console.log(`✓ validate-slot-variant-wiring OK — ${active} profil(s) actifs, isolation toolkit vérifiée`);
