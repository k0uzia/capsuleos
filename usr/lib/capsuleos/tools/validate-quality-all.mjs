#!/usr/bin/env node
/**
 * Lance les validateurs qualité code (JSON + vanilla JS + contrats UI bureau).
 * Usage : node usr/lib/capsuleos/tools/validate-quality-all.mjs
 *
 * Validateur général futur : validate-all.mjs = assets + capsule + quality.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const steps = [
  'validate-json.mjs',
  'validate-vanilla-js.mjs',
  'validate-browser-capabilities.mjs',
  'validate-repo-hygiene.mjs',
  'validate-ui-contracts-all.mjs',
  'validate-terminal-commands.mjs',
  'validate-pedagogical-modules.mjs',
  'validate-software-user-scenarios.mjs',
  'validate-text-editor-user-scenarios.mjs',
  'validate-calculator-user-scenarios.mjs',
  'validate-themes-user-scenarios.mjs',
  'validate-clocks-user-scenarios.mjs',
  'validate-calendar-user-scenarios.mjs',
  'validate-baobab-user-scenarios.mjs',
  'validate-tour-user-scenarios.mjs',
  'validate-snapshot-user-scenarios.mjs',
  'validate-characters-user-scenarios.mjs',
  'validate-system-monitor-user-scenarios.mjs',
  'validate-screenshot-user-scenarios.mjs',
];

let failed = false;
for (const script of steps) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
