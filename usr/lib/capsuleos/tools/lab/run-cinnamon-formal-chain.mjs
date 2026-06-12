#!/usr/bin/env node
/**
 * Orchestrateur chaîne formelle Cinnamon — délègue map-cinnamon-ground-truth-gaps.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-cinnamon-formal-chain.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-cinnamon-formal-chain.mjs --id linux-mint --write
 */
import { execSync } from 'child_process';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-mint').trim();
const write = process.argv.includes('--write') ? ' --write' : '';
const script = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs');
execSync(`node ${script} --id ${registry}${write}`, { cwd: ROOT, stdio: 'inherit' });
