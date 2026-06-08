#!/usr/bin/env node
/**
 * Passe effets d'état UI — shell 8 surfaces + apps déclarées dans la matrice.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --apps nemo,calculator
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const tools = path.join(ROOT, 'usr/lib/capsuleos/tools');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { apps: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--apps' && args[i + 1]) opts.apps = args[++i].split(',');
  }
  return opts;
};

const run = (rel, extraArgs) => {
  const script = path.join(ROOT, rel);
  const res = spawnSync('node', [script, ...(extraArgs || [])], {
    encoding: 'utf8',
    cwd: ROOT,
    timeout: 120000,
  });
  return {
    script: rel,
    ok: res.status === 0,
    status: res.status,
    stderr: (res.stderr || '').trim().slice(0, 400),
  };
};

const main = () => {
  const opts = parseArgs();
  const steps = [
    { name: 'validate-window-side-effects', run: () => run('usr/lib/capsuleos/tools/validate-window-side-effects.mjs') },
    { name: 'smoke-mint-interaction', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-interaction.mjs') },
    { name: 'smoke-mint-window-chrome-parity', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs') },
  ];

  const appSlots = opts.apps || ['nemo', 'firefox', 'text_editor', 'calculator', 'file_roller'];
  appSlots.forEach((slot) => {
    const smokeName = slot === 'text_editor' ? 'text-editor' : slot.replace(/_/g, '-');
    steps.push({
      name: `smoke-${slot}`,
      run: () => run(`usr/lib/capsuleos/tools/lab/smoke-mint-${smokeName}.mjs`),
    });
    steps.push({
      name: `parity-${slot}`,
      run: () => run('usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs', ['--id', 'linux-mint', '--slot', slot, '--json']),
    });
  });

  const results = steps.map((s) => ({ name: s.name, ...s.run() }));
  const failed = results.filter((r) => !r.ok);

  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
};

main();
