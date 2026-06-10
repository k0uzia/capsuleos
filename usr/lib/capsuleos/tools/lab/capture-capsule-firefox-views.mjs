#!/usr/bin/env node
/**
 * Captures Capsule GNOME Firefox — scénarios F1–F4 (slot `firefox`).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-firefox-views.mjs --id linux-alma
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

const openFirefox = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="firefox"]');
    const app = win && win.querySelector('[data-firefox-app][data-initialized="true"]');
    return !!(win && getComputedStyle(win).display !== 'none' && app);
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'firefox') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('firefox');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="firefox"]');
      const app = win && win.querySelector('[data-firefox-app]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && app?.dataset?.initialized === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const runScenarioAction = async (page, action) => {
  if (action === 'address-os-lacapsule') {
    await page.fill('[data-firefox-gnome-address]', 'os-lacapsule');
    await page.press('[data-firefox-gnome-address]', 'Enter');
    await sleep(page, 500);
    return;
  }
  if (action === 'new-tab') {
    await page.click('[data-browser-action="new-tab"]');
    await sleep(page, 350);
    return;
  }
  if (action === 'bookmark-capsule') {
    await page.evaluate(() => {
      const link = document.querySelector('[data-browser-bookmark="La Capsule"]');
      if (link) {
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
    { file: `${prefix}-capsule-dark-firefox.png` },
    { file: `${prefix}-capsule-dark-firefox-home.png`, before: [] },
    { file: `${prefix}-capsule-dark-firefox-address.png`, before: ['address-os-lacapsule'] },
    { file: `${prefix}-capsule-dark-firefox-tabs.png`, before: ['new-tab'] },
    { file: `${prefix}-capsule-dark-firefox-bookmark.png`, before: ['bookmark-capsule'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openFirefox(page);
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
  console.log(`✓ capture-capsule-firefox-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
