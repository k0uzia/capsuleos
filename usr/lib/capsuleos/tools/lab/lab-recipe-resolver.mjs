/**
 * Résolveur recette lab — algorithme adaptatif P11 / R-LOC1.
 *
 * Modèle :
 *   P(d)  = profil registryId d (lab-recipe-profiles.json + override env)
 *   A(d,k) = artefact matrice kind k pour d
 *   R-LOC1 : A(d,k) doit exister et registry(A) = d — jamais emprunt silencieux
 *
 * Hot-reload : éditer le profil ou une matrice JSON → prochain run sans redéploiement code.
 */
import fs from 'fs';
import path from 'path';
import {
  ROOT,
  evaluatePredicates,
  loadContract,
  loadRegistryEntry,
  vendorFromRegistry,
} from './replication-chain-lib.mjs';
import { filterCampaignPhases, shouldSkipCampaignPhase } from './differential-campaign-lib.mjs';

export { ROOT };

const PROFILES_PATH = path.join(ROOT, 'etc/capsuleos/contracts/lab-recipe-profiles.json');
const INVENTORY_PATH = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const LAB_TOOLS = path.join(ROOT, 'root/tools/lab');

export const loadRecipeContract = () => JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));

const readJsonIfExists = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const mergeDeep = (base, patch) => {
  if (!patch || typeof patch !== 'object') return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = mergeDeep(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

/** Profil effectif P(d) — contrat + entrée registre + CAPSULE_RECIPE_OVERRIDE JSON */
export const loadRecipeProfile = (registryId) => {
  const contract = loadRecipeContract();
  const entry = loadRegistryEntry(registryId);
  const vendor = entry.vendor || vendorFromRegistry(registryId);
  const base = contract.profiles?.[registryId] || {
    toolkit: entry.toolkit || 'gnome',
    vendor,
    matrices: {},
    scripts: {},
  };
  let profile = {
    registryId,
    toolkit: base.toolkit || entry.toolkit || 'gnome',
    vendor: base.vendor || vendor,
    upstreamId: base.upstreamId || entry.upstreamId || null,
    coherenceContract: base.coherenceContract || contract.coherenceContract || null,
    storeCampaign: base.storeCampaign || null,
    matrices: { ...(base.matrices || {}) },
    scripts: { ...(base.scripts || {}) },
    bootstrap: base.bootstrap || null,
    notes: base.notes || null,
  };

  const overridePath = process.env.CAPSULE_RECIPE_OVERRIDE;
  if (overridePath && fs.existsSync(overridePath)) {
    const patch = JSON.parse(fs.readFileSync(overridePath, 'utf8'));
    const scoped = patch[registryId] || patch;
    profile = mergeDeep(profile, scoped);
    profile.registryId = registryId;
  }

  return profile;
};

const vendorMatrixPath = (kind, vendor) => {
  const contract = loadRecipeContract();
  const pattern = contract.matrixKinds?.[kind]?.vendorPattern;
  if (!pattern) throw new Error(`kind matrice inconnu: ${kind}`);
  return path.join(ROOT, pattern.replace('{vendor}', vendor));
};

const legacyMatrixPath = (kind) => {
  const legacy = {
    parity: 'gnome-settings-parity-matrix.json',
    assets: 'gnome-settings-assets-matrix.json',
    visual: 'gnome-settings-visual-investigation-matrix.json',
  }[kind];
  return legacy ? path.join(LAB_TOOLS, legacy) : null;
};

const assertRegistryMatch = (registryId, matrixPath, matrixJson) => {
  const declared = matrixJson?.registry;
  if (!declared) return;
  if (declared !== registryId) {
    throw new Error(
      `R-LOC1: ${path.relative(ROOT, matrixPath)} déclare registry=${declared} `
      + `≠ ${registryId} — créer gnome-settings-*-matrix-${vendorFromRegistry(registryId)}.json`,
    );
  }
};

/**
 * Résout A(d,k). strict=true (défaut) → FAIL R-LOC1 si absent ou registry incohérent.
 * @returns {{ absolute: string, relative: string, source: 'profile'|'vendor'|'legacy' }}
 */
export const resolveLabMatrix = (registryId, kind, opts = {}) => {
  const strict = opts.strict !== false;
  const profile = loadRecipeProfile(registryId);
  const vendor = profile.vendor;

  const candidates = [];
  if (profile.matrices?.[kind]) {
    candidates.push({ source: 'profile', path: path.join(ROOT, profile.matrices[kind]) });
  }
  candidates.push({ source: 'vendor', path: vendorMatrixPath(kind, vendor) });

  for (const c of candidates) {
    if (!fs.existsSync(c.path)) continue;
    const json = readJsonIfExists(c.path);
    if (json) assertRegistryMatch(registryId, c.path, json);
    return {
      absolute: c.path,
      relative: path.relative(ROOT, c.path),
      source: c.source,
      registry: json?.registry || registryId,
    };
  }

  const legacy = legacyMatrixPath(kind);
  if (legacy && fs.existsSync(legacy)) {
    const json = readJsonIfExists(legacy);
    if (json?.registry === registryId) {
      return {
        absolute: legacy,
        relative: path.relative(ROOT, legacy),
        source: 'legacy',
        registry: registryId,
      };
    }
    if (strict) {
      const expected = vendorMatrixPath(kind, vendor);
      throw new Error(
        `R-LOC1: matrice ${kind} absente pour ${registryId}. `
        + `Attendu: ${path.relative(ROOT, expected)}. `
        + `Legacy ${path.relative(ROOT, legacy)} est lié à ${json?.registry || '?'}. `
        + `Bootstrap: node usr/lib/capsuleos/tools/lab/bootstrap-gnome-settings-matrices.mjs --id ${registryId} --write`,
      );
    }
  }

  if (strict) {
    const expected = profile.matrices?.[kind] || vendorMatrixPath(kind, vendor);
    throw new Error(
      `R-LOC1: matrice ${kind} absente pour ${registryId}. `
      + `Créer ${path.relative(ROOT, expected)} ou lancer bootstrap-gnome-settings-matrices.mjs --id ${registryId} --write`,
    );
  }

  return null;
};

export const loadLabHost = (registryId) => {
  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error('etc/capsuleos/lab-inventory.json manquant');
  }
  const inv = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === registryId);
  if (!host) throw new Error(`Hôte lab inconnu: ${registryId}`);
  return host;
};

