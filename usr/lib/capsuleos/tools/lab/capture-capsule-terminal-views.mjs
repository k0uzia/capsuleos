#!/usr/bin/env node
/**
 * Captures Capsule GNOME Terminal Ptyxis — scénarios Te1–Te4 (slot `terminal`).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-terminal-views.mjs --id linux-alma
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-alma' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const openTerminal = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="terminal"]');
    const app = win && win.querySelector('[data-terminal-app][data-terminal-ready="true"]');
    return !!(win && getComputedStyle(win).display !== 'none' && app);
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'terminal') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('terminal');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="terminal"]');
      const app = win && win.querySelector('[data-terminal-app]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && app?.dataset?.terminalReady === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const runScenarioAction = async (page, action) => {
  if (action === 'pwd') {
    await page.fill('[data-terminal-gnome-command]', 'pwd');
    await page.press('[data-terminal-gnome-command]', 'Enter');
    await sleep(page, 400);
    return;
  }
  if (action === 'whoami') {
    await page.fill('[data-terminal-gnome-command]', 'whoami');
    await page.press('[data-terminal-gnome-command]', 'Enter');
    await sleep(page, 400);
    return;
  }
  if (action === 'new-tab') {
    await page.evaluate(() => {
      if (typeof window.openTerminalTab === 'function') {
        window.openTerminalTab();
      }
    });
    await sleep(page, 450);
  }
};

const vendorPrefix = (registryId) => {
  if (registryId === 'linux-alma') return 'alma';
  if (registryId === 'linux-fedora') return 'fedora';
  if (registryId === 'linux-ubuntu') return 'ubuntu';
  return 'rocky';
};

const main = async () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  const dest = paths.capsuleCapturesDir;
  fs.mkdirSync(dest, { recursive: true });

  const httpBase = resolveCapsuleHttpBase(opts.id);
  const url = resolveCapsuleOsUrl(opts.id, httpBase);
  const prefix = vendorPrefix(opts.id);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('gnome-theme', 'dark');
  });

  const shots = [
    { file: `${prefix}-capsule-dark-terminal.png` },
    { file: `${prefix}-capsule-dark-terminal-pwd.png`, before: ['pwd'] },
    { file: `${prefix}-capsule-dark-terminal-tabs.png`, before: ['new-tab'] },
    { file: `${prefix}-capsule-dark-terminal-whoami.png`, before: ['whoami'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openTerminal(page);
    if (shot.before) {
      for (const action of shot.before) {
        await runScenarioAction(page, action);
      }
    }
    const out = path.join(dest, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    process.stdout.write(`  → ${out}\n`);
  }

  await browser.close();
  console.log(`✓ capture-capsule-terminal-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
