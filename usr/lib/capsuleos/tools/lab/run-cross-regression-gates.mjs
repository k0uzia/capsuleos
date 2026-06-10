#!/usr/bin/env node
/**
 * Bundle anti-régression cross-toolkit — à lancer après tout touch noyau partagé
 * (explorateur, contentLoader, mainMenu, capsule-window).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs --kernel-touch
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCycleContract } from './clone-cycle-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const TOOLS = path.join(ROOT, 'usr/lib/capsuleos/tools');
const LAB = path.join(TOOLS, 'lab');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: null, kernelTouch: false, httpBase: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--kernel-touch') opts.kernelTouch = true;
    else if (args[i] === '--http' && args[i + 1]) opts.httpBase = args[++i];
  }
  return opts;
};

const run = (label, scriptRel, argv, env) => {
  let script = scriptRel;
  if (scriptRel.startsWith('usr/')) {
    script = path.join(ROOT, scriptRel);
  } else if (!path.isAbsolute(scriptRel)) {
    script = path.join(LAB, scriptRel);
  }
  process.stdout.write(`\n── ${label} ──\n`);
  const r = spawnSync(process.execPath, [script, ...argv], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    process.stderr.write(`✗ ${label} — échec\n`);
    return false;
  }
  process.stdout.write(`✓ ${label}\n`);
  return true;
};

const main = () => {
  const opts = parseArgs();
  const contract = loadCycleContract();
  const pairs = contract.crossRegression && contract.crossRegression.siblingPairs
    ? contract.crossRegression.siblingPairs
    : [{ cinnamon: 'linux-mint', gnome: 'linux-rocky' }];
  const env = { CAPSULE_HTTP_BASE: opts.httpBase };

  process.stdout.write('=== cross-regression gates ===\n');
  if (opts.kernelTouch) {
    process.stdout.write('(déclenché : touch noyau partagé)\n');
  }

  let ok = true;

  const ids = [];
  if (opts.id) {
    ids.push(opts.id);
  } else {
    pairs.forEach((p) => {
      if (p.cinnamon && ids.indexOf(p.cinnamon) < 0) ids.push(p.cinnamon);
      if (p.gnome && ids.indexOf(p.gnome) < 0) ids.push(p.gnome);
    });
  }

  ids.forEach((id) => {
    if (!run(`toolkit-paradigm ${id}`, path.join(TOOLS, 'validate-toolkit-paradigm.mjs'), ['--id', id])) {
      ok = false;
    }
  });

  if (!run('toolkit-chrome-isolation', path.join(TOOLS, 'validate-toolkit-chrome-isolation.mjs'), [])) {
    ok = false;
  }
  if (!run('skin-vendor-isolation', path.join(TOOLS, 'validate-skin-vendor-isolation.mjs'), [])) {
    ok = false;
  }

  if (!run('smoke-mint-nemo', 'smoke-mint-nemo.mjs', [], env)) {
    ok = false;
  }
  if (!run('smoke-gnome-nautilus rocky', 'smoke-gnome-nautilus-interactions.mjs', ['--profile=linux-rocky'], env)) {
    ok = false;
  }

  if (!ok) {
    process.exit(1);
  }
  process.stdout.write('\n✓ cross-regression gates OK — Mint Nemo + Rocky Nautilus\n');
};

main();