/** Variables d'environnement graphique SSH — dérivées du profil hôte (modifiable via lab-inventory). */
export const buildRemoteEnv = (host) => {
  const parts = [
    `export DISPLAY=${host.display || ':0'}`,
    'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus',
    'export XDG_RUNTIME_DIR=/run/user/$(id -u)',
    `export XDG_CURRENT_DESKTOP=${host.desktop || 'GNOME'}`,
  ];
  if (host.xauthorityDiscovery === 'mutter-xwayland') {
    parts.push('export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)');
  }
  return parts.join('; ');
};

/** Base HTTP Capsule — lab-inventory capsuleUrl ou CAPSULE_HTTP_BASE ou défaut :5500 */
export const resolveCapsuleHttpBase = (registryId) => {
  if (process.env.CAPSULE_HTTP_BASE) {
    return process.env.CAPSULE_HTTP_BASE.replace(/\/$/, '');
  }
  try {
    const host = loadLabHost(registryId);
    if (host.capsuleUrl) {
      const u = new URL(host.capsuleUrl);
      return `${u.protocol}//${u.host}`;
    }
  } catch {
    /* ignore */
  }
  return 'http://127.0.0.1:5500';
};

export const resolveSshIdentity = (host) => {
  if (process.env.CAPSULE_LAB_SSH_IDENTITY) return process.env.CAPSULE_LAB_SSH_IDENTITY;
  if (host.sshIdentity) {
    return path.join(process.env.HOME || '', host.sshIdentity.replace(/^~\//, ''));
  }
  return path.join(process.env.HOME || '', '.ssh/capsuleos-lab');
};

/** Écarts recette — artefacts manquants pour exécuter la collecte playbook GNOME. */
export const evaluateRecipeGaps = (registryId) => {
  const profile = loadRecipeProfile(registryId);
  const kinds = Object.keys(loadRecipeContract().matrixKinds || {});
  const gaps = [];
  const resolved = {};

  for (const kind of kinds) {
    try {
      resolved[kind] = resolveLabMatrix(registryId, kind, { strict: true });
    } catch (e) {
      gaps.push({ kind, error: e.message });
    }
  }

  let hostOk = false;
  let hostError = null;
  try {
    loadLabHost(registryId);
    hostOk = true;
  } catch (e) {
    hostError = e.message;
  }

  return {
    registryId,
    toolkit: profile.toolkit,
    vendor: profile.vendor,
    matrices: resolved,
    gaps,
    hostOk,
    hostError,
    ready: gaps.length === 0 && hostOk,
    bootstrap: profile.bootstrap || null,
  };
};

const fillRegistryTemplate = (template, registryId, vendor) => (
  template
    .replace(/\{id\}/g, registryId)
    .replace(/\{vendor\}/g, vendor)
);

/**
 * Prochaine action chaîne réplication quand aucun step contract.steps ne matche
 * (ex. prédicat H2/L/A sans step dédié) — complète le DAG gates.
 */
export const resolveChainPredicateAction = (registryId, domain = 'gnome-settings-playbook') => {
  const contract = loadContract();
  const vendor = vendorFromRegistry(registryId);
  const evalResult = evaluatePredicates(registryId, domain);
  const { nextPredicate, state } = evalResult;
  if (!nextPredicate) return { complete: true, evalResult };

  const check = contract.predicateChecks?.[nextPredicate];
  if (!check) {
    return {
      complete: false,
      nextPredicate,
      rule: 'R-CHAIN-GAP',
      message: `Prédicat ${nextPredicate} sans predicateCheck`,
      command: null,
      evalResult,
    };
  }

  if (check.script) {
    const args = (check.args || []).map((a) => {
      if (a === '--registry' || a === '--id') return a;
      return a;
    });
    const argv = [];
    for (const a of check.args || []) {
      if (a === '--registry') argv.push('--registry', registryId);
      else if (a === '--id') argv.push('--id', registryId);
      else argv.push(a);
    }
    if (check.script.includes('verify-playbook-assets') && !argv.includes('--registry')) {
      argv.push('--registry', registryId);
    }
    if (check.script.includes('run-gnome-settings-lab') && !argv.includes('--id')) {
      argv.push('--id', registryId, '--profile', 'visual-prereq');
    }
    return {
      complete: false,
      nextPredicate,
      rule: `R-CHAIN-${nextPredicate}`,
      message: `Gate ${nextPredicate} — ${check.gate || check.script}`,
      command: `node ${check.script}${argv.length ? ` ${argv.join(' ')}` : ''}`,
      autoExecute: true,
      evalResult,
    };
  }

  if (check.inventory) {
    const invRel = fillRegistryTemplate(check.inventory, registryId, vendor);
    const invPath = path.join(ROOT, invRel);
    if (!fs.existsSync(invPath)) {
      return {
        complete: false,
        nextPredicate,
        rule: `R-CHAIN-${nextPredicate}`,
        message: `Inventaire requis absent: ${invRel}`,
        command: null,
        evalResult,
      };
    }
  }

  return {
    complete: false,
    nextPredicate,
    rule: 'R-CHAIN-UNKNOWN',
    message: `Prédicat ${nextPredicate} non résolu (état=${state[nextPredicate]})`,
    command: null,
    evalResult,
  };
};

/** Résout step contract.steps ou fallback predicateCheck. */
export const resolveChainNextAction = (registryId, domain = 'gnome-settings-playbook') => {
  const contract = loadContract();
  const evalResult = evaluatePredicates(registryId, domain);
  const state = evalResult.state;

  for (const step of contract.steps || []) {
    const neg = (step.negates || []).every((sym) => state[sym] === false);
    const req = (step.requires || []).every((sym) => state[sym] === true);
    if (neg && req) {
      const argv = (step.args || []).flatMap((a) => {
        if (a === '--id') return ['--id', registryId];
        if (a === '--registry') return ['--registry', registryId];
        return [a];
      });
      return {
        complete: false,
        stepId: step.id,
        rule: `R-CHAIN-STEP-${step.id}`,
        message: `Étape chaîne ${step.id}`,
        command: `node ${step.script} ${argv.join(' ')}`,
        autoExecute: true,
        evalResult,
      };
    }
  }

  return resolveChainPredicateAction(registryId, domain);
};

const COHERENCE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/os-reproduction-coherence.json');

const STEP_PHASE_MAP = {
  'store-vm-inventory': ['CR-1', 'CR-2'],
  'store-content-contract': ['CR-4'],
  'store-capsule-captures': ['CR-5'],
  'store-parity-enrich': ['CR-3', 'CR-6'],
};

/** Phases CR actives pour registryId (storeCampaign.campaignPhases ou CR-0…CR-6 complet). */
export const loadCampaignPhases = (registryId, opts = {}) => {
  const profile = loadRecipeProfile(registryId);
  let phases = profile.storeCampaign?.campaignPhases;
  if (!phases?.length) {
    const coherence = readJsonIfExists(COHERENCE_PATH);
    phases = (coherence?.campaignRecipe?.phases || []).map((p) => p.id);
  }
  if (opts.applyDifferentialSkip !== false) {
    return filterCampaignPhases(registryId, phases);
  }
  return phases;
};

export const stepAllowedForCampaign = (stepId, registryId) => {
  const allowedPhases = loadCampaignPhases(registryId);
  const stepPhases = STEP_PHASE_MAP[stepId];
  if (!stepPhases) return true;
  return stepPhases.some((ph) => allowedPhases.includes(ph));
};

export const loadCoherencePhases = () => {
  const coherence = readJsonIfExists(COHERENCE_PATH);
  return coherence?.campaignRecipe?.phases || [];
};

/** Prochaine phase CR avec commande (filtrée par campaignPhases). */
export const resolveCoherencePhaseAction = (registryId) => {
  const allowed = new Set(loadCampaignPhases(registryId));
  const phases = loadCoherencePhases();
  const vendor = vendorFromRegistry(registryId);

  for (const phase of phases) {
    if (!allowed.has(phase.id)) continue;
    if (shouldSkipCampaignPhase(registryId, phase.id).skip) continue;
    const cmd = (phase.command || '').replace(/\{registryId\}/g, registryId).replace(/\{httpBase\}/g, resolveCapsuleHttpBase(registryId));
    if (!cmd) continue;
    return {
      complete: false,
      phaseId: phase.id,
      rule: `R-CR-${phase.id}`,
      message: phase.label || phase.id,
      command: cmd.startsWith('node ') ? cmd : `node ${cmd}`,
      autoExecute: phase.id === 'CR-0' || phase.id.startsWith('CR-'),
      registryId,
    };
  }
  return { complete: true, registryId };
};
