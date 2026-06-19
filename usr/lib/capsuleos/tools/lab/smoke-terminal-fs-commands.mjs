#!/usr/bin/env node
/**
 * Smoke — commandes FS terminal (cp -r, rm -r, ln) + modules chargés.
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const PROFILE = process.argv.find((a) => a.startsWith('--id='))?.split('=')[1] || 'linux-mint';
const errors = [];

const runCmd = async (page, command) => page.evaluate(async (cmd) => {
  const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
  let fs = baseFs;
  let fileContents = {};
  if (window.CapsuleVirtualShell?.prepareTerminalFilesystem) {
    const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
    fs = hydration.fs || baseFs;
    fileContents = hydration.fileContents || fileContents;
  }
  const home = window.CAPSULE_TERMINAL_HOME || '/home/public';
  const state = {
    cwd: home,
    home,
    user: window.CAPSULE_TERMINAL_USER || 'capsule',
    host: window.CAPSULE_TERMINAL_HOST || 'mint',
    fs,
    fileContents,
    fileHrefs: {},
    history: [],
  };
  const helpers = {
    resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
  };
  const output = window.executeTerminalCommand(state, cmd, helpers);
  return { error: Boolean(output?.error), lines: output?.lines || [] };
}, command);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto(resolveCapsuleOsUrl(PROFILE, BASE), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.executeTerminalCommand === 'function'
      && typeof window.CapsuleTerminalFsOps !== 'undefined'
      && typeof window.CapsuleTerminalLinks !== 'undefined',
    null,
    { timeout: 60000 },
  );

  const prep1 = await runCmd(page, 'mkdir testfs');
  if (prep1.error) errors.push(`mkdir: ${prep1.lines.join(' ')}`);
  const prep2 = await runCmd(page, 'touch testfs/a.txt');
  if (prep2.error) errors.push(`touch: ${prep2.lines.join(' ')}`);
  const prep = await runCmd(page, 'cp -r testfs testfs-copy');
  if (prep.error) errors.push(`cp -r: ${prep.lines.join(' ')}`);

  const ln = await runCmd(page, 'ln -s testfs/a.txt lien-test');
  if (ln.error) errors.push(`ln -s: ${ln.lines.join(' ')}`);

  const rm = await runCmd(page, 'rm -rf testfs-copy');
  if (rm.error) errors.push(`rm -rf: ${rm.lines.join(' ')}`);

  const sudo = await runCmd(page, 'sudo echo ok');
  if (sudo.error || !sudo.lines.join('\n').includes('ok')) {
    errors.push('sudo relais: échec');
  }

  if (errors.length) {
    console.error(`✗ smoke-terminal-fs-commands — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-terminal-fs-commands OK — ${PROFILE}`);
} finally {
  await browser.close();
}
