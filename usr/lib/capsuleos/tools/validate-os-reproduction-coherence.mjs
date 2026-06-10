#!/usr/bin/env node
/**
 * Gate OsRepro — cohérence contrats reproduction parfaite (C1–C7, grille, chaînes).
 * Usage : node usr/lib/capsuleos/tools/validate-os-reproduction-coherence.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];
const warnings = [];

function readJson(rel) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        errors.push(`Fichier manquant: ${rel}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function exists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
}

function requireField(obj, field, label) {
    if (!obj || obj[field] === undefined || obj[field] === null || obj[field] === '') {
        errors.push(`${label}: champ requis « ${field} » absent`);
        return false;
    }
    return true;
}

const coherence = readJson('etc/capsuleos/contracts/os-reproduction-coherence.json');
if (!coherence) process.exit(1);

requireField(coherence, 'version', 'os-reproduction-coherence');
requireField(coherence, 'coherencePrinciples', 'os-reproduction-coherence');
requireField(coherence, 'deductiveLogic', 'os-reproduction-coherence');
requireField(coherence, 'argumentationGrid', 'os-reproduction-coherence');
requireField(coherence, 'perfectionCriteria', 'os-reproduction-coherence');
requireField(coherence, 'campaignRecipe', 'os-reproduction-coherence');
requireField(coherence, 'realismPredicates', 'os-reproduction-coherence');

const realSigma = coherence.realismPredicates?.RealΣ;
if (!realSigma?.formula) {
    errors.push('realismPredicates.RealΣ: formula absent');
}
if (!realSigma?.evaluator) {
    errors.push('realismPredicates.RealΣ: evaluator absent');
}
if (!exists('usr/lib/capsuleos/tools/lab/content-gaps-lib.mjs')) {
    errors.push('content-gaps-lib.mjs absent');
}

const principleIds = new Set();
for (const p of coherence.coherencePrinciples || []) {
    if (!p.id) errors.push('coherencePrinciples: id manquant');
    else if (principleIds.has(p.id)) errors.push(`coherencePrinciples: id dupliqué ${p.id}`);
    else principleIds.add(p.id);
}
if (principleIds.size < 9) {
    errors.push(`coherencePrinciples: attendu ≥9 principes (C1–C9), trouvé ${principleIds.size}`);
}

const anticipation = coherence.osAnticipationPrinciples || [];
if (anticipation.length < 9) {
    errors.push(`osAnticipationPrinciples: attendu ≥9 (P-OS1–P-OS9), trouvé ${anticipation.length}`);
}

if (!coherence.differentialCampaign?.workflow?.includes('GapDelta')) {
    errors.push('differentialCampaign: workflow GapDelta absent');
}
if (!exists('usr/lib/capsuleos/tools/lab/differential-campaign-lib.mjs')) {
    errors.push('differential-campaign-lib.mjs absent');
}
if (!exists('usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs')) {
    errors.push('resolve-slot-gap-delta.mjs absent');
}
if (!exists('usr/lib/capsuleos/tools/lab/slot-gap-delta-lib.mjs')) {
    errors.push('slot-gap-delta-lib.mjs absent');
}
const diff = coherence.differentialCampaign;
if (!diff?.resolverTool) {
    errors.push('differentialCampaign.resolverTool absent');
}

const dims = coherence.argumentationGrid?.dimensions || [];
const dimIds = dims.map((d) => d.id);
const expectedDims = ['chrome', 'content', 'catalog', 'interaction', 'detail'];
for (const id of expectedDims) {
    if (!dimIds.includes(id)) errors.push(`argumentationGrid: dimension manquante « ${id} »`);
}

for (const rel of coherence.boundContracts || []) {
    if (!exists(rel)) errors.push(`boundContracts: fichier absent ${rel}`);
}

const storeChain = readJson('etc/capsuleos/contracts/store-replication-chain.json');
if (storeChain) {
    if (storeChain.coherenceContract !== 'etc/capsuleos/contracts/os-reproduction-coherence.json') {
        errors.push('store-replication-chain: coherenceContract incorrect');
    }
    requireField(storeChain, 'groundReferenceRegistryId', 'store-replication-chain');
    requireField(storeChain, 'predicates', 'store-replication-chain');
    requireField(storeChain, 'formalRules', 'store-replication-chain');
}

const appsChain = readJson('etc/capsuleos/contracts/apps-replication-chain.json');
if (appsChain && !appsChain.coherenceContract) {
    errors.push('apps-replication-chain: coherenceContract absent');
}

const pipeline = readJson('etc/capsuleos/contracts/capsule-pipeline-layers.json');
if (pipeline && !pipeline.coherenceContract) {
    errors.push('capsule-pipeline-layers: coherenceContract absent');
}

const labProfiles = readJson('etc/capsuleos/contracts/lab-recipe-profiles.json');
const gnomeIds = ['linux-rocky', 'linux-fedora', 'linux-alma', 'linux-anduinos'];
if (labProfiles?.profiles) {
    for (const id of gnomeIds) {
        const prof = labProfiles.profiles[id];
        if (!prof) continue;
        if (!prof.coherenceContract) {
            errors.push(`lab-recipe-profiles[${id}]: coherenceContract absent`);
        }
        if (!prof.storeCampaign) {
            warnings.push(`lab-recipe-profiles[${id}]: storeCampaign absent (optionnel hors pilote)`);
        }
    }
}

const storeContent = readJson('etc/capsuleos/contracts/gnome-software-store-content.json');
if (storeContent) {
    requireField(storeContent, 'referenceRegistryId', 'gnome-software-store-content');
    if (!storeContent.coherenceContract) {
        errors.push('gnome-software-store-content: coherenceContract absent');
    }
    const ref = storeContent.referenceRegistryId;
    if (ref && !storeContent.byRegistry?.[ref]) {
        errors.push(`gnome-software-store-content: byRegistry[${ref}] absent`);
    }
}

const slots = readJson('etc/capsuleos/contracts/slots-manifest.json');
const updateSlot = slots?.slots?.update_manager;
if (updateSlot) {
    if (updateSlot.groundReferenceRegistryId !== 'linux-fedora') {
        errors.push('slots-manifest update_manager: groundReferenceRegistryId doit être linux-fedora');
    }
    const groundMod = updateSlot.groundKernelModule || 'usr/lib/capsuleos/shells/linux/gnome-software-ground.js';
    if (!exists(groundMod)) errors.push(`ground module absent: ${groundMod}`);
    if (!groundMod.includes('gnome-software-ground')) {
        errors.push('slots-manifest update_manager: groundKernelModule doit référencer gnome-software-ground.js');
    }
    if (!updateSlot.groundContentContract) {
        errors.push('slots-manifest update_manager: groundContentContract absent');
    }
}

const slotProfile = coherence.perfectionCriteria?.slotProfiles?.update_manager;
if (slotProfile) {
    for (const mod of slotProfile.groundModules || []) {
        if (!exists(mod)) errors.push(`perfectionCriteria update_manager: module absent ${mod}`);
    }
    for (const c of slotProfile.groundContracts || []) {
        if (!exists(c)) errors.push(`perfectionCriteria update_manager: contrat absent ${c}`);
    }
}

const gnomeIndexes = [
    'home/RedHat/Fedora/index.html',
    'home/RedHat/Rocky/index.html',
    'home/RedHat/Alma/index.html',
    'home/Debian/AnduinOS/index.html',
];
for (const idx of gnomeIndexes) {
    const full = path.join(ROOT, idx);
    if (!exists(idx)) continue;
    const html = fs.readFileSync(full, 'utf8');
    if (!html.includes('gnome-software-ground.js')) {
        errors.push(`${idx}: gnome-software-ground.js non chargé`);
    }
}

if (!exists('root/docs/convention-reproduction-parfaite.md')) {
    errors.push('doc convention-reproduction-parfaite.md absente');
}
if (!exists('root/docs/procedure-store-replication-formelle.md')) {
    errors.push('doc procedure-store-replication-formelle.md absente');
}
if (!exists('root/docs/convention-raisonnement-inductif-deductif.md')) {
    errors.push('doc convention-raisonnement-inductif-deductif.md absente');
}
if (!exists('usr/lib/capsuleos/tools/lab/run-store-replication-chain.mjs')) {
    errors.push('run-store-replication-chain.mjs absent');
}
if (!exists('usr/lib/capsuleos/tools/lab/store-replication-lib.mjs')) {
    errors.push('store-replication-lib.mjs absent');
}

const layerIds = (pipeline?.layers || []).map((l) => l.id);
if (!layerIds.includes('apps-parity')) {
    errors.push('capsule-pipeline-layers: couche apps-parity absente');
}

if (storeChain?.steps) {
    for (const step of storeChain.steps) {
        if (step.script && !exists(step.script)) {
            errors.push(`store-replication-chain step ${step.id}: script absent ${step.script}`);
        }
    }
}

if (warnings.length) {
    console.warn('validate-os-reproduction-coherence — avertissements:');
    for (const w of warnings) console.warn('  ⚠', w);
}

if (errors.length) {
    console.error('validate-os-reproduction-coherence — ÉCHEC');
    for (const e of errors) console.error('  ✗', e);
    process.exit(1);
}

console.log('validate-os-reproduction-coherence — OK');
console.log(`  principes C: ${principleIds.size} · dimensions grille: ${dimIds.length}`);
console.log(`  ground ref: ${storeContent?.referenceRegistryId || '—'}`);
