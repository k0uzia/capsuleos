/**
 * Bibliothèque moteur de cycles clone VM → CapsuleOS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadParityIndex, parityStatus } from './parity-index-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/clone-cycle-engine.json');

export const loadCycleContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const replicationStatePath = (registryId) => (
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`)
);

export const readReplicationState = (registryId) => {
  const p = replicationStatePath(registryId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

export const writeReplicationState = (registryId, patch) => {
  const p = replicationStatePath(registryId);
  const prev = readReplicationState(registryId) || { registryId };
  const next = {
    ...prev,
    ...patch,
    registryId,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(p, `${JSON.stringify(next, null, 2)}\n`);
  return next;
};

export const cycleFromPallier = (contract, pallier) => {
  const cycles = contract.cycles || [];
  const hit = cycles.find((c) => c.pallier === pallier);
  if (hit) return hit;
  if (pallier < 0) return cycles[0] || null;
  return cycles[cycles.length - 1] || null;
};

export const nextCycle = (contract, currentCycleId) => {
  const cycles = contract.cycles || [];
  const idx = cycles.findIndex((c) => c.id === currentCycleId);
  if (idx < 0) return cycles[0] || null;
  if (idx >= cycles.length - 1) return null;
  return cycles[idx + 1];
};

export const evaluatePiClosure = (registryId, contract) => {
  const index = loadParityIndex(registryId);
  const pi = index && typeof index.pi_global === 'number' ? index.pi_global : null;
  const target = contract.piTarget || 100;
  const ok = contract.piThresholdOk || 90;
  return {
    pi_global: pi,
    target,
    ok,
    reached: pi !== null && pi >= target,
    mvpReached: pi !== null && pi >= ok,
    status: pi !== null ? parityStatus(pi) : 'unknown',
  };
};

export const evaluateCycleStatus = (registryId) => {
  const contract = loadCycleContract();
  const state = readReplicationState(registryId);
  const pi = evaluatePiClosure(registryId, contract);
  const pallier = state && typeof state.pallier === 'number' ? state.pallier : -1;
  const nextPallier = state && typeof state.nextPallier === 'number'
    ? state.nextPallier
    : pallier + 1;
  const current = cycleFromPallier(contract, pallier);
  const upcoming = cycleFromPallier(contract, nextPallier);
  const cyclesTotal = (contract.cycles || []).length;
  const cyclesRemaining = pi.reached
    ? 0
    : Math.max(0, cyclesTotal - (nextPallier < 0 ? 0 : nextPallier));

  return {
    registryId,
    contractVersion: contract.version,
    pallier,
    nextPallier,
    currentCycle: current ? current.id : null,
    nextCycle: upcoming ? upcoming.id : null,
    cyclesTotal,
    cyclesRemaining,
    cycleCountToPi100: contract.cycleCountToPi100,
    pi,
    state,
    complete: pi.reached && (state && Array.isArray(state.nonConformites) && state.nonConformites.length === 0),
  };
};

export const gateNeedsHttp = (gate) => {
  if (gate.env && gate.env.CAPSULE_HTTP_BASE) return true;
  const script = gate.script || '';
  return /smoke-|run-ui-state|run-app-parity|measure-mint|capture-clone/.test(script);
};

export const expandGateArgs = (gate, registryId) => {
  const out = [];
  (gate.args || []).forEach((a) => {
    if (a === '--id') out.push('--id', registryId);
    else out.push(a);
  });
  return out;
};
