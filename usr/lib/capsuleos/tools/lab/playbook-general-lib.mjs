/**
 * Bibliothèque playbook général multiplateforme.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  ROOT,
  evaluatePredicates,
  loadRegistryEntry,
  pathsForRegistry,
  readJsonIfExists,
} from './replication-chain-lib.mjs';
import { evaluateManifestGates } from './manifest-gates-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/playbook-general.json');

export const loadPlaybookGeneral = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const toolkitId = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  return entry.toolkit?.id || entry.toolkit || 'unknown';
};

export const tailPaths = (registryId) => ({
  json: path.join(ROOT, 'root/docs/inventaires', `${registryId}-playbook-tail.json`),
  md: path.join(ROOT, 'root/docs/inventaires', `${registryId}-playbook-tail.md`),
});

const orchestratorOk = (registryId, relPath) => {
  if (!relPath) return false;
  const script = path.join(ROOT, relPath);
  if (!fs.existsSync(script)) return false;
  const res = spawnSync(process.execPath, [script, '--id', registryId], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return res.status === 0;
};

export const toolkitPlaybookComplete = (registryId, tk, tkDef) => {
  if (!tkDef || tkDef.status === 'stub' || tkDef.status === 'planned') return false;
  if (tk === 'gnome') {
    const rep = evaluatePredicates(registryId, 'gnome-settings-playbook');
    return !!(rep.state.Vp && rep.state.V && rep.state.G && rep.state.Vc);
  }
  if (tkDef.orchestrator) {
    return orchestratorOk(registryId, tkDef.orchestrator);
  }
  return false;
};

export const evaluateUniversal = (registryId) => {
  const p = pathsForRegistry(registryId);
  const tail = tailPaths(registryId);
  const tk = toolkitId(registryId);
  const contract = loadPlaybookGeneral();
  const gnomeInv = readJsonIfExists(p.visualInvestigation);

  let H2 = null;
  let L = null;
  let A = null;

  const state = {
    H2,
    M: fs.existsSync(path.join(ROOT, 'etc/capsuleos/lab-inventory.json')),
    I: fs.existsSync(path.join(ROOT, 'root/docs/inventaires', `${registryId}-vm.json`)),
    A,
    S: fs.existsSync(p.assetsInventory),
    T: fs.existsSync(p.sourceVmTxt) && fs.readFileSync(p.sourceVmTxt, 'utf8').trim().length > 0,
    L,
    toolkit: tk,
  };

  const manifestGates = evaluateManifestGates(registryId);
  state.ManV = manifestGates.ManV;
  state.ManS = manifestGates.ManS;
  state.ManA = manifestGates.ManA;
  state.ManI = manifestGates.ManI;
  state.ManΣ = manifestGates.ManΣ;
  state.PbM = manifestGates.PbM;

  const rep = evaluatePredicates(registryId, 'gnome-settings-playbook');
  const tkDef = contract.layers.toolkit.map[tk];
  if (tk === 'gnome') {
    state.V = rep.state.V;
    state.G = rep.state.G;
    state.Vc = rep.state.Vc;
    state.Vp = rep.state.Vp;
  }
  state.PbT = toolkitPlaybookComplete(registryId, tk, tkDef);
  if (tk !== 'gnome') {
    state.toolkitStub = tkDef?.status === 'stub' || tkDef?.status === 'planned';
  }

  state.PbU = !!(state.I && state.T && (tk !== 'gnome' || state.S));

  const tailDoc = readJsonIfExists(tail.json);
  const tailDocumented = !!(
    tailDoc?.status === 'documented'
    && (tailDoc.gaps?.length >= 0 || tailDoc.officialDocCrossCheck?.length > 0)
  );
  // R-PB3 : τ n'est admissible qu'après PbT (fichier peut exister en brouillon avant clôture toolkit)
  state.Pbτ = !!(state.PbT && tailDocumented);
  state.tailDraft = !state.PbT && tailDocumented;
  state.PbΣ = !!(state.PbU && state.PbT && state.Pbτ);

  return {
    registryId,
    contract,
    state,
    toolkit: tk,
    replication: rep.state,
    tailPath: tail.json,
  };
};

export const findNextLayer = (evalResult) => {
  const { state, toolkit, contract } = evalResult;
  const universal = contract.layers.universal.steps || [];

  if (!state.PbU) {
    if (state.M && !state.ManΣ) {
      const step = universal.find((s) => s.id === 'u-manifest-chain');
      return { layer: 'universal', step, rule: 'R-PB1', reason: 'chaîne manifeste distribution incomplète' };
    }
    if (!state.I) {
      const step = universal.find((s) => s.id === 'u-vm-inventory');
      return { layer: 'universal', step, rule: 'R-PB1', reason: 'inventaire VM manquant' };
    }
    if (!state.T) {
      return {
        layer: 'universal',
        step: { id: 'u-source-vm', manualGate: true, note: 'pull-vm-assets.sh pour SOURCE-VM.txt' },
        rule: 'R-PB1',
      };
    }
    if (toolkit === 'gnome' && !state.S) {
      const step = universal.find((s) => s.id === 'u-collect-assets');
      return { layer: 'universal', step, rule: 'R-PB1' };
    }
    if (toolkit === 'gnome' && state.S) {
      const step = universal.find((s) => s.id === 'u-verify-assets');
      return { layer: 'universal', step, rule: 'R-PB1' };
    }
  }

  if (!state.PbT) {
    const tkDef = contract.layers.toolkit.map[toolkit];
    if (tkDef?.status === 'stub' || tkDef?.status === 'planned') {
      return { layer: 'toolkit', stub: true, toolkit, rule: 'R-PB2', message: `Toolkit ${toolkit} — playbook stub, reporter ou implémenter` };
    }
    if (tkDef?.orchestrator) {
      return {
        layer: 'toolkit',
        orchestrator: tkDef.orchestrator,
        domain: tkDef.domain,
        rule: 'R-PB2',
      };
    }
  }

  if (state.PbT && !state.Pbτ) {
    const tailStep = contract.layers.tail.steps.find((s) => s.id === 'tau-collect');
    return { layer: 'tail', step: tailStep, rule: 'R-PB3' };
  }

  if (state.PbΣ) {
    return { layer: 'complete', rule: 'R-PB4', message: 'PbΣ — prêt H5 ciblé ou H6' };
  }

  return { layer: 'unknown', message: 'Vérifier prédicats manuellement' };
};
