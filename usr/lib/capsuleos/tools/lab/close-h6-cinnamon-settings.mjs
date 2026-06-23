#!/usr/bin/env node
/**
 * Clôture H6 — pilote Cinnamon (Paramètres CS + embed + validate-all).
 *
 * Prérequis : {id}-gnome-settings-h6-ready.json (nom hérité contrat formel).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/close-h6-cinnamon-settings.mjs --id linux-mint
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');
const LAB = path.join(TOOLS, 'lab');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const httpBase = () => process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500';

const env = () => ({
  ...process.env,
  CAPSULE_HTTP_BASE: httpBase(),
  CAPSULE_MINT_URL: process.env.CAPSULE_MINT_URL || `${httpBase()}/home/Debian/Mint/index.html`,
});

const runLab = (name, extraArgs = []) => spawnSync(process.execPath, [path.join(LAB, name), ...extraArgs], {
  cwd: ROOT,
  stdio: 'inherit',
  env: env(),
});

const runTool = (name, extraArgs = []) => spawnSync(process.execPath, [path.join(TOOLS, name), ...extraArgs], {
  cwd: ROOT,
  stdio: 'inherit',
  env: env(),
});

const main = () => {
  const opts = parseArgs();
  const readyPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-h6-ready.json`);
  const closurePath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-h6-closure.json`);

  if (!fs.existsSync(readyPath)) {
    console.error(`✗ Gate pré-H6 manquante : ${readyPath}`);
    console.error('  Lancer : smoke-h6-cinnamon-settings-ready.mjs --id', opts.id);
    process.exit(1);
  }

  const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
  if (!ready.h6Ready) {
    console.error('✗ h6Ready=false dans le fichier gate');
    process.exit(1);
  }

  process.stdout.write(`=== H6 clôture ${opts.id} (cinnamon-settings-playbook) ===\n`);

  if (opts.dryRun) {
    process.stdout.write('(dry-run) verify-cinnamon → smoke-mint-cs → build-linux-embed → sync → validate-all\n');
    return;
  }

  const tailPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-playbook-tail.json`);
  const tail = fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;
  const effectsPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-settings-effects-state.json`);
  const effects = fs.existsSync(effectsPath) ? JSON.parse(fs.readFileSync(effectsPath, 'utf8')) : null;

  const writeClosure = (steps) => {
    const closure = {
      registryId: opts.id,
      domain: 'cinnamon-settings-playbook',
      phase: 'H6',
      status: 'closed',
      closedAt: new Date().toISOString(),
      investigator: 'close-h6-cinnamon-settings.mjs',
      predicates: {
        PbΣ: true,
        Se: true,
        SeΣ: true,
        Vp: true,
        h6Ready: true,
        cinnamonSettingsParity: effects?.phase === 'closed',
      },
      summary: {
        h5Completed: tail?.h5Completed || ready.h5Completed || [],
        nextH5: tail?.nextH5 || [],
        wiredPanels: 'cinnamon-settings-parity-matrix',
      },
      steps,
      embed: 'var/lib/capsuleos/generated/capsule-app-embed.js',
      validateAll: true,
    };
    fs.writeFileSync(closurePath, `${JSON.stringify(closure, null, 2)}\n`);
    return closure;
  };

  const steps = [
    { name: 'verify-cinnamon-settings-parity-chain', fn: () => runLab('verify-cinnamon-settings-parity-chain.mjs', ['--id', opts.id]) },
    { name: 'smoke-h6-cinnamon-settings-ready', fn: () => runLab('smoke-h6-cinnamon-settings-ready.mjs', ['--id', opts.id]) },
    { name: 'build-linux-embed', fn: () => runTool('linux/build-linux-embed.mjs') },
    { name: 'sync-linux-skin-closure', fn: () => runTool('linux/sync-linux-skin-closure.mjs', ['mint']) },
  ];

  const results = [];
  for (const step of steps) {
    process.stdout.write(`\n── ${step.name} ──\n`);
    const res = step.fn();
    results.push({ step: step.name, status: res.status || 0 });
    if (res.status !== 0) {
      console.error(`✗ H6 échec sur ${step.name}`);
      process.exit(res.status || 1);
    }
  }

  writeClosure(results);

  process.stdout.write('\n── validate-all ──\n');
  const validateRes = runTool('validate-all.mjs');
  results.push({ step: 'validate-all', status: validateRes.status || 0 });
  if (validateRes.status !== 0) {
    console.error('✗ H6 échec sur validate-all');
    process.exit(validateRes.status || 1);
  }
  writeClosure(results);

  const closure = JSON.parse(fs.readFileSync(closurePath, 'utf8'));
  const repState = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-replication-state.json`);
  const rep = fs.existsSync(repState) ? JSON.parse(fs.readFileSync(repState, 'utf8')) : {};
  fs.writeFileSync(repState, `${JSON.stringify({
    ...rep,
    registryId: opts.id,
    domain: 'cinnamon-settings-playbook',
    H6: true,
    h6ClosedAt: closure.closedAt,
    h6Closure: closurePath.replace(`${ROOT}/`, ''),
    lastResolvedAction: { rule: 'R-H6', message: 'H6 clôturé — domaine cinnamon-settings-playbook' },
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  process.stdout.write(`\n✓ H6 clôturé — ${closurePath}\n`);
};

main();
