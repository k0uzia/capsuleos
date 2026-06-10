#!/usr/bin/env node
/**
 * Valide le manifeste toolkit GNOME et la fraîcheur des skins dérivés vs Rocky.
 * Usage : node usr/lib/capsuleos/tools/validate-gnome-toolkit-pack.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    ROOT,
    PACK_REL,
    loadGnomePack,
    getSyncTargets,
    listGenericAppSkinSlots,
    rockyAppSkinPath,
    targetAppSkinPath,
    buildAppSkinForTarget,
    normalizeCssForCompare,
} from './linux/gnome-pack-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.join(ROOT, 'etc/capsuleos/cluster-registry.json');
const PROFILES_DIR = path.join(ROOT, 'etc/capsuleos/profiles');

const errors = [];
const pack = loadGnomePack(ROOT);

function expectPath(rel, label) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`${label} introuvable : ${rel}`);
    }
}

[
    pack.cluster.chromeCss,
    pack.cluster.variablesCss,
    pack.chromeContract,
    ...(pack.sharedCss || []),
].forEach((rel) => expectPath(rel, 'Ressource pack'));

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const gnomeCluster = registry.clusters?.find((c) => c.id === 'toolkit.gnome');
if (!gnomeCluster?.packPath) {
    errors.push('cluster-registry : toolkit.gnome sans packPath');
} else if (gnomeCluster.packPath !== PACK_REL) {
    errors.push(`cluster-registry : packPath attendu « ${PACK_REL} », reçu « ${gnomeCluster.packPath} »`);
}

for (const pipeline of pack.sync?.pipelines || []) {
    if (pipeline.type === 'script' && pipeline.path) {
        expectPath(pipeline.path, `Pipeline ${pipeline.id}`);
    }
}

const rockyRoot = path.join(ROOT, pack.reference.skinRoot);
if (!fs.existsSync(rockyRoot)) {
    errors.push(`Référence Rocky introuvable : ${pack.reference.skinRoot}`);
}

for (const target of getSyncTargets(pack)) {
    const profilePath = path.join(PROFILES_DIR, `${target.profileId}.json`);
    if (!fs.existsSync(profilePath)) {
        errors.push(`Profil sync cible introuvable : ${target.profileId}`);
        continue;
    }
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    if (profile.toolkit?.id !== 'gnome') {
        errors.push(`${target.profileId} : toolkit.id doit être gnome`);
    }
}

for (const slotId of listGenericAppSkinSlots(pack)) {
    const sourcePath = rockyAppSkinPath(ROOT, pack, slotId);
    if (!fs.existsSync(sourcePath)) {
        errors.push(`Skin Rocky manquant : style/apps/${slotId}.skin.css`);
        continue;
    }
    const sourceText = fs.readFileSync(sourcePath, 'utf8');
    for (const target of getSyncTargets(pack)) {
        const out = targetAppSkinPath(ROOT, target, slotId);
        if (!fs.existsSync(out)) {
            errors.push(`${target.id} : skin manquant — style/apps/${slotId}.skin.css`);
            continue;
        }
        const expected = buildAppSkinForTarget(sourceText, target, slotId, ROOT);
        const actual = fs.readFileSync(out, 'utf8');
        if (normalizeCssForCompare(expected) !== normalizeCssForCompare(actual)) {
            errors.push(
                `${target.id} : style/apps/${slotId}.skin.css désynchronisé (lancer sync-gnome-toolkit-pack.mjs)`
            );
        }
    }
}

for (const pipeline of pack.sync?.pipelines || []) {
    if (pipeline.type !== 'script' || !pipeline.artifact) {
        continue;
    }
    const sourceRel = path.join(pack.sync.canonicalSkinRoot, pipeline.artifact);
    const sourcePath = path.join(ROOT, sourceRel);
    if (!fs.existsSync(sourcePath)) {
        errors.push(`Artefact Rocky manquant : ${sourceRel}`);
        continue;
    }
    const targetIds = pipeline.targetIds || getSyncTargets(pack).map((t) => t.id);
    for (const target of getSyncTargets(pack)) {
        if (!targetIds.includes(target.id)) {
            continue;
        }
        const out = path.join(ROOT, target.skinRoot, pipeline.artifact);
        if (!fs.existsSync(out)) {
            errors.push(`${target.id} : artefact manquant — ${pipeline.artifact}`);
        }
    }
}

const libadwaitaSlots = Object.keys(pack.libadwaita?.slots || {});
for (const slotId of libadwaitaSlots) {
    const slot = pack.libadwaita.slots[slotId];
    if (!slot.anchor) {
        errors.push(`libadwaita.${slotId} : anchor manquant`);
    }
}

if (errors.length) {
    console.error(`✗ validate-gnome-toolkit-pack — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(
    `✓ validate-gnome-toolkit-pack OK — ${getSyncTargets(pack).length} cible(s), ` +
        `${listGenericAppSkinSlots(pack).length} slot(s) app, ${libadwaitaSlots.length} ancre(s) libadwaita`
);
