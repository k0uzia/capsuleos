#!/usr/bin/env node
/**
 * Exporte le catalogue parcours mnt/ pour la version dev statique.
 * Usage : node usr/lib/capsuleos/tools/build-portal-modules.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CATALOG = path.join(ROOT, 'mnt/catalog.json');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/pedagogical-modules.json');
const ENTITLEMENTS = path.join(ROOT, 'etc/capsuleos/contracts/portal-entitlements.json');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/site/portal-modules-data.js');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const entitlements = readJson(ENTITLEMENTS);
const moduleAccess = entitlements.moduleAccess || {};
const accessLabels = { free: 'Gratuit', registered: 'Compte requis', subscriber: 'Capsule+' };

const canAccess = (entitlement, access) => {
    const allowed = moduleAccess[access] || [];
    return Array.isArray(allowed) && allowed.includes(entitlement);
};

const contract = readJson(CONTRACT);
const levelLabels = Object.fromEntries((contract.levels || []).map((l) => [l.id, l.label]));

const registry = readJson(REGISTRY);
const registryById = Object.fromEntries(
    (registry.entries || [])
        .filter((e) => e.status === 'active' && (e.referencePaths?.facade || e.facade))
        .map((e) => [e.id, e]),
);

const resolveOs = (ids) => (ids || [])
    .map((id) => registryById[id])
    .filter(Boolean)
    .map((e) => ({
        id: e.id,
        displayName: e.displayName,
        facade: e.referencePaths?.facade || e.facade,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));

const catalog = readJson(CATALOG);
const levels = [];

for (const levelEntry of catalog.levels || []) {
    const levelPath = levelEntry.path || levelEntry.id;
    const modules = [];
    for (const moduleId of levelEntry.modules || []) {
        const manifestPath = path.join(ROOT, 'mnt', levelPath, moduleId, 'module.json');
        if (!fs.existsSync(manifestPath)) continue;
        const manifest = readJson(manifestPath);
        const access = manifest.access || 'subscriber';
        modules.push({
            mountId: `${levelPath}/${moduleId}`,
            id: manifest.id || moduleId,
            level: manifest.level || levelEntry.id,
            title: manifest.title || moduleId,
            description: manifest.description || '',
            scenarioCount: Array.isArray(manifest.scenarios) ? manifest.scenarios.length : 0,
            access,
            accessLabel: accessLabels[access] || access,
            locked: !canAccess('anonymous', access),
            compatibleOs: resolveOs(manifest.registryIds),
        });
    }
    if (modules.length) {
        levels.push({
            id: levelEntry.id,
            label: levelLabels[levelEntry.id] || levelEntry.id,
            modules,
        });
    }
}

const payload = {
    sectionTitle: 'Parcours pédagogiques',
    sectionLead: 'Quêtes et tutoriels cross-OS montés dans les bureaux simulés. Choisissez un parcours, puis un système compatible.',
    moduleAccess: entitlements.moduleAccess || {},
    levels,
};

const js = `/**
 * Généré depuis mnt/catalog.json
 * Regénérer : node usr/lib/capsuleos/tools/build-portal-modules.mjs
 */
(function (global) {
    global.CapsulePortalModules = ${JSON.stringify(payload)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.writeFileSync(OUT, js);
console.log('✓ build-portal-modules →', path.relative(ROOT, OUT));
