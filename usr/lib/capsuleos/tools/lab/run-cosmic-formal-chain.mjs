#!/usr/bin/env node
/**
 * Orchestrateur chaîne formelle COSMIC — régénère playbook + map gaps.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-cosmic-formal-chain.mjs --id linux-popos
 *   node usr/lib/capsuleos/tools/lab/run-cosmic-formal-chain.mjs --id linux-popos --auto
 */
import { execSync } from 'child_process';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-popos').trim();
const auto = process.argv.includes('--auto');

const run = (rel, args = '') => {
  execSync(`node ${path.join(ROOT, rel)} ${args}`.trim(), { cwd: ROOT, stdio: 'inherit' });
};

process.stdout.write(`=== run-cosmic-formal-chain ${registry}${auto ? ' [auto]' : ''} ===\n`);
run('usr/lib/capsuleos/tools/lab/generate-cosmic-settings-playbook.mjs', `--id ${registry} --write`);
run('usr/lib/capsuleos/tools/lab/map-cosmic-ground-truth-gaps.mjs', `--id ${registry} --write`);
