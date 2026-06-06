#!/usr/bin/env node
/**
 * Résout la prochaine action admissible (R-AUTO) — sortie JSON pour agent / hooks.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id linux-rocky --domain gnome-settings-playbook
 *   node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id linux-rocky --scope formal
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  evaluatePredicates,
  loadContract,
  pathsForRegistry,
} from './replication-chain-lib.mjs';
import {
  evaluateUniversal,
  findNextLayer,
  loadPlaybookGeneral,
} from './playbook-general-lib.mjs';
import { evaluateFormalRules } from './formal-rules-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALIASES_PATH = path.join(ROOT, 'etc/capsuleos/contracts/agent-action-aliases.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', domain: 'gnome-settings-playbook', scope: 'replication', json: true };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--domain' && args[i + 1]) opts.domain = args[++i];
    else if (args[i] === '--scope' && args[i + 1]) opts.scope = args[++i];
    else if (args[i] === '--human') opts.json = false;
  }
  return opts;
};

const fillCommand = (template, registryId) => template.replace(/\{id\}/g, registryId);

const h6ClosurePath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-h6-closure.json`);

const pendingP1Count = (inv) => (inv?.investigations || []).filter(
  (i) => i.capsuleParity?.parityPriority === 'P1' && i.status !== 'documented',
).length;

const p2Rows = (inv) => (inv?.investigations || []).filter(
  (i) => i.capsuleParity?.parityPriority === 'P2',
);

const pendingP2Count = (inv) => p2Rows(inv).filter((i) => i.status !== 'documented').length;

const p2Documented = (inv) => p2Rows(inv).filter((i) => i.status === 'documented').length;

const p2WithCapsule = (inv) => p2Rows(inv).filter(
  (i) => i.status === 'documented' && (i.capsuleCaptures || []).length,
).length;

const p2Classified = (inv) => p2Rows(inv).filter(
  (i) => i.status === 'documented'
    && i.capsuleParity?.visualMatch
    && i.capsuleParity.visualMatch !== 'unknown',
).length;

const visualInvestigationP1Cmd = (registryId, pending = true) =>
  `node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id ${registryId} --filter P1${pending ? ' --pending' : ''}`;

const visualInvestigationP2Cmd = (registryId) =>
  `node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id ${registryId} --filter P2 --pending`;

const capsuleCapturesP2Cmd = (registryId) =>
  `node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id ${registryId} --filter P2`;

const postH6Extension = (inv, registryId, aliases) => {
  if (!fs.existsSync(h6ClosurePath(registryId))) return null;
  if (pendingP1Count(inv) > 0) {
    return {
      command: visualInvestigationP1Cmd(registryId),
      rule: 'R-P1-EXT',
      message: `H6 clôturé — extension P1 VM (${pendingP1Count(inv)} contrôle(s))`,
      autoExecute: true,
    };
  }
  const nextH5 = loadPlaybookTail(registryId)?.nextH5?.[0];
  if (nextH5 && nextH5.priority !== 'P2') {
    return {
      command: `node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-capsule-parity.mjs --id ${registryId} && node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id ${registryId}`,
      rule: 'R-H5-EXT',
      message: `Extension H5 post-H6 — ${nextH5.target} (${nextH5.priority})`,
      autoExecute: true,
    };
  }
  if (pendingP2Count(inv) > 0) {
    return {
      command: visualInvestigationP2Cmd(registryId),
      rule: 'R-P2-EXT',
      message: `H6 clôturé — enquête P2 VM (${pendingP2Count(inv)} contrôle(s))`,
      autoExecute: true,
    };
  }
  const p2Doc = p2Documented(inv);
  if (p2Doc > 0 && p2WithCapsule(inv) < p2Doc) {
    return {
      command: capsuleCapturesP2Cmd(registryId),
      rule: 'R-PRI5b',
      message: 'P2 VM documenté — captures Capsule miroir',
      autoExecute: true,
    };
  }
  if (p2Doc > 0 && p2Classified(inv) < p2Doc) {
    return {
      command: fillCommand(aliases.actionAliases['visual-parity-close']?.command, registryId),
      rule: 'R-PRI5c',
      message: 'P2 captures OK — clôture parité P2',
      autoExecute: true,
    };
  }
  if (p2Doc > 0 && p2Classified(inv) >= p2Doc) {
    const polishPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-shell-polish.json`);
    const polished = fs.existsSync(polishPath)
      && JSON.parse(fs.readFileSync(polishPath, 'utf8')).status === 'done';
    if (!polished) {
      return {
        command: 'CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs',
        rule: 'R-SHELL-POLISH',
        message: 'Polish shell — top bar, dash, Firefox, Nautilus',
        autoExecute: true,
      };
    }
    return {
      command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
      rule: 'R-H6-DONE',
      message: 'H6 clôturé — P0/P1/P2 + shell polish (maintenance validate-all)',
      autoExecute: false,
    };
  }
  return {
    command: 'node usr/lib/capsuleos/tools/validate-all.mjs',
    rule: 'R-H6-DONE',
    message: 'H6 clôturé — chaîne P0/P1/P2 à jour',
    autoExecute: false,
  };
};

const loadPlaybookTail = (registryId) => {
  const tailPath = path.join(ROOT, 'root/docs/inventaires', `${registryId}-playbook-tail.json`);
  return fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;
};

const postH6NextH5 = (registryId) => {
  if (!fs.existsSync(h6ClosurePath(registryId))) return null;
  const tail = loadPlaybookTail(registryId);
  return tail?.nextH5?.[0] || null;
};

const findNextStep = (evalResult, contract) => {
  for (const step of contract.steps || []) {
    const neg = (step.negates || []).some((sym) => !evalResult.state[sym]);
    const req = (step.requires || []).every((sym) => evalResult.state[sym]);
    if (neg && req) return step;
  }
  return null;
};

const aliasForStep = (aliases, stepId) => {
  const map = {
    'collect-vm-assets': 'collect-vm-assets',
    'visual-investigation': 'visual-investigation-p0',
    'gsettings-deep-pass': 'gsettings-deep-pass',
    'capsule-captures': 'capsule-captures',
    'visual-parity-close': 'visual-parity-close',
  };
  const key = map[stepId] || stepId;
  return aliases.actionAliases?.[key] || null;
};

const suggestPasswordBundle = (aliases, pendingCommands) => {
  const bundles = aliases.passwordBundles || {};
  for (const [id, bundle] of Object.entries(bundles)) {
    const hits = (bundle.replaces || []).filter((frag) =>
      pendingCommands.some((c) => c.includes(frag)),
    );
    if (hits.length >= 2 || (hits.length && pendingCommands.length >= 2)) {
      return { bundleId: id, ...bundle, script: bundle.script };
    }
  }
  for (const [id, bundle] of Object.entries(bundles)) {
    if ((bundle.replaces || []).some((frag) => pendingCommands.some((c) => c.includes(frag)))) {
      return { bundleId: id, ...bundle };
    }
  }
  return null;
};

const resolveGeneral = (opts, aliases) => {
  const pg = loadPlaybookGeneral();
  const evalResult = evaluateUniversal(opts.id);
  const next = findNextLayer(evalResult);
  let command = null;
  let autoExecute = pg.autoExecution?.enabled && pg.validated;

  if (next.layer === 'universal' && next.step?.script) {
    const argv = (next.step.args || []).map((a) => (a === '{id}' ? opts.id : a)).join(' ');
    command = `node ${next.step.script} ${argv}`.trim();
  } else if (next.layer === 'toolkit' && next.orchestrator) {
    command = `node ${next.orchestrator} --id ${opts.id}${autoExecute ? ' --auto' : ''}`;
  } else if (next.layer === 'tail' && next.step?.script) {
    const argv = (next.step.args || []).map((a) => (a === '{id}' ? opts.id : a)).join(' ');
    command = `node ${next.step.script} ${argv}`.trim();
  } else if (next.layer === 'complete') {
    const invPath = pathsForRegistry(opts.id).visualInvestigation;
    const inv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf8')) : null;
    const postH6 = postH6Extension(inv, opts.id, aliases);
    if (postH6) {
      command = postH6.command;
      autoExecute = postH6.autoExecute;
      next.rule = postH6.rule;
      next.message = postH6.message;
    } else {
      const p1Pending = pendingP1Count(inv);
      const p1Vm = (inv?.investigations || []).filter(
        (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === 'P1' && (i.vmCaptures || []).length,
      ).length;
      const p1Capsule = inv?.summary?.capsuleCapturesP1
        ?? (inv?.investigations || []).filter(
          (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === 'P1' && (i.capsuleCaptures || []).length,
        ).length;
      const p1Classified = (inv?.investigations || []).filter(
        (i) => i.status === 'documented'
          && i.capsuleParity?.parityPriority === 'P1'
          && i.capsuleParity?.visualMatch
          && i.capsuleParity.visualMatch !== 'unknown',
      ).length;
      if (p1Pending > 0) {
        command = visualInvestigationP1Cmd(opts.id);
        autoExecute = true;
      } else if (p1Vm > 0 && p1Capsule < p1Vm && aliases.actionAliases['capsule-captures-p1']?.command) {
        command = fillCommand(aliases.actionAliases['capsule-captures-p1'].command, opts.id);
        autoExecute = true;
      } else if (p1Vm > 0 && p1Capsule >= p1Vm && p1Classified < p1Vm) {
        command = fillCommand(aliases.actionAliases['visual-parity-close']?.command, opts.id);
        autoExecute = true;
      } else if (pendingP2Count(inv) > 0) {
        command = visualInvestigationP2Cmd(opts.id);
        autoExecute = true;
        next.rule = 'R-P2-EXT';
        next.message = `Enquête P2 VM (${pendingP2Count(inv)} contrôle(s))`;
      } else {
        command = `node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id ${opts.id}`;
      }
    }
  }

  return {
    registryId: opts.id,
    scope: 'general',
    rule: next.rule || 'R-PB-AUTO',
    layer: next.layer,
    predicates: {
      PbU: evalResult.state.PbU,
      PbT: evalResult.state.PbT,
      Pbτ: evalResult.state.Pbτ,
      PbΣ: evalResult.state.PbΣ,
    },
    autoExecute: autoExecute && !!command,
    unique: true,
    command,
    message: next.message || next.reason || `Couche ${next.layer}`,
    playbookGeneral: { validated: pg.validated, autoEnabled: pg.autoExecution?.enabled },
  };
};

const main = () => {
  const opts = parseArgs();
  const contract = loadContract();
  const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));

  if (opts.scope === 'formal') {
    const decision = evaluateFormalRules(opts.id);
    const out = {
      registryId: opts.id,
      scope: 'formal',
      rule: decision.rule,
      message: decision.message,
      command: decision.command,
      autoExecute: decision.autoExecute,
      gateOnSuccess: decision.gateOnSuccess || null,
      unique: decision.unique,
      predicates: decision.predicates,
    };
    const statePath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-formal-resolve.json`);
    fs.writeFileSync(statePath, `${JSON.stringify({ ...out, generatedAt: new Date().toISOString() }, null, 2)}\n`);
    if (opts.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    else process.stdout.write(`${out.command || out.message}\n`);
    return;
  }

  if (opts.scope === 'general') {
    const out = resolveGeneral(opts, aliases);
    const statePath = pathsForRegistry(opts.id).replicationState.replace(
      '-replication-state.json',
      '-playbook-general-resolve.json',
    );
    fs.writeFileSync(statePath, `${JSON.stringify(out, null, 2)}\n`);
    if (opts.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    else process.stdout.write(`${out.command || out.message}\n`);
    return;
  }

  const evalResult = evaluatePredicates(opts.id, opts.domain);
  const step = findNextStep(evalResult, contract);
  const statePath = pathsForRegistry(opts.id).replicationState;

  let out;
  if (!step) {
    const invPath = pathsForRegistry(opts.id).visualInvestigation;
    const inv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf8')) : null;
    const p1Documented = (inv?.investigations || []).filter(
      (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === 'P1',
    ).length;
    const p1WithCapsule = (inv?.investigations || []).filter(
      (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === 'P1' && (i.capsuleCaptures || []).length,
    ).length;
    let nextAfterComplete;
    let rule = 'R-AUTO';
    let message = 'Aucune étape chaîne — vérifier prédicats manquants (H2, M, …)';
    let autoExecute = false;
    const p1Classified = (inv?.investigations || []).filter(
      (i) => i.status === 'documented'
        && i.capsuleParity?.parityPriority === 'P1'
        && i.capsuleParity?.visualMatch
        && i.capsuleParity.visualMatch !== 'unknown',
    ).length;
    if (evalResult.state.Vp && p1Documented > 0 && p1WithCapsule < p1Documented) {
      nextAfterComplete = fillCommand(
        aliases.actionAliases['capsule-captures-p1']?.command
          || 'node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id {id} --filter P1',
        opts.id,
      );
      rule = 'R-PRI3b';
      message = 'P1 VM documenté — captures Capsule miroir';
      autoExecute = true;
    } else if (evalResult.state.Vp && p1Documented > 0 && p1WithCapsule >= p1Documented && p1Classified < p1Documented) {
      nextAfterComplete = fillCommand(aliases.actionAliases['visual-parity-close']?.command, opts.id);
      rule = 'R-PRI3c';
      message = 'P1 captures OK — clôture parité P1';
      autoExecute = true;
    } else if (evalResult.state.Vp && p1Documented > 0 && p1Classified >= p1Documented) {
      const tailPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-playbook-tail.json`);
      const tail = fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;
      const h6ReadyPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-h6-ready.json`);
      const h6ClosurePath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-h6-closure.json`);
      if (fs.existsSync(h6ClosurePath)) {
        const postH6 = postH6Extension(inv, opts.id, aliases);
        nextAfterComplete = postH6.command;
        rule = postH6.rule;
        message = postH6.message;
        autoExecute = postH6.autoExecute;
      } else if (fs.existsSync(h6ReadyPath)) {
        nextAfterComplete = `node usr/lib/capsuleos/tools/lab/close-h6-gnome-settings.mjs --id ${opts.id}`;
        rule = 'R-H6';
        message = 'Gate pré-H6 passée — close-h6-gnome-settings (embed + validate-all)';
        autoExecute = true;
      } else if (tail?.h6Ready) {
        nextAfterComplete = `node usr/lib/capsuleos/tools/lab/smoke-h6-gnome-settings-ready.mjs --id ${opts.id}`;
        rule = 'R-H6-PRE';
        message = 'H5 complet — smoke-h6-gnome-settings-ready puis H6';
        autoExecute = true;
      } else {
        nextAfterComplete = `node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id ${opts.id}`;
        rule = 'R-PRI4';
        message = 'P1 complet — H5 ciblé (nextH5 playbook-tail) puis polish skin';
        autoExecute = true;
      }
    } else if (evalResult.state.Vp && aliases.actionAliases['visual-investigation-p1']?.command) {
      nextAfterComplete = fillCommand(aliases.actionAliases['visual-investigation-p1'].command, opts.id);
      rule = 'R-PRI3';
      message = 'Chaîne P0 complète — prochaine action logique : enquête P1';
      autoExecute = true;
    } else {
      nextAfterComplete = fillCommand(
        aliases.actionAliases.H2?.command || 'node usr/lib/capsuleos/tools/validate-all.mjs',
        opts.id,
      );
    }
    out = {
      registryId: opts.id,
      domain: opts.domain,
      rule,
      autoExecute,
      complete: true,
      predicates: evalResult.state,
      message,
      suggestedCommand: nextAfterComplete,
      command: nextAfterComplete,
    };
  } else {
    const alias = aliasForStep(aliases, step.id);
    const argv = [];
    for (const a of step.args || []) {
      if (a === '--id') argv.push('--id', opts.id);
      else if (a === '--registry') argv.push('--registry', opts.id);
      else argv.push(a);
    }
    const command = `node ${step.script} ${argv.join(' ')}`.replace(/\s+/g, ' ').trim();
    out = {
      registryId: opts.id,
      domain: opts.domain,
      rule: alias?.rule || 'R-AUTO',
      predicate: evalResult.nextPredicate || alias?.predicate,
      stepId: step.id,
      autoExecute: alias?.autoExecute !== false,
      requiresPassword: alias?.requiresPassword === true,
      unique: true,
      command,
      alias: alias?.label || step.id,
      predicates: evalResult.state,
      passwordBundle: null,
    };
  }

  if (!evalResult.state.M && fs.existsSync(ALIASES_PATH)) {
    out.passwordBundle = suggestPasswordBundle(aliases, ['ssh-copy-id', 'sudo dnf']);
    if (out.passwordBundle) {
      out.passwordHint = 'R-PWD1 : exécuter le bundle une fois au lieu de sudo/ssh dispersés';
    }
  }

  fs.writeFileSync(
    statePath,
    `${JSON.stringify({
      ...JSON.parse(fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '{}'),
      registryId: opts.id,
      lastResolvedAction: out,
      generatedAt: new Date().toISOString(),
    }, null, 2)}\n`,
  );

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  } else {
    process.stdout.write(`${out.command || out.message}\n`);
  }
};

main();
