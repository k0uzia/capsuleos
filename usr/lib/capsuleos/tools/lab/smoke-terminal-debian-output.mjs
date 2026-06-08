#!/usr/bin/env node
/**
 * Smoke Tr — sorties terminal Debian/apt (profil linux-ubuntu).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-debian-output.mjs
 *   CAPSULE_HTTP_BASE=... node ... --profile=linux-ubuntu
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const profileArg = process.argv.find((a) => a.startsWith('--profile=') || a.startsWith('--id='));
const PROFILE = profileArg
  ? profileArg.split('=')[1]
  : (process.env.CAPSULE_SKIN_PROFILE || 'linux-ubuntu');

const errors = [];

const runCmd = async (page, command) => page.evaluate(async (cmd) => {
  const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
  let fs = baseFs;
  let fileContents = {};
  let fileHrefs = {};
  if (window.CapsuleVirtualShell?.prepareTerminalFilesystem) {
    const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
    fs = hydration.fs || baseFs;
    fileContents = hydration.fileContents || fileContents;
    fileHrefs = hydration.fileHrefs || fileHrefs;
  }
  const home = window.CAPSULE_TERMINAL_HOME
    || window.CapsuleExplorerVfs?.getTerminalLogicalHome?.()
    || '/home/capsule';
  const state = {
    cwd: home,
    home,
    user: window.CAPSULE_TERMINAL_USER || 'capsule',
    host: window.CAPSULE_TERMINAL_HOST || 'ubuntu',
    fs,
    fileContents,
    fileHrefs,
    history: [],
  };
  const helpers = {
    resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
    formatPrompt: () => '',
    normalizePath: window.CapsuleTerminal.normalizePath,
  };
  const output = window.executeTerminalCommand(state, cmd, helpers);
  return {
    error: Boolean(output?.error),
    lines: output?.lines || [],
  };
}, command);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(resolveCapsuleOsUrl(PROFILE, BASE), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.executeTerminalCommand === 'function'
      && typeof window.CapsuleTerminal !== 'undefined',
    null,
    { timeout: 60000 },
  );

  const aptList = await runCmd(page, 'apt list --upgradable');
  if (aptList.error) {
    errors.push(`apt list --upgradable: erreur — ${aptList.lines.join(' ')}`);
  } else {
    const text = aptList.lines.join('\n');
    if (!text.includes('En train de lister')) {
      errors.push('apt list --upgradable: ligne « En train de lister… » absente');
    }
    if (!text.includes('pouvant être mis à jour')) {
      errors.push('apt list --upgradable: format FR upgradable absent');
    }
  }

  const aptInstall = await page.evaluate(async () => {
    const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
    let fs = baseFs;
    let fileContents = {};
    let fileHrefs = {};
    if (window.CapsuleVirtualShell?.prepareTerminalFilesystem) {
      const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
      fs = hydration.fs || baseFs;
      fileContents = hydration.fileContents || fileContents;
      fileHrefs = hydration.fileHrefs || fileHrefs;
    }
    const home = window.CAPSULE_TERMINAL_HOME
      || window.CapsuleExplorerVfs?.getTerminalLogicalHome?.()
      || '/home/capsule';
    const state = {
      cwd: home,
      home,
      user: window.CAPSULE_TERMINAL_USER || 'capsule',
      host: window.CAPSULE_TERMINAL_HOST || 'ubuntu',
      fs,
      fileContents,
      fileHrefs,
      history: [],
    };
    const helpers = {
      resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
      formatPrompt: () => '',
      normalizePath: window.CapsuleTerminal.normalizePath,
    };
    window.executeTerminalCommand(state, 'apt remove cowsay', helpers);
    const output = window.executeTerminalCommand(state, 'apt install cowsay', helpers);
    return { error: Boolean(output?.error), lines: output?.lines || [] };
  });
  if (aptInstall.error) {
    errors.push(`apt install cowsay: erreur — ${aptInstall.lines.join(' ')}`);
  } else {
    const text = aptInstall.lines.join('\n');
    if (!text.includes('Installation de cowsay') && !text.includes('Mise à jour et installation')) {
      errors.push(`apt install cowsay: sortie FR installation absente — ${text.slice(0, 120)}`);
    }
  }

  const dpkg = await runCmd(page, 'dpkg -l bash');
  if (dpkg.error) {
    errors.push(`dpkg -l bash: erreur — ${dpkg.lines.join(' ')}`);
  } else {
    const text = dpkg.lines.join('\n');
    if (!text.includes('ii  bash')) {
      errors.push('dpkg -l bash: ligne ii bash absente');
    }
  }

  if (errors.length) {
    console.error(`✗ smoke-terminal-debian-output — ${PROFILE} — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
  }
  console.log(`✓ smoke-terminal-debian-output OK — ${PROFILE} (apt list, apt install, dpkg -l)`);
} finally {
  await browser.close();
}
