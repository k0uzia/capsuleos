#!/usr/bin/env node
/**
 * Boucle R-AUTO — résout et exécute tant qu'une action unique est admissible.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-agent-auto.mjs --id linux-rocky
 *   node usr/lib/capsuleos/tools/lab/run-agent-auto.mjs --id linux-rocky --max-steps 16
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const RESOLVE = path.join(__dirname, 'resolve-agent-action.mjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', maxSteps: 16 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--max-steps' && args[i + 1]) opts.maxSteps = Number(args[++i]);
  }
  return opts;
};

const resolve = (registryId, scope) => {
  const argv = [RESOLVE, '--id', registryId, '--scope', scope];
  const res = spawnSync(process.execPath, argv, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(`resolve ${scope} échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  return JSON.parse(res.stdout);
};

const runCommand = (command) => {
  process.stdout.write(`\n── ${command} ──\n`);
  const res = spawnSync(command, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CAPSULE_HTTP_BASE: process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500',
    },
  });
  return res.status ?? 1;
};

const main = () => {
  const opts = parseArgs();
  process.stdout.write(`=== run-agent-auto ${opts.id} (max ${opts.maxSteps}) ===\n`);

  const scopes = ['pipeline', 'formal', 'general', 'gnome-settings-playbook'];
  let steps = 0;

  while (steps < opts.maxSteps) {
    let acted = false;
    for (const scope of scopes) {
      const out = resolve(opts.id, scope);
      process.stdout.write(
        `[${scope}] rule=${out.rule} auto=${out.autoExecute} — ${out.message || out.command || '-'}\n`,
      );
      if (!out.autoExecute || !out.command) continue;
      const status = runCommand(out.command);
      if (status !== 0) process.exit(status);
      steps += 1;
      acted = true;
      break;
    }
    if (!acted) {
      const lastGeneral = resolve(opts.id, 'general');
      const lastRep = resolve(opts.id, 'replication');
      const last = lastGeneral.autoExecute ? lastGeneral : lastRep;
      process.stdout.write(`✓ R-AUTO terminé — ${last.rule}: ${last.message}\n`);
      return;
    }
  }

  process.stderr.write(`⚠ max-steps (${opts.maxSteps}) atteint\n`);
};

main();
