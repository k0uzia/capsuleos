/**
 * Bibliothèque ground truth Cinnamon — prédicats Cin* et règles R-CIN*.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { evaluateCredPredicates } from './app-fidelity-lib.mjs';
import { evaluateManifestGates } from './manifest-gates-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/cinnamon-ground-truth-chain.json');

export const cinPathsForRegistry = (registryId) => ({
  registryId,
  contract: CONTRACT_PATH,
  gaps: path.join(ROOT, 'root/docs/inventaires', `${registryId}-cinnamon-ground-truth-gaps.json`),
  formalState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-cinnamon-formal-state.json`),
  replicationState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`),
  vmInventory: path.join(ROOT, 'root/docs/inventaires', `${registryId}-vm.json`),
  parityIndex: path.join(ROOT, 'root/docs/inventaires', `${registryId}-parity-index.json`),
  credFormal: path.join(ROOT, 'root/docs/inventaires', `${registryId}-credibility-formal-state.json`),
  integrationPass: path.join(ROOT, 'proc', registryId, 'integration-pass-2026-06-08.json'),
  manifestPlaybook: path.join(ROOT, 'proc', registryId, 'linuxmint-manifest-playbook.json'),
});

export const readJsonIfExists = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const loadCinContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

const runGateExitOk = (command) => {
  const status = spawnSync(command, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
    encoding: 'utf8',
  }).status ?? 1;
  return status === 0;
};

const countPhysicalCssUrls = (skinRel = 'home/Debian/Mint') => {
  const styleDir = path.join(ROOT, skinRel, 'style');
  if (!fs.existsSync(styleDir)) return 0;
  let count = 0;
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith('.css')) {
        const text = fs.readFileSync(full, 'utf8');
        const matches = text.match(/url\([^)]*usr\/share\/capsuleos\/assets/g) || [];
        count += matches.length;
      }
    });
  };
  walk(styleDir);
  return count;
};

export const evaluateCinnamonPredicates = (registryId) => {
  const paths = cinPathsForRegistry(registryId);
  const vm = readJsonIfExists(paths.vmInventory);
  const rep = readJsonIfExists(paths.replicationState);
  const parity = readJsonIfExists(paths.parityIndex);
  const credFormal = readJsonIfExists(paths.credFormal);
  const integration = readJsonIfExists(paths.integrationPass);
  const manifest = evaluateManifestGates(registryId);
  const cred = evaluateCredPredicates(registryId);

  const CinI = !!(vm && vm.collectedAt);
  const CinM = (integration?.manSigma?.importCompleted === true
      && integration?.manSigma?.stagingCompleted === true)
    || (manifest.ManΣ && manifest.playbookSummary?.drift === 0);
  const CinA = runGateExitOk(`node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id ${registryId}`);
  const CinC = runGateExitOk(`node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id ${registryId}`);

  const integral = rep?.integralPass || {};
  const panelOk = integral.panelChecklist === '6/6';
  const uiOk = integral.uiStateSurfaces === '8/8';
  const geomOk = (integral.shellGeometryMaxDeltaPx ?? 99) <= 1;
  const CinS = panelOk && uiOk && geomOk;

  const piGlobal = parity?.pi_global ?? rep?.paritySnapshot?.pi_global ?? 0;
  const CinPi = piGlobal >= 100;

  const CinCred = cred.state.CredSigma === true
    || credFormal?.predicates?.CredΣ === true;

  const CinCredLive = credFormal?.gates?.CredS?.liveVerified === true
    && credFormal?.gates?.CredS?.skipped !== true;

  const CinSigma = CinI && CinM && CinA && CinC && CinS && CinPi && CinCred;

  const state = {
    CinI,
    CinM,
    CinA,
    CinC,
    CinS,
    CinΠ: CinPi,
    CinPi,
    CinCred,
    CinCred_live: CinCredLive,
    CinΣ: CinSigma,
  };

  const order = ['CinI', 'CinM', 'CinA', 'CinC', 'CinS', 'CinPi', 'CinCred', 'CinSigma'];
  let nextPredicate = null;
  for (const sym of order) {
    const key = sym === 'CinPi' ? 'CinΠ' : sym === 'CinSigma' ? 'CinΣ' : sym;
    const val = sym === 'CinPi' ? CinPi : sym === 'CinSigma' ? CinSigma : state[sym];
    if (!val) {
      nextPredicate = key;
      break;
    }
  }

  const physicalCssUrls = countPhysicalCssUrls(
    registryId === 'linux-mint' ? 'home/Debian/Mint' : null,
  );
  const cloisonnementScore = rep?.integralPass?.cloisonnementScore ?? null;

  return {
    registryId,
    state,
    nextPredicate,
    metrics: {
      pi_global: piGlobal,
      cloisonnementScore,
      physicalCssUrls,
      manifestDrift: manifest.playbookSummary?.drift ?? null,
      credSigma: cred.state.CredSigma,
    },
    credFormal,
    integration,
  };
};

export const buildCinnamonGaps = (registryId) => {
  const evalResult = evaluateCinnamonPredicates(registryId);
  const { state, metrics } = evalResult;
  const gaps = [];

  if (!state.CinCred_live) {
    gaps.push({
      id: 'CRED-S-LIVE',
      priority: 'P1',
      predicate: 'CinCred_live',
      summary: 'CredS_live non rejoué en batch HTTP (gate skip inventory-100pct)',
      action: 'CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-all.mjs --id linux-mint',
    });
  }

  const playbook = readJsonIfExists(cinPathsForRegistry(registryId).manifestPlaybook);
  if (playbook?.staging?.status === 'pending' || playbook?.import?.status === 'pending') {
    gaps.push({
      id: 'MAN-PF4-PLAYBOOK',
      priority: 'P1',
      predicate: 'CinM',
      summary: 'Playbook proc/ — staging/import encore pending vs integration-pass clôturé',
      action: 'Synchroniser linuxmint-manifest-playbook.json (ManSt/ManI completed)',
    });
  }

  if (metrics.physicalCssUrls > 0) {
    gaps.push({
      id: 'CSS-URL-PHYS',
      priority: 'P2',
      predicate: 'CinC',
      summary: `${metrics.physicalCssUrls} url() CSS physiques usr/share/assets (hors ./assets/)`,
      action: 'rewrite-css-asset-urls ou migration mint-panel tokens',
    });
  }

  if (metrics.cloisonnementScore !== null && metrics.cloisonnementScore < 100) {
    gaps.push({
      id: 'CLOIS-SCORE',
      priority: 'P2',
      predicate: 'CinC',
      summary: `Score cloisonnement ${metrics.cloisonnementScore}/100 — dettes P2 documentées`,
      action: 'root/docs/recette-clone-mint-integral.md § Non-conformes résiduels',
    });
  }

  const credGaps = readJsonIfExists(
    path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-gaps.json`),
  );
  const tierC = credGaps?.tiers?.C?.slotCount ?? 0;
  if (tierC > 0) {
    gaps.push({
      id: 'TIER-C-THEMES',
      priority: 'P2',
      predicate: 'CinCred',
      summary: `${tierC} entrées menu tier C couvertes par slot themes (cs-*) — pas de slot dédié`,
      action: 'Documenté — pas d\'action requise sauf extension Paramètres',
    });
  }

  Object.entries(state).forEach(([pred, ok]) => {
    if (!ok && pred !== 'CinCred_live' && !gaps.some((g) => g.predicate === pred || g.predicate === (pred === 'CinPi' ? 'CinΠ' : pred))) {
      gaps.push({
        id: `CIN-${pred}`,
        priority: 'P0',
        predicate: pred === 'CinPi' ? 'CinΠ' : pred === 'CinSigma' ? 'CinΣ' : pred,
        summary: `Prédicat ${pred} non satisfait`,
        action: `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id ${registryId}`,
      });
    }
  });

  return {
    registryId,
    campaign: 'cinnamon-perfection-pass',
    generatedAt: new Date().toISOString(),
    predicates: state,
    metrics,
    gaps,
    summary: {
      totalGaps: gaps.length,
      p0: gaps.filter((g) => g.priority === 'P0').length,
      p1: gaps.filter((g) => g.priority === 'P1').length,
      p2: gaps.filter((g) => g.priority === 'P2').length,
      cinSigma: state.CinΣ,
    },
  };
};

export const writeCinnamonFormalState = (registryId) => {
  const evalResult = evaluateCinnamonPredicates(registryId);
  const paths = cinPathsForRegistry(registryId);
  const now = new Date().toISOString();
  const formal = {
    registryId,
    predicates: {
      CinI: evalResult.state.CinI,
      CinM: evalResult.state.CinM,
      CinA: evalResult.state.CinA,
      CinC: evalResult.state.CinC,
      CinS: evalResult.state.CinS,
      CinΠ: evalResult.state.CinΠ,
      CinCred: evalResult.state.CinCred,
      CinΣ: evalResult.state.CinΣ,
    },
    metrics: evalResult.metrics,
    nextPredicate: evalResult.nextPredicate,
    evaluatedAt: now,
    updatedAt: now,
  };
  if (evalResult.state.CinΣ) {
    formal.gates = { CinΣ: { ok: true, at: now, rule: 'R-CIN-Σ' } };
  }
  fs.writeFileSync(paths.formalState, `${JSON.stringify(formal, null, 2)}\n`);
  return formal;
};

export const evaluateCinnamonRules = (registryId) => {
  const evalResult = evaluateCinnamonPredicates(registryId);
  const formalPath = cinPathsForRegistry(registryId).formalState;
  const formalWritten = fs.existsSync(formalPath);

  const rules = [
    {
      rule: 'R-CIN-H2',
      when: () => !runGateExitOk('node usr/lib/capsuleos/tools/validate-all.mjs'),
      message: '¬H₂ — gate validate-all (socle dépôt)',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: true,
    },
    {
      rule: 'R-CIN-GAPS',
      when: () => !fs.existsSync(cinPathsForRegistry(registryId).gaps),
      message: 'Cartographie écarts Cin* absente',
      command: `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id ${registryId} --write`,
      autoExecute: true,
    },
    {
      rule: 'R-CIN-MAN-PF4',
      when: () => {
        const pb = readJsonIfExists(cinPathsForRegistry(registryId).manifestPlaybook);
        return evalResult.state.CinM && (pb?.staging?.status === 'pending' || pb?.import?.status === 'pending');
      },
      message: 'CinM ∧ playbook pending — synchroniser ManSt/ManI proc/',
      command: `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id ${registryId} --write --sync-man`,
      autoExecute: true,
    },
    {
      rule: 'R-CIN-PARADIGM',
      when: () => !evalResult.state.CinC,
      message: '¬CinC — validate-toolkit-paradigm',
      command: `node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id ${registryId}`,
      autoExecute: true,
    },
    {
      rule: 'R-CIN-CRED-LIVE',
      when: () => evalResult.state.CinCred && !evalResult.state.CinCred_live,
      message: 'CinCred ∧ ¬CredS_live — smoke batch échantillon :5501',
      command: `CAPSULE_HTTP_BASE=${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501'} node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-all.mjs --id ${registryId} --sample 20`,
      autoExecute: true,
    },
    {
      rule: 'R-CIN-FORMAL-WRITE',
      when: () => evalResult.state.CinΣ && !formalWritten,
      message: 'CinΣ — écriture état formel cinnamon',
      command: `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id ${registryId} --write`,
      autoExecute: true,
    },
    {
      rule: 'R-CIN-DONE',
      when: () => evalResult.state.CinΣ && formalWritten,
      message: 'CinΣ clôturé — maintenance validate-all',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: false,
    },
  ];

  for (const spec of rules) {
    if (!spec.when()) continue;
    return {
      registryId,
      scope: 'cinnamon',
      rule: spec.rule,
      message: spec.message,
      command: spec.command,
      autoExecute: spec.autoExecute,
      unique: true,
      predicates: evalResult.state,
      metrics: evalResult.metrics,
      nextPredicate: evalResult.nextPredicate,
    };
  }

  return {
    registryId,
    scope: 'cinnamon',
    rule: 'R-CIN-IDLE',
    message: 'Aucune règle R-CIN* admissible',
    command: null,
    autoExecute: false,
    unique: true,
    predicates: evalResult.state,
    metrics: evalResult.metrics,
    nextPredicate: evalResult.nextPredicate,
  };
};
