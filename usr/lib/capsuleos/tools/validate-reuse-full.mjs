#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate REUSE complète — validate-reuse.mjs (SPDX rapide) + reuse lint (REUSE 3).
 * Usage : node usr/lib/capsuleos/tools/validate-reuse-full.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = ['validate-reuse.mjs', 'run-reuse-lint.mjs'];
let failed = false;

for (const script of steps) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    failed = true;
    break;
  }
}

process.exit(failed ? 1 : 0);
