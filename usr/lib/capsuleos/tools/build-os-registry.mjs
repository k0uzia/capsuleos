#!/usr/bin/env node
/**
 * Génère etc/capsuleos/os-registry.json depuis kernels.json + os-registry-entries.mjs.
 * Gel catalogue : toutes les entrées → planned/stub ; chemins runtime → referencePaths.
 * Usage : node usr/lib/capsuleos/tools/build-os-registry.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRawEntries } from './os-registry-entries.mjs';
import { resolvePickIconAsset } from './vendor-icon-resolution-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const KERNELS = path.join(ROOT, 'etc/capsuleos/kernels.json');
const SOURCING = path.join(ROOT, 'etc/capsuleos/os-sourcing.json');
const REACTIVATION = path.join(ROOT, 'etc/capsuleos/reactivation-queue.json');

const reactivationIds = fs.existsSync(REACTIVATION)
  ? (JSON.parse(fs.readFileSync(REACTIVATION, 'utf8')).ids || [])
  : [];

const sourcingOverlay = fs.existsSync(SOURCING)
  ? JSON.parse(fs.readFileSync(SOURCING, 'utf8'))
  : { entries: {}, assetPolicy: {} };

const kernelsDoc = JSON.parse(fs.readFileSync(KERNELS, 'utf8'));

const mergeSourcing = (entry) => {
  const extra = sourcingOverlay.entries?.[entry.id];
  if (!extra) {
    return entry;
  }
  const merged = { ...entry, ...extra };
  if (entry.sources && extra.sources) {
    merged.sources = [...entry.sources, ...extra.sources];
  }
  return merged;
};

/** Gel catalogue : planned/stub sauf file reactivation-queue.json */
function freezeEntry(raw) {
  const isReactivated = reactivationIds.includes(raw.id);
  const explicitStatus = raw.status;
  let status = 'planned';
  if (isReactivated) {
    status = 'active';
  } else if (explicitStatus === 'stub') {
    status = 'stub';
  } else if (explicitStatus === 'planned') {
    status = 'planned';
  }

  const entry = {
    id: raw.id,
    family: raw.family,
    kernelId: raw.kernelId,
    branchId: raw.branchId ?? null,
    vendor: raw.vendor,
    displayName: raw.displayName,
    tier: raw.tier,
    status,
    fidelityLevel: raw.fidelityLevel ?? 0,
    kernelSpecVersion: kernelsDoc.kernelSpecVersion ?? 1,
    toolkit: {
      id: raw.toolkit || 'minimal',
      shellId: raw.shellId || 'generic',
      clusterId: raw.toolkit ? `toolkit.${raw.toolkit}` : null
    },
    apps: raw.apps || {},
    upstreamId: raw.upstreamId ?? null,
    clusterIds: raw.clusterIds || [],
    skills: raw.skills || [],
    browserMinCapabilities: { ...kernelsDoc.browserMinCapabilitiesDefault },
    extends: raw.extends || buildExtends(raw),
    assets: {
      pickIcon: resolvePickIcon(raw)
    }
  };

  if (raw.referencePaths) {
    entry.referencePaths = { ...raw.referencePaths, frozenAt: new Date().toISOString().slice(0, 10) };
    if (isReactivated) {
      if (raw.referencePaths.facade) entry.facade = raw.referencePaths.facade;
      if (raw.referencePaths.skin) entry.skin = raw.referencePaths.skin;
      if (raw.referencePaths.embedKey) entry.embedKey = raw.referencePaths.embedKey;
      if (raw.referencePaths.bodyId) entry.bodyId = raw.referencePaths.bodyId;
    }
  }
  if (raw.assetPacks) {
    entry.assetPacks = raw.assetPacks;
  }
  if (raw.sources) {
    entry.sources = raw.sources;
  }

  return mergeSourcing(entry);
}

function buildExtends(raw) {
  const parts = [`kernel:${raw.kernelId}`];
  if (raw.branchId) {
    parts.push(`branch:${raw.branchId}`);
  }
  if (raw.toolkit) {
    parts.push(`toolkit:${raw.toolkit}`);
  }
  return parts.join('/');
}

function resolvePickIcon(raw) {
  return resolvePickIconAsset(raw);
}

const base = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, 'utf8'))
  : { version: 2, families: [], toolkits: [], tiers: {} };

base.version = 2;
base.updated = new Date().toISOString().slice(0, 10);
base.description = 'Répertoire canonique CapsuleOS — gel noyau (0 active) ; source unique portail, agents, CI.';
base.kernelSpecVersion = kernelsDoc.kernelSpecVersion;
base.kernels = kernelsDoc.kernels;
base.linuxBranches = kernelsDoc.linuxBranches;

if (sourcingOverlay.assetPolicy) {
  base.assetPolicy = sourcingOverlay.assetPolicy;
}

// Compléter sourcing pour entrées manquantes
const entries = getRawEntries().map(freezeEntry);
const sourcingEntries = { ...sourcingOverlay.entries };
entries.forEach((e) => {
  if (!sourcingEntries[e.id]) {
    sourcingEntries[e.id] = { licenseNotes: 'À documenter — entrée auto-générée' };
  }
});
if (!fs.existsSync(SOURCING) || Object.keys(sourcingOverlay.entries || {}).length < entries.length) {
  const sourcingOut = {
    ...sourcingOverlay,
    version: 2,
    updated: base.updated,
    entries: sourcingEntries
  };
  fs.writeFileSync(SOURCING, `${JSON.stringify(sourcingOut, null, 2)}\n`, 'utf8');
}

base.entries = entries;
base.stats = {
  total: entries.length,
  active: entries.filter((e) => e.status === 'active').length,
  planned: entries.filter((e) => e.status === 'planned').length,
  stub: entries.filter((e) => e.status === 'stub').length,
  frozen: entries.every((e) => e.status !== 'active'),
  reactivated: reactivationIds.length
};

base.tiers = base.tiers || {
  P0: 'Référence pédagogique — figer, ne pas casser',
  P1: 'Production active — parité fonctionnelle checklist',
  P2: 'Planifié haute valeur — distro ou version majeure',
  P3: 'Planifié moyen — extension catalogue',
  P4: 'Recherche / stub — faisabilité, pas de promesse UX'
};

fs.writeFileSync(OUT, `${JSON.stringify(base, null, 2)}\n`, 'utf8');
console.log(`Écrit ${OUT} — ${base.stats.total} entrées (${base.stats.active} actives, gel=${base.stats.frozen})`);
