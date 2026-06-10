/**
 * Chaîne fidélité magasin GNOME Software — prédicats StoreG / StoreΣ / StoreVc / StoreVp.
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { evaluateUniversal } from './playbook-general-lib.mjs';
import {
  loadRecipeProfile,
  resolveCapsuleHttpBase,
  stepAllowedForCampaign,
} from './lab-recipe-resolver.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/store-replication-chain.json');
const SLOTS_PATH = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');
const CONTENT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/gnome-software-store-content.json');

const GNOME_INDEX_BY_REGISTRY = {
  'linux-fedora': 'home/RedHat/Fedora/index.html',
  'linux-rocky': 'home/RedHat/Rocky/index.html',
  'linux-alma': 'home/RedHat/Alma/index.html',
  'linux-anduinos': 'home/Debian/AnduinOS/index.html',
  'linux-ubuntu': 'home/Debian/Ubuntu/index.html',
};

export const loadStoreReplicationContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const storeAppliesToRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const profile = loadRecipeProfile(registryId);
  const toolkit = profile.toolkit || entry.toolkit || 'gnome';
  return toolkit === 'gnome' && !!(profile.storeCampaign || GNOME_INDEX_BY_REGISTRY[registryId]);
};

export const storePathsForRegistry = (registryId) => ({
  visualInvestigation: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`),
  storeReplicationState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-store-replication-state.json`),
});

const checkStoreG = (registryId) => {
  const slots = readJson(SLOTS_PATH);
  const content = readJson(CONTENT_PATH);
  const slot = slots?.slots?.update_manager;
  const groundMod = slot?.groundKernelModule || 'usr/lib/capsuleos/shells/linux/gnome-software-ground.js';
  const groundOk = fs.existsSync(path.join(ROOT, groundMod));
  const byReg = content?.byRegistry?.[registryId];
  const contentOk = !!byReg && (byReg.exploreFeaturedIds?.length > 0 || byReg.chromeProfile);
  const idxRel = GNOME_INDEX_BY_REGISTRY[registryId];
  let indexOk = false;
  if (idxRel && fs.existsSync(path.join(ROOT, idxRel))) {
    const html = fs.readFileSync(path.join(ROOT, idxRel), 'utf8');
    indexOk = html.includes('gnome-software-ground.js');
  }
  return groundOk && contentOk && indexOk;
};

const checkStoreSigma = (registryId) => {
  const content = readJson(CONTENT_PATH);
  const byReg = content?.byRegistry?.[registryId];
  if (!byReg?.exploreFeaturedIds?.length) return false;
  const genPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-gnome-software-content.js');
  return fs.existsSync(genPath) && byReg.exploreFeaturedIds.length >= 6;
};

const checkStoreVc = (registryId) => {
  const inv = readJson(storePathsForRegistry(registryId).visualInvestigation);
  const min = loadStoreReplicationContract().predicates?.StoreVc?.min ?? 4;
  return (inv?.summary?.softwareViewsCapsule ?? 0) >= min;
};

const checkStoreVp = (registryId) => {
  const inv = readJson(storePathsForRegistry(registryId).visualInvestigation);
  const slot = loadStoreReplicationContract().predicates?.StoreVp?.slot || 'update_manager';
  const target = loadStoreReplicationContract().predicates?.StoreVp?.target || 'ok';
  const item = (inv?.investigations || []).find((i) => i.controlId === slot);
  const match = item?.capsuleParity?.visualMatch;
  if (!match || match === 'unknown') return false;
  if (target === 'ok') return match === 'ok';
  const allowed = loadStoreReplicationContract().predicates?.StoreVp?.allowed || ['ok', 'partial'];
  return allowed.includes(match);
};

export const evaluateStorePredicates = (registryId) => {
  if (!storeAppliesToRegistry(registryId)) {
    return {
      registryId,
      domain: 'store-ground',
      skipped: true,
      state: { StoreG: true, StoreΣ: true, StoreVc: true, StoreVp: true },
      nextPredicate: null,
      contract: loadStoreReplicationContract(),
    };
  }

  const universal = evaluateUniversal(registryId);
  const state = {
    M: !!universal.state.M,
    StoreG: checkStoreG(registryId),
    StoreΣ: checkStoreSigma(registryId),
    StoreVc: checkStoreVc(registryId),
    StoreVp: checkStoreVp(registryId),
  };

  const order = ['StoreG', 'StoreΣ', 'StoreVc', 'StoreVp'];
  let nextPredicate = null;
  for (const sym of order) {
    if (!state[sym]) {
      nextPredicate = sym;
      break;
    }
  }

  return {
    registryId,
    domain: 'store-ground',
    skipped: false,
    state,
    nextPredicate,
    paths: storePathsForRegistry(registryId),
    contract: loadStoreReplicationContract(),
  };
};

export const writeStoreReplicationState = (evalResult) => {
  const out = {
    registryId: evalResult.registryId,
    domain: evalResult.domain,
    skipped: evalResult.skipped,
    generatedAt: new Date().toISOString(),
    predicates: evalResult.state,
    nextPredicate: evalResult.nextPredicate,
    nextStep: null,
    rule: null,
  };
  for (const step of evalResult.contract.steps || []) {
    const neg = (step.negates || []).some((sym) => !evalResult.state[sym]);
    const req = (step.requires || []).every((sym) => evalResult.state[sym]);
    if (neg && req) {
      out.nextStep = step.id;
      out.rule = `R-STORE-CHAIN → ${step.id}`;
      break;
    }
  }
  fs.writeFileSync(evalResult.paths.storeReplicationState, `${JSON.stringify(out, null, 2)}\n`);
  return out;
};

const buildStepCommand = (step, registryId) => {
  const contract = loadStoreReplicationContract();
  const groundRef = contract.groundReferenceRegistryId || 'linux-fedora';
  const argv = [];
  for (const a of step.args || []) {
    if (a === '--id') {
      argv.push('--id', step.id === 'store-vm-inventory' ? groundRef : registryId);
    } else argv.push(a);
  }
  let cmd = `node ${step.script}${argv.length ? ` ${argv.join(' ')}` : ''}`;
  if (step.id === 'store-capsule-captures') {
    const base = resolveCapsuleHttpBase(registryId);
    cmd = `CAPSULE_HTTP_BASE=${base} ${cmd}`;
  }
  return cmd;
};

/** Prochaine action chaîne store (steps filtrés par campaignPhases). */
export const resolveStoreNextAction = (registryId) => {
  const evalResult = evaluateStorePredicates(registryId);
  if (evalResult.skipped) {
    return { complete: true, evalResult, registryId };
  }

  for (const step of evalResult.contract.steps || []) {
    if (!stepAllowedForCampaign(step.id, registryId)) continue;
    const neg = (step.negates || []).some((sym) => !evalResult.state[sym]);
    const req = (step.requires || []).every((sym) => evalResult.state[sym]);
    if (neg && req) {
      return {
        complete: false,
        stepId: step.id,
        rule: `R-STORE-${step.id.toUpperCase().replace(/-/g, '_')}`,
        message: step.note || `Étape store ${step.id}`,
        command: buildStepCommand(step, registryId),
        autoExecute: true,
        evalResult,
        registryId,
      };
    }
  }

  if (evalResult.nextPredicate) {
    const pred = evalResult.nextPredicate;
    const fallback = {
      StoreG: `node usr/lib/capsuleos/tools/linux/sync-gnome-toolkit-pack.mjs && node usr/lib/capsuleos/tools/generate-store-catalog.mjs`,
      StoreΣ: 'node usr/lib/capsuleos/tools/generate-store-catalog.mjs',
      StoreVc: `CAPSULE_HTTP_BASE=${resolveCapsuleHttpBase(registryId)} node usr/lib/capsuleos/tools/lab/capture-capsule-software-views.mjs --id ${registryId}`,
      StoreVp: `node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id ${registryId}`,
    };
    return {
      complete: false,
      nextPredicate: pred,
      rule: `R-STORE-${pred}`,
      message: `Prédicat store ${pred} incomplet`,
      command: fallback[pred] || null,
      autoExecute: !!fallback[pred],
      evalResult,
      registryId,
    };
  }

  return { complete: true, evalResult, registryId };
};
