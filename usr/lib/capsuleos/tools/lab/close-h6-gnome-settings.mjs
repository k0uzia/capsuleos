#!/usr/bin/env node
/**
 * Clôture H6 — domaine gnome-settings-playbook (Rocky référence).
 *
 * Prérequis : linux-rocky-gnome-settings-h6-ready.json (gate pré-H6).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/close-h6-gnome-settings.mjs --id linux-rocky
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
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const env = () => ({
  ...process.env,
  CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
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
    console.error('  Lancer : smoke-h6-gnome-settings-ready.mjs --id', opts.id);
    process.exit(1);
  }

  const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
  if (!ready.h6Ready) {
    console.error('✗ h6Ready=false dans le fichier gate');
    process.exit(1);
  }

  process.stdout.write(`=== H6 clôture ${opts.id} (gnome-settings-playbook) ===\n`);

  if (opts.dryRun) {
    process.stdout.write('(dry-run) smoke-h6 → build-linux-embed → validate-all\n');
    return;
  }

  const steps = [
    { name: 'smoke-h6-gnome-settings-ready', fn: () => runLab('smoke-h6-gnome-settings-ready.mjs', ['--id', opts.id]) },
    { name: 'build-linux-embed', fn: () => runTool('linux/build-linux-embed.mjs') },
    { name: 'validate-all', fn: () => runTool('validate-all.mjs') },
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

  const invPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-investigation.json`);
  const inv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf8')) : null;
  const tailPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-playbook-tail.json`);
  const tail = fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;

  const closure = {
    registryId: opts.id,
    domain: 'gnome-settings-playbook',
    phase: 'H6',
    status: 'closed',
    closedAt: new Date().toISOString(),
    investigator: 'close-h6-gnome-settings.mjs',
    predicates: {
      PbΣ: true,
      V: true,
      G: true,
      Vc: true,
      Vp: true,
      h6Ready: true,
    },
    summary: {
      p0Classified: inv?.summary?.visualMatchClassifiedP0 ?? null,
      p1Classified: inv?.summary?.visualMatchClassifiedP1 ?? null,
      h5Completed: tail?.h5Completed || ready.h5Completed || [],
      nextH5: tail?.nextH5 || [],
    },
    steps: results,
    embed: 'var/lib/capsuleos/generated/capsule-app-embed.js',
    validateAll: true,
  };

  fs.writeFileSync(closurePath, `${JSON.stringify(closure, null, 2)}\n`);

  const repState = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-replication-state.json`);
  const rep = fs.existsSync(repState) ? JSON.parse(fs.readFileSync(repState, 'utf8')) : {};
  fs.writeFileSync(repState, `${JSON.stringify({
    ...rep,
    registryId: opts.id,
    domain: 'gnome-settings-playbook',
    H6: true,
    h6ClosedAt: closure.closedAt,
    h6Closure: closurePath.replace(`${ROOT}/`, ''),
    lastResolvedAction: { rule: 'R-H6', message: 'H6 clôturé — domaine gnome-settings-playbook' },
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  process.stdout.write(`\n✓ H6 clôturé — ${closurePath}\n`);
};

main();
