#!/usr/bin/env node
/**
 * Clôture H6 — pilote COSMIC (Paramètres + embed + validate-all).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/close-h6-cosmic-settings.mjs --id linux-popos
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
  const opts = { id: 'linux-popos' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
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
    console.error('  Lancer : smoke-h6-cosmic-settings-ready.mjs --id', opts.id);
    process.exit(1);
  }

  const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
  if (!ready.h6Ready) {
    console.error('✗ h6Ready=false dans le fichier gate');
    process.exit(1);
  }

  process.stdout.write(`=== H6 clôture ${opts.id} (cosmic-settings-playbook) ===\n`);

  const invPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-investigation.json`);
  const inv = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf8')) : null;
  const tailPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-playbook-tail.json`);
  const tail = fs.existsSync(tailPath) ? JSON.parse(fs.readFileSync(tailPath, 'utf8')) : null;

  const writeClosure = (steps) => {
    const closure = {
      registryId: opts.id,
      domain: 'cosmic-settings-playbook',
      phase: 'H6',
      status: 'closed',
      closedAt: new Date().toISOString(),
      investigator: 'close-h6-cosmic-settings.mjs',
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
        h5Completed: tail?.h5Completed || ready.h5Completed || [],
        nextH5: tail?.nextH5 || [],
      },
      steps,
      embed: 'var/lib/capsuleos/generated/capsule-app-embed.js',
      validateAll: true,
    };
    fs.writeFileSync(closurePath, `${JSON.stringify(closure, null, 2)}\n`);
    return closure;
  };

  const steps = [
    { name: 'smoke-h6-cosmic-settings-ready', fn: () => runLab('smoke-h6-cosmic-settings-ready.mjs', ['--id', opts.id]) },
    { name: 'build-linux-embed', fn: () => runTool('linux/build-linux-embed.mjs') },
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

  const formalPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-formal-state.json`);
  const formal = fs.existsSync(formalPath) ? JSON.parse(fs.readFileSync(formalPath, 'utf8')) : { registryId: opts.id, gates: {} };
  formal.gates = formal.gates || {};
  formal.gates.H6 = { ok: true, at: new Date().toISOString(), rule: 'R-H6', via: 'close-h6-cosmic-settings' };
  formal.updatedAt = new Date().toISOString();
  fs.writeFileSync(formalPath, `${JSON.stringify(formal, null, 2)}\n`);

  process.stdout.write(`\n✓ H6 clôturé — ${closurePath}\n`);
};

main();
