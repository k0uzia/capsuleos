#!/usr/bin/env node
/**
 * Clôture H6 — pilote KDE (Phase 2b Paramètres + embed + validate-all).
 *
 * Prérequis : {id}-gnome-settings-h6-ready.json (gate pré-H6, nom hérité contrat formel).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/close-h6-kde-settings.mjs --id linux-kde-neon
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
  const opts = { id: 'linux-kde-neon' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const env = () => ({
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765',
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
    console.error('  Lancer : smoke-h6-kde-settings-ready.mjs --id', opts.id);
    process.exit(1);
  }

  const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
  if (!ready.h6Ready) {
    console.error('✗ h6Ready=false dans le fichier gate');
    process.exit(1);
  }

  process.stdout.write(`=== H6 clôture ${opts.id} (kde-settings-playbook) ===\n`);

  if (opts.dryRun) {
    process.stdout.write('(dry-run) verify-kde → build-linux-embed → sync-linux-skin-closure → validate-all\n');
    return;
  }

  const tailPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-playbook-tail.json`);
  const tail = fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;
  const gapsPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-kde-ground-truth-gaps.json`);
  const gaps = fs.existsSync(gapsPath) ? JSON.parse(fs.readFileSync(gapsPath, 'utf8')) : null;

  const writeClosure = (steps) => {
    const closure = {
      registryId: opts.id,
      domain: 'kde-settings-playbook',
      phase: 'H6',
      status: 'closed',
      closedAt: new Date().toISOString(),
      investigator: 'close-h6-kde-settings.mjs',
      predicates: {
        PbΣ: true,
        SeΣ: true,
        Vp: true,
        h6Ready: true,
        kdeGroundTruth: !!gaps?.allOk,
      },
      summary: {
        h5Completed: tail?.h5Completed || ready.h5Completed || [],
        nextH5: tail?.nextH5 || [],
        p0Effects: gaps?.gates?.filter((g) => g.ok).map((g) => g.predicate) || [],
      },
      steps,
      embed: 'var/lib/capsuleos/generated/capsule-app-embed.js',
      validateAll: true,
    };
    fs.writeFileSync(closurePath, `${JSON.stringify(closure, null, 2)}\n`);
    return closure;
  };

  const steps = [
    { name: 'verify-kde-settings-parity-chain', fn: () => runLab('verify-kde-settings-parity-chain.mjs', ['--id', opts.id, '--strict']) },
    { name: 'build-linux-embed', fn: () => runTool('linux/build-linux-embed.mjs') },
    { name: 'sync-linux-skin-closure', fn: () => runTool('linux/sync-linux-skin-closure.mjs') },
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
    domain: 'kde-settings-playbook',
    H6: true,
    h6ClosedAt: closure.closedAt,
    h6Closure: closurePath.replace(`${ROOT}/`, ''),
    lastResolvedAction: { rule: 'R-H6', message: 'H6 clôturé — domaine kde-settings-playbook' },
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  process.stdout.write(`\n✓ H6 clôturé — ${closurePath}\n`);
};

main();
