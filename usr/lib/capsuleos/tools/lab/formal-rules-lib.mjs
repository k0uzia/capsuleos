/**
 * Moteur de règles formelles — priorité §3 logique-formelle.md + post-H6 Rocky.
 */
import fs from 'fs';
import path from 'path';
import { ROOT, evaluatePredicates } from './replication-chain-lib.mjs';
import { evaluateUniversal } from './playbook-general-lib.mjs';
import { evaluateAppsPredicates } from './apps-catalog-lib.mjs';
import { evaluateVisualFidelity, scanTypographyViolations } from './visual-fidelity-lib.mjs';

const formalStatePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-formal-state.json`);

const h6ClosurePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-h6-closure.json`);

const shellPolishPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-shell-polish.json`);

const shellPolish2Path = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-shell-polish-phase2.json`);

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const loadFormalState = (registryId) => {
  const base = readJson(formalStatePath(registryId)) || { registryId, gates: {} };
  const h6 = readJson(h6ClosurePath(registryId));
  const shell1 = readJson(shellPolishPath(registryId));
  const shell2 = readJson(shellPolish2Path(registryId));
  const universal = evaluateUniversal(registryId);
  const replication = evaluatePredicates(registryId);
  const apps = evaluateAppsPredicates(registryId);
  const fidelity = evaluateVisualFidelity(registryId);
  const typoViolations = scanTypographyViolations(registryId);

  const gates = {
    ...base.gates,
    H6: !!h6?.status && h6.status === 'closed',
    H2: !!base.gates?.H2?.ok,
    A: !!base.gates?.A?.ok,
    L: !!base.gates?.L?.ok,
    LabShell: !!base.gates?.LabShell?.ok,
    Shell1: shell1?.status === 'done',
    Shell2: shell2?.status === 'done',
    PbΣ: !!universal.state.PbΣ,
    AppV: apps.AppV,
    AppC: apps.AppC || !!base.gates?.AppC?.ok,
    AppP0: apps.AppP0,
    AppΣ: apps.AppΣ || !!base.gates?.AppΣ?.ok,
    Tp: fidelity.Tp || !!base.gates?.Tp?.ok,
    Tv: fidelity.Tv || !!base.gates?.Tv?.ok,
    Tm: fidelity.Tm || !!base.gates?.Tm?.ok,
    Ta: fidelity.Ta || !!base.gates?.Ta?.ok,
    Tf: (fidelity.Tf && typoViolations.length === 0) || !!base.gates?.Tf?.ok,
  };

  return {
    registryId,
    gates,
    apps,
    universal: universal.state,
    replication: replication.state,
    nextReplication: replication.nextPredicate,
    updatedAt: base.updatedAt || null,
  };
};

export const recordFormalGate = (registryId, gate, ok, meta = {}) => {
  const p = formalStatePath(registryId);
  const base = readJson(p) || { registryId, gates: {} };
  base.gates = base.gates || {};
  base.gates[gate] = { ok: !!ok, at: new Date().toISOString(), ...meta };
  base.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, `${JSON.stringify(base, null, 2)}\n`);
  return base;
};

/**
 * Règles évaluées du haut vers le bas (première admissible prime).
 */
