/**
 * Bibliothèque campagne G-coherence KDE Neon.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readReplicationState, writeReplicationState, replicationStatePath } from './clone-cycle-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/kde-coherence-campaign.json');
const DEFAULT_REGISTRY = 'linux-kde-neon';

export const loadCoherenceContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const phaseFromPallier = (contract, pallier) => {
  const phases = contract.phases || [];
  return phases.find((p) => p.pallier === pallier) || null;
};

export const nextPhaseAfter = (contract, pallier) => phaseFromPallier(contract, pallier + 1);

const GATE_SCRIPTS_WITH_ID = [
  'verify-kde-settings-parity-chain.mjs',
  'smoke-h6-kde-settings-ready.mjs',
  'run-kde-ui-state-effects-pass.mjs',
  'smoke-kde-fidelity-all.mjs',
  'run-kde-neon-pass.mjs',
  'capture-clone-surfaces.mjs',
];

export const expandGateArgs = (gate, registryId) => {
  const out = [];
  let hasId = false;
  (gate.args || []).forEach((a) => {
    if (a === '--id') {
      out.push('--id', registryId);
      hasId = true;
    } else {
      out.push(a);
    }
  });
  if (!hasId && registryId) {
    const script = gate.script || '';
    const needsId = GATE_SCRIPTS_WITH_ID.some((name) => script.includes(name));
    if (needsId) {
      out.push('--id', registryId);
    }
  }
  return out;
};

export const gateNeedsHttp = (gate) => {
  if (gate.env && gate.env.CAPSULE_HTTP_BASE) return true;
  const script = gate.script || '';
  return /smoke-|run-kde-ui-state|run-kde-neon-pass|capture-clone/.test(script);
};

export const evaluateCoherenceStatus = (registryId = DEFAULT_REGISTRY) => {
  const contract = loadCoherenceContract();
  const state = readReplicationState(registryId) || { registryId };
  const pallier = typeof state.gCoherencePallier === 'number' ? state.gCoherencePallier : -1;
  const nextPallier = typeof state.gCoherenceNextPallier === 'number'
    ? state.gCoherenceNextPallier
    : pallier + 1;
  const current = phaseFromPallier(contract, pallier);
  const upcoming = phaseFromPallier(contract, nextPallier);
  const phasesTotal = (contract.phases || []).length;
  const complete = state.campaignGCoherenceStatus === 'closed'
    || nextPallier >= phasesTotal;

  return {
    registryId,
    contractVersion: contract.version,
    pallier,
    nextPallier,
    currentPhase: current ? current.id : null,
    nextPhase: upcoming ? upcoming.id : null,
    phasesTotal,
    complete,
    state,
    campaignGCoherenceStatus: state.campaignGCoherenceStatus || 'pending',
  };
};

export const recordPhaseClosed = (registryId, phase, patch = {}) => {
  const closedAt = new Date().toISOString();
  const commitKey = `${phase.id}Commit`;
  const closedKey = `${phase.id}ClosedAt`;
  const progressKey = `${phase.id}_${phase.label.replace(/\s+/g, '')}`;

  const prev = readReplicationState(registryId) || { registryId };
  const groundProgress = { ...(prev.groundProgress || {}) };
  groundProgress[progressKey] = 'closed';

  return writeReplicationState(registryId, {
    campaignGCoherence: 'g-coherence',
    campaignGCoherenceStatus: phase.pallier >= 9 ? 'closed' : 'in_progress',
    campaignGCoherenceRoadmap: 'linux-kde-neon-roadmap-g-coherence.md',
    gCoherencePallier: phase.pallier,
    gCoherenceNextPallier: phase.pallier + 1,
    lastGCoherencePhase: phase.id,
    lastGCoherenceAt: closedAt,
    [closedKey]: closedAt,
    groundProgress,
    ...patch,
  });
};

export const recordCommit = (registryId, phaseId, hash) => {
  const prev = readReplicationState(registryId) || { registryId };
  return writeReplicationState(registryId, {
    [`${phaseId}Commit`]: hash,
    updatedAt: new Date().toISOString(),
  });
};

export { readReplicationState, writeReplicationState, replicationStatePath };
