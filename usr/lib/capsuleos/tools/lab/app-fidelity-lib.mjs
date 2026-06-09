/**
 * Bibliothèque crédibilité pédagogique — prédicats Cred* et règles R-CRED*.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/app-fidelity-scenarios.json');

export const credPathsForRegistry = (registryId) => ({
  registryId,
  contract: CONTRACT_PATH,
  inventory: path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`),
  gaps: path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-gaps.json`),
  replicationState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`),
  credFormalState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-credibility-formal-state.json`),
  formalState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-formal-state.json`),
});

export const readJsonIfExists = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const loadCredContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const loadInventory = (registryId) => {
  const p = credPathsForRegistry(registryId).inventory;
  if (!fs.existsSync(p)) {
    throw new Error(`Inventaire crédibilité manquant: ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const loadGaps = (registryId) => readJsonIfExists(credPathsForRegistry(registryId).gaps);

export const scenarioPred = (scenario, key) => {
  const preds = scenario.predicates || {};
  return preds[key] === true;
};

export const computeSummary = (inventory) => {
  const scenarios = inventory.scenarios || [];
  let documented = 0;
  let implemented = 0;
  let smokeOk = 0;
  let measured = 0;
  let piSum = 0;
  let piCount = 0;

  scenarios.forEach((s) => {
    if (scenarioPred(s, 'CredV') || (s.steps && s.steps.length > 0)) documented += 1;
    if (scenarioPred(s, 'CredC')) implemented += 1;
    if (scenarioPred(s, 'CredS')) smokeOk += 1;
    if (s.pi_credibility !== null && s.pi_credibility !== undefined) {
      measured += 1;
      piSum += s.pi_credibility;
      piCount += 1;
    }
  });

  const apps = inventory.apps || [];
  let appsAtPi100 = 0;
  apps.forEach((a) => {
    if (a.pi_credibility === 100) appsAtPi100 += 1;
  });

  const total = scenarios.length;
  return {
    totalScenarios: total,
    documented,
    implemented,
    smokeOk,
    measured,
    avgPi: piCount > 0 ? Math.round(piSum / piCount) : null,
    appsTotal: apps.length,
    appsAtPi100,
    documentedPct: total > 0 ? Math.round((documented / total) * 100) : 0,
    implementedPct: total > 0 ? Math.round((implemented / total) * 100) : 0,
    smokePct: total > 0 ? Math.round((smokeOk / total) * 100) : 0,
  };
};

export const loadCredFormalState = (registryId) => {
  const paths = credPathsForRegistry(registryId);
  const base = readJsonIfExists(paths.credFormalState) || { registryId, gates: {} };
  const mainFormal = readJsonIfExists(paths.formalState);
  const h2Ok = base.gates?.H2?.ok === true || mainFormal?.gates?.H2?.ok === true;
  return {
    registryId,
    gates: {
      ...base.gates,
      H2: h2Ok,
      CredS_live: base.gates?.CredS?.liveVerified === true,
      CredSigma_written: base.gates?.CredΣ?.ok === true
        || base.predicates?.CredΣ === true,
    },
    predicates: base.predicates || {},
    updatedAt: base.updatedAt || null,
  };
};

export const evaluateCredPredicates = (registryId) => {
  const contract = loadCredContract();
  const inventory = loadInventory(registryId);
  const gaps = loadGaps(registryId);
  const summary = inventory.summary || computeSummary(inventory);
  const total = summary.totalScenarios || 0;
  const gapSlotsTotal = gaps?.summary?.gapSlotsTotal ?? null;

  const CredV = total > 0 && summary.documented === total;
  const CredC = total > 0 && summary.implemented === total;
  const CredS = total > 0 && summary.smokeOk === total;
  const CredPi = summary.appsAtPi100 === summary.appsTotal
    && summary.appsTotal > 0
    && gapSlotsTotal === 0;
  const CredSigma = CredV && CredC && CredS && CredPi;

  const state = {
    CredV,
    CredC,
    CredS,
    CredPi,
    CredSigma,
    CredΠ: CredPi,
    CredΣ: CredSigma,
  };

  const order = ['CredV', 'CredC', 'CredS', 'CredPi', 'CredSigma'];
  let nextPredicate = null;
  for (const sym of order) {
    if (!state[sym]) {
      nextPredicate = sym === 'CredPi' ? 'CredΠ' : sym === 'CredSigma' ? 'CredΣ' : sym;
      break;
    }
  }

  return {
    registryId,
    state,
    nextPredicate,
    gaps,
    summary,
    contract,
  };
};

export const recordCredGate = (registryId, gate, ok, meta = {}) => {
  const p = credPathsForRegistry(registryId).credFormalState;
  const base = readJsonIfExists(p) || { registryId, gates: {} };
  base.gates = base.gates || {};
  base.gates[gate] = { ok: !!ok, at: new Date().toISOString(), ...meta };
  base.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, `${JSON.stringify(base, null, 2)}\n`);
  return base;
};

export const writeCredFormalStatus = (registryId) => {
  const evalResult = evaluateCredPredicates(registryId);
  const paths = credPathsForRegistry(registryId);
  const credFormal = readJsonIfExists(paths.credFormalState) || { registryId, gates: {} };
  const now = new Date().toISOString();

  credFormal.registryId = registryId;
  credFormal.predicates = {
    CredV: evalResult.state.CredV,
    CredC: evalResult.state.CredC,
    CredS: evalResult.state.CredS,
    CredΠ: evalResult.state.CredPi,
    CredΣ: evalResult.state.CredSigma,
  };
  credFormal.summary = evalResult.summary;
  credFormal.nextPredicate = evalResult.nextPredicate;
  credFormal.evaluatedAt = now;
  credFormal.updatedAt = now;
  if (evalResult.state.CredSigma) {
    credFormal.gates = credFormal.gates || {};
    credFormal.gates['CredΣ'] = {
      ok: true,
      at: now,
      rule: 'R-CRED-Σ',
    };
  }
  fs.writeFileSync(paths.credFormalState, `${JSON.stringify(credFormal, null, 2)}\n`);

  let repState = readJsonIfExists(paths.replicationState) || { registryId };
  repState.credibilityCampaign = repState.credibilityCampaign || {};
  repState.credibilityCampaign.credSigma = evalResult.state.CredSigma;
  repState.credibilityCampaign.evaluatedAt = now;
  repState.credibilityCampaign.predicates = {
    CredV: evalResult.state.CredV,
    CredC: evalResult.state.CredC,
    CredS: evalResult.state.CredS,
    CredΠ: evalResult.state.CredPi,
    CredΣ: evalResult.state.CredSigma,
  };
  repState.credibilityCampaign.scenarios = {
    total: evalResult.summary.totalScenarios,
    credV: evalResult.summary.documented,
    credC: evalResult.summary.implemented,
    credS: evalResult.summary.smokeOk,
    appsAtPi100: evalResult.summary.appsAtPi100,
  };
  if (evalResult.state.CredSigma) {
    repState.credibilityCampaign.currentPhase = 'P-F3-complete';
    repState.credibilityCampaign.formalClosedAt = now;
  }
  repState.updatedAt = now;
  fs.writeFileSync(paths.replicationState, `${JSON.stringify(repState, null, 2)}\n`);

  return { credFormal, replicationState: repState, evalResult };
};

/**
 * Règles R-CRED* — première admissible prime.
 */
