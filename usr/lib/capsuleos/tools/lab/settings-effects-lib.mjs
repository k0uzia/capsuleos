/**
 * Prédicats couche Se — Paramètres → bus capsule:* (settings-effects-chain.json).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { loadRecipeProfile, resolveLabMatrix } from './lab-recipe-resolver.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json');

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const settingsEffectsStatePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-settings-effects-state.json`);

export const loadSettingsEffectsContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const settingsEffectsAppliesToRegistry = (registryId) => {
  const profile = loadRecipeProfile(registryId);
  const contract = loadSettingsEffectsContract();
  return !!contract.toolkitChains?.[profile.toolkit || 'gnome'];
};

const verifyGateRel = (registryId) => {
  const profile = loadRecipeProfile(registryId);
  const contract = loadSettingsEffectsContract();
  return contract.toolkitChains?.[profile.toolkit || 'gnome']?.verifyGate || null;
};

export const settingsEffectsVerifyCommand = (registryId) => {
  const gate = verifyGateRel(registryId);
  return gate ? `node ${gate} --id ${registryId}` : null;
};

const checkSeDocumented = (registryId) => {
  if (!fs.existsSync(CONTRACT_PATH)) return false;
  try {
    resolveLabMatrix(registryId, 'parity', { strict: true });
    return !!verifyGateRel(registryId);
  } catch {
    return false;
  }
};

const readStateFile = (registryId) => readJson(settingsEffectsStatePath(registryId));

export const evaluateSettingsEffectsPredicates = (registryId) => {
  if (!settingsEffectsAppliesToRegistry(registryId)) {
    return {
      registryId,
      domain: 'settings-effects',
      skipped: true,
      state: { Se: true, SeΣ: true },
      nextPredicate: null,
    };
  }

  const stateFile = readStateFile(registryId);
  const documented = checkSeDocumented(registryId);
  const state = {
    Se: !!(stateFile?.predicates?.Se ?? documented),
    SeΣ: !!stateFile?.predicates?.SeΣ,
  };

  let nextPredicate = null;
  if (!state.Se) nextPredicate = 'Se';
  else if (!state.SeΣ) nextPredicate = 'SeΣ';

  return {
    registryId,
    domain: 'settings-effects',
    skipped: false,
    state,
    nextPredicate,
    verifyGate: verifyGateRel(registryId),
    statePath: settingsEffectsStatePath(registryId),
  };
};

export const writeSettingsEffectsState = (registryId, predicates, meta = {}) => {
  const out = {
    registryId,
    domain: 'settings-effects',
    generatedAt: new Date().toISOString(),
    predicates: {
      Se: !!predicates.Se,
      SeΣ: !!predicates.SeΣ,
    },
    ...meta,
  };
  fs.writeFileSync(settingsEffectsStatePath(registryId), `${JSON.stringify(out, null, 2)}\n`);
  return out;
};