export const evaluateFormalRules = (registryId) => {
  const state = loadFormalState(registryId);
  const { gates } = state;

  const rules = [
    {
      rule: 'R-H1',
      when: () => !gates.H2,
      message: '¬H₂ — gate validate-all (socle dépôt)',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: true,
      gateOnSuccess: 'H2',
    },
    {
      rule: 'R-A1',
      when: () => gates.H2 && !gates.A,
      message: 'H₂ ∧ ¬A — vérification assets playbook',
      command: `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry ${registryId} --strict`,
      autoExecute: true,
      gateOnSuccess: 'A',
    },
    {
      rule: 'R-L1',
      when: () => gates.H2 && gates.A && !gates.L,
      message: 'H₂ ∧ A ∧ ¬L — lab domaine Paramètres GNOME',
      command: `node usr/lib/capsuleos/tools/lab/run-gnome-settings-lab.mjs --id ${registryId}`,
      autoExecute: true,
      gateOnSuccess: 'L',
    },
    {
      rule: 'R-SHELL-POLISH',
      when: () => gates.H6 && !gates.Shell1,
      message: 'H6 ∧ ¬Shell₁ — polish top bar / dash / Firefox / Nautilus',
      command: 'CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs',
      autoExecute: true,
      gateOnSuccess: null,
    },
    {
      rule: 'R-SHELL2',
      when: () => gates.H6 && gates.Shell1 && !gates.Shell2,
      message: 'H6 ∧ Shell₁ — polish Quick Settings + calendrier (P2 shell)',
      command: 'CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish-phase2.mjs && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs',
      autoExecute: true,
      gateOnSuccess: null,
    },
    {
      rule: 'R-LAB-SHELL',
      when: () => gates.H6 && gates.Shell1 && gates.Shell2 && !gates.LabShell,
      message: 'Smokes shell GNOME de référence',
      command: 'node usr/lib/capsuleos/tools/lab/smoke-rocky-gnome-ref.mjs && node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs',
      autoExecute: true,
      gateOnSuccess: 'LabShell',
    },
    {
      rule: 'R-APP1',
      when: () => gates.H6 && !gates.AppV,
      message: 'H₆ ∧ ¬AppV — inventaire applications VM',
      command: `node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id ${registryId} --write`,
      autoExecute: true,
      gateOnSuccess: null,
    },
    {
      rule: 'R-APP2',
      when: () => gates.H6 && gates.AppV && !gates.AppC,
      message: 'AppV — génération catalogue strict + smoke',
      command: `node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id ${registryId} --write && node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id ${registryId}`,
      autoExecute: true,
      gateOnSuccess: 'AppC',
    },
    {
      rule: 'R-APP3',
      when: () => gates.H6 && gates.AppC && !gates.AppΣ,
      message: 'AppC ∧ ¬AppΣ — écart catalogue apps (implémentation H5 ciblée)',
      command: null,
      autoExecute: false,
      gateOnSuccess: null,
      nextGap: state.apps?.nextGap || null,
    },
    {
      rule: 'R-FID1',
      when: () => gates.H6 && gates.AppΣ && !gates.Tf,
      message: 'AppΣ ∧ ¬Tf — inventaire fidélité visuelle (typo, vues, MIME, a11y)',
      command: `node usr/lib/capsuleos/tools/lab/collect-visual-fidelity-inventory.mjs --id ${registryId} --write --ssh && node usr/lib/capsuleos/tools/lab/smoke-visual-fidelity.mjs --id ${registryId} && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`,
      autoExecute: true,
      gateOnSuccess: 'Tf',
    },
    {
      rule: 'R-H6-DONE',
      when: () => gates.H6 && gates.H2 && gates.A && gates.L && gates.Shell1 && gates.Shell2 && gates.AppΣ && gates.Tf,
      message: 'Chaîne formelle complète (shell + apps P0 + fidélité visuelle) — maintenance validate-all',
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      autoExecute: false,
    },
    {
      rule: 'R-PB4',
      when: () => gates.PbΣ && !gates.H6,
      message: 'PbΣ — orchestrateur playbook général',
      command: `node usr/lib/capsuleos/tools/lab/run-playbook-general.mjs --id ${registryId} --auto`,
      autoExecute: true,
      gateOnSuccess: null,
    },
    {
      rule: 'R-AUTO-FALLBACK',
      when: () => true,
      message: 'Repli — resolve replication / general',
      command: `node usr/lib/capsuleos/tools/lab/run-agent-auto.mjs --id ${registryId} --max-steps 1`,
      autoExecute: true,
      gateOnSuccess: null,
    },
  ];

  for (const spec of rules) {
    if (!spec.when()) continue;
    const out = {
      registryId,
      scope: 'formal',
      rule: spec.rule,
      message: spec.message,
      command: spec.command,
      autoExecute: spec.autoExecute,
      gateOnSuccess: spec.gateOnSuccess || null,
      unique: true,
      predicates: { ...state.universal, ...gates, ...state.apps },
    };
    if (spec.rule === 'R-APP3' && state.apps?.nextGap) {
      out.nextGap = state.apps.nextGap;
      out.message = `${spec.message} — ${state.apps.nextGap.labelFr} (${state.apps.nextGap.priorite})`;
    }
    return out;
  }

  return {
    registryId,
    scope: 'formal',
    rule: 'R-IDLE',
    message: 'Aucune règle admissible',
    command: null,
    autoExecute: false,
    unique: true,
    predicates: gates,
  };
};
