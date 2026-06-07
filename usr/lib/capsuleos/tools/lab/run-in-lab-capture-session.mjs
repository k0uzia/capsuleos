#!/usr/bin/env node
/**
 * Enveloppe R-PWD1 — exécute une commande dans une session lab (mot de passe unique).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-in-lab-capture-session.mjs -- \
 *     node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { labSessionActive, requireLabSessionHint } from './lab-session-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const SESSION_SH = path.join(ROOT, 'root/tools/lab/lab-capture-session.sh');

const args = process.argv.slice(2);
const dash = args.indexOf('--');
if (dash < 0 || dash === args.length - 1) {
  console.error('Usage : node usr/lib/capsuleos/tools/lab/run-in-lab-capture-session.mjs -- <commande> [args...]');
  console.error(requireLabSessionHint());
  process.exit(1);
}

const cmd = args.slice(dash + 1);
if (labSessionActive()) {
  const res = spawnSync(cmd[0], cmd.slice(1), { cwd: ROOT, stdio: 'inherit', env: process.env });
  process.exit(res.status ?? 1);
}

const res = spawnSync('bash', [SESSION_SH, '--', ...cmd], { cwd: ROOT, stdio: 'inherit', env: process.env });
process.exit(res.status ?? 1);
