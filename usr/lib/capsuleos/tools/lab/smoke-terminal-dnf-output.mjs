#!/usr/bin/env node
/**
 * Smoke Tr — sorties terminal Red Hat/yum/dnf (profil linux-rocky).
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const PROFILE = process.argv.find((a) => a.startsWith('--id='))?.split('=')[1] || 'linux-rocky';
const errors = [];

const runCmd = async (page, command) => page.evaluate(async (cmd) => {
  const state = {
    cwd: window.CAPSULE_TERMINAL_HOME || '/home/public',
    home: window.CAPSULE_TERMINAL_HOME || '/home/public',
    user: window.CAPSULE_TERMINAL_USER || 'capsule',
    host: window.CAPSULE_TERMINAL_HOST || 'rocky',
    fs: typeof fileSystem !== 'undefined' ? fileSystem : {},
    fileContents: {},
    history: [],
    packageState: null,
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
    () => typeof window.executeTerminalCommand === 'function',
    null,
    { timeout: 60000 },
  );

  const yum = await runCmd(page, 'yum check-update');
  if (yum.error) {
    errors.push(`yum check-update: ${yum.lines.join(' ')}`);
  } else {
    const text = yum.lines.join('\n');
    if (!text.match(/Dernière vérification|Last metadata|check-update/i)) {
      errors.push('yum check-update: sortie DNF attendue absente');
    }
  }

  const dnf = await runCmd(page, 'dnf search vim');
  if (dnf.error) {
    errors.push(`dnf search vim: ${dnf.lines.join(' ')}`);
  }

  if (errors.length) {
    console.error(`✗ smoke-terminal-dnf-output — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-terminal-dnf-output OK — ${PROFILE}`);
} finally {
  await browser.close();
}
