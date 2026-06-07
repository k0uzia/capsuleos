#!/usr/bin/env node
/**
 * Orchestrateur passe états UI & effets (logique propositionnelle VΣ).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
 *
 * Skill : root/skills/ui-state-effects-replication/SKILL.md
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', skipVisual: false, skipCapsule: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--skip-visual') opts.skipVisual = true;
    else if (args[i] === '--skip-capsule') opts.skipCapsule = true;
  }
  return opts;
};

const run = (rel, extraArgs = []) => {
  const script = path.join(ROOT, rel);
  const res = spawnSync('node', [script, ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    timeout: 900000,
  });
  process.stderr.write(res.stderr || '');
  process.stdout.write(res.stdout || '');
  return res.status === 0;
};

const main = () => {
  const opts = parseArgs();
  const id = opts.id;

  process.stderr.write(`=== Passe états UI VΣ (${id}) ===\n`);

  if (!opts.skipVisual) {
    process.stderr.write('--- Phase Vp (passe visuelle shell) ---\n');
    if (!run('usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs', [`--id=${id}`])) {
      process.stderr.write('  ⚠ passe visuelle incomplète — poursuite collecte effets\n');
    }
  }

  process.stderr.write('--- Phase Ve/Vx/Vm (collecte VM) ---\n');
  if (!run('usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs', [`--id=${id}`, '--write'])) {
    process.exit(1);
  }

  if (!opts.skipCapsule) {
    process.stderr.write('--- Phase Vμ (miroir Capsule) ---\n');
    if (!run('usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs', [`--id=${id}`, '--capsule'])) {
      process.exit(1);
    }
  }

  process.stderr.write('--- Gate VΣ ---\n');
  const smokeArgs = [`--id=${id}`];
  if (!opts.skipCapsule) smokeArgs.push('--require-capsule');
  if (!run('usr/lib/capsuleos/tools/lab/smoke-ui-state-effects.mjs', smokeArgs)) {
    process.exit(1);
  }

  process.stdout.write(`OK run-ui-state-effects-pass ${id}\n`);
};

main();
