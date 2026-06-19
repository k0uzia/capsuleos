#!/usr/bin/env node
/**
 * Smoke — stubs réseau terminal (wget, ip, netstat, dig).
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const PROFILE = process.argv.find((a) => a.startsWith('--id='))?.split('=')[1] || 'linux-ubuntu';
const errors = [];

const runCmd = async (page, command) => page.evaluate(async (cmd) => {
  const state = {
    cwd: window.CAPSULE_TERMINAL_HOME || '/home/public',
    home: window.CAPSULE_TERMINAL_HOME || '/home/public',
    user: 'capsule',
    host: 'ubuntu',
    fs: typeof fileSystem !== 'undefined' ? fileSystem : {},
    fileContents: {},
    history: [],
  };
  const output = window.executeTerminalCommand(state, cmd, {
    resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
  });
  return { error: Boolean(output?.error), lines: output?.lines || [] };
}, command);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto(resolveCapsuleOsUrl(PROFILE, BASE), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.CapsuleTerminalNetwork !== 'undefined',
    null,
    { timeout: 60000 },
  );

  const checks = [
    ['wget https://example.org/readme.txt', 'saved'],
    ['ip a', 'inet '],
    ['netstat -tuln', 'LISTEN'],
    ['dig capsuleos.local', 'ANSWER SECTION'],
  ];

  for (const [cmd, needle] of checks) {
    const out = await runCmd(page, cmd);
    if (out.error || !out.lines.join('\n').includes(needle)) {
      errors.push(`${cmd}: sortie invalide`);
    }
  }

  if (errors.length) {
    console.error(`✗ smoke-terminal-network-stubs — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-terminal-network-stubs OK — ${PROFILE}`);
} finally {
  await browser.close();
}