export const evaluateCredRules = (registryId) => {
  const evalResult = evaluateCredPredicates(registryId);
  const formal = loadCredFormalState(registryId);
  const paths = credPathsForRegistry(registryId);
  const repState = readJsonIfExists(paths.replicationState);
  const credFormalExists = fs.existsSync(paths.credFormalState);
  const repCredSigma = repState?.credibilityCampaign?.credSigma === true;

  const rules = [
    {
      rule: 'R-CRED-H2',
      when: () => !formal.gates.H2,
      message: '¬H₂ — gate validate-all (socle dépôt)',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: true,
      gateOnSuccess: 'H2',
    },
    {
      rule: 'R-CRED-SMOKE-ALL',
      when: () => evalResult.state.CredC && !formal.gates.CredS_live,
      message: 'CredC ∧ ¬CredS_live — smoke batch tous scénarios',
      command: `CAPSULE_HTTP_BASE=${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500'} node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-all.mjs --id ${registryId}`,
      autoExecute: true,
      gateOnSuccess: 'CredS',
    },
    {
      rule: 'R-CRED-FORMAL',
      when: () => evalResult.state.CredS && (!credFormalExists || !formal.gates.CredSigma_written),
      message: 'CredS inventaire ∧ ¬formal — écriture état formel Cred*',
      command: `node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id ${registryId} --phase formal-write`,
      autoExecute: true,
      gateOnSuccess: null,
    },
    {
      rule: 'R-CRED-Σ',
      when: () => evalResult.state.CredSigma && !repCredSigma,
      message: 'CredΣ — clôture replication-state crédibilité',
      command: `node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id ${registryId} --phase formal-write`,
      autoExecute: true,
      gateOnSuccess: 'CredΣ',
    },
    {
      rule: 'R-CRED-DONE',
      when: () => evalResult.state.CredSigma && repCredSigma,
      message: 'CredΣ clôturé — maintenance validate-all',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: false,
      gateOnSuccess: null,
    },
  ];

  for (const spec of rules) {
    if (!spec.when()) continue;
    return {
      registryId,
      scope: 'app-fidelity',
      rule: spec.rule,
      message: spec.message,
      command: spec.command,
      autoExecute: spec.autoExecute,
      gateOnSuccess: spec.gateOnSuccess || null,
      unique: true,
      predicates: evalResult.state,
      summary: evalResult.summary,
      nextPredicate: evalResult.nextPredicate,
    };
  }

  return {
    registryId,
    scope: 'app-fidelity',
    rule: 'R-CRED-IDLE',
    message: 'Aucune règle R-CRED* admissible',
    command: null,
    autoExecute: false,
    unique: true,
    predicates: evalResult.state,
    summary: evalResult.summary,
    nextPredicate: evalResult.nextPredicate,
  };
};
