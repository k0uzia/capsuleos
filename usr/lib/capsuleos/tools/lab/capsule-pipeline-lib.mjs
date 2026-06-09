/**
 * Résolution pipeline unifié — couches §5.2 plan maître reproduction OS.
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';
import { loadFormalState, evaluateFormalRules } from './formal-rules-lib.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/capsule-pipeline-layers.json');

const LAYER_RULE_MATCH = {
  socle: (rule) => ['R-H1', 'R-A1', 'R-L1'].includes(rule),
  'ground-truth': (rule) => rule.startsWith('R-MAN'),
  apps: (rule) => rule.startsWith('R-APP'),
  playbook: (rule) => ['R-PB4', 'R-SHELL-POLISH', 'R-SHELL2', 'R-LAB-SHELL'].some((p) => rule.startsWith(p)),
  visual: (rule) => rule === 'R-FID1' || rule.startsWith('R-V'),
  fidelity: (rule) => rule === 'R-FID1',
  release: (rule) => rule === 'R-H6-DONE',
};

const defaultCommand = (layerId, registryId) => ({
  socle: 'node usr/lib/capsuleos/tools/validate-all.mjs',
  'ground-truth': `node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id ${registryId} --auto --write`,
  apps: `node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id ${registryId}`,
  playbook: `node usr/lib/capsuleos/tools/lab/run-playbook-general.mjs --id ${registryId} --auto`,
  visual: `node usr/lib/capsuleos/tools/lab/run-vendor-assets-pipeline.mjs --id ${registryId}`,
  fidelity: `node usr/lib/capsuleos/tools/lab/collect-visual-fidelity-inventory.mjs --id ${registryId} --write --ssh && node usr/lib/capsuleos/tools/lab/smoke-visual-fidelity.mjs --id ${registryId} && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`,
  release: 'node usr/lib/capsuleos/tools/validate-all.mjs',
}[layerId]);

export const loadPipelineContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

const gateValue = (gates, predicate) => {
  if (predicate === 'VΣ') {
    return !!(gates.V && gates.Vc && gates.Vp);
  }
  if (predicate in gates) return !!gates[predicate];
  return false;
};

const layerIncomplete = (gates, predicates) => (
  (predicates || []).filter((p) => !gateValue(gates, p))
);

export const resolvePipeline = (registryId) => {
  const contract = loadPipelineContract();
  const state = loadFormalState(registryId);
  const { gates } = state;
  const formal = evaluateFormalRules(registryId);

  for (const layer of contract.layers) {
    const pending = layerIncomplete(gates, layer.predicates);
    if (!pending.length) continue;

    const matches = LAYER_RULE_MATCH[layer.id];
    if (formal.rule && formal.command && matches?.(formal.rule)) {
      return {
        registryId,
        scope: 'pipeline',
        layer: layer.id,
        layerLabel: layer.label,
        layerPending: pending,
        rule: formal.rule,
        message: formal.message,
        command: formal.command,
        autoExecute: formal.autoExecute,
        gateOnSuccess: formal.gateOnSuccess || null,
        unique: true,
        predicates: formal.predicates || gates,
      };
    }

    const cmd = defaultCommand(layer.id, registryId);
    const manual = layer.id === 'ground-truth' && pending.includes('ManΣ')
      && gates.ManV && gates.ManS && gates.PbM && !gates.ManA;

    return {
      registryId,
      scope: 'pipeline',
      layer: layer.id,
      layerLabel: layer.label,
      layerPending: pending,
      rule: `R-PIPELINE-${layer.id.toUpperCase()}`,
      message: `${layer.label} — incomplet : ${pending.join(', ')}`,
      command: cmd,
      autoExecute: !manual && layer.id !== 'release',
      unique: true,
      predicates: gates,
    };
  }

  return {
    registryId,
    scope: 'pipeline',
    layer: 'complete',
    layerLabel: 'Complet',
    rule: 'R-PIPELINE-DONE',
    message: 'Toutes les couches pipeline satisfaites',
    command: null,
    autoExecute: false,
    unique: true,
    predicates: gates,
  };
};
