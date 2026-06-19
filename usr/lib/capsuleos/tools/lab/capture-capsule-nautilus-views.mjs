#!/usr/bin/env node
/**
 * Captures Capsule GNOME Nautilus — scénarios N1–N4 (slot `nemo`).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-nautilus-views.mjs --id linux-alma
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

const isCosmicNautilus = (registryId) => registryId === 'linux-popos';

const nautilusReadySelector = (cosmic) => (cosmic
  ? 'main#gestionnaire.cosmic-files-app .nemo-app__content-grid'
  : '[data-nautilus-gnome-root]');

const openNautilus = async (page, registryId) => {
  const cosmic = isCosmicNautilus(registryId);
  const readySel = nautilusReadySelector(cosmic);
  const ready = await page.evaluate(({ sel, cosmicMode }) => {
    const win = document.querySelector('.windowElement[data-link="nemo"]');
    if (!win || getComputedStyle(win).display === 'none') return false;
    if (cosmicMode) {
      const grid = win.querySelector('.nemo-app__content-grid');
      return !!(win.querySelector('main#gestionnaire.cosmic-files-app') && grid);
    }
    return !!win.querySelector(sel);
  }, { sel: readySel, cosmicMode: cosmic });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'nemo') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('nemo');
    }
  });
  await page.waitForFunction(
    ({ sel, cosmicMode }) => {
      const win = document.querySelector('.windowElement[data-link="nemo"]');
      if (!win || getComputedStyle(win).display === 'none') return false;
      if (cosmicMode) {
        const grid = win.querySelector('.nemo-app__content-grid');
        return !!(win.querySelector('main#gestionnaire.cosmic-files-app') && grid);
      }
      return !!win.querySelector(sel);
    },
    { sel: readySel, cosmicMode: cosmic },
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const runScenarioAction = async (page, action, registryId) => {
  const cosmic = isCosmicNautilus(registryId);
  if (action === 'nav-documents') {
    await page.click(cosmic
      ? '.windowElement[data-link="nemo"] [data-sidebar-id="documents"]'
      : '[data-nautilus-gnome-sidebar="documents"]');
    await sleep(page, 450);
    return;
  }
  if (action === 'new-folder') {
    if (cosmic) {
      await page.click('.windowElement[data-link="nemo"] [data-sidebar-id="home"]');
      await sleep(page, 450);
      return;
    }
    await page.click('[data-nautilus-gnome-action="new-folder"]');
    await sleep(page, 550);
    return;
  }
  if (action === 'nav-starred') {
    if (cosmic) {
      await page.click('.windowElement[data-link="nemo"] [data-sidebar-id="home"]');
      await sleep(page, 400);
      return;
    }
    await page.click('[data-nautilus-gnome-sidebar="starred"]');
    await sleep(page, 400);
    return;
  }
  if (action === 'nav-network') {
    await page.click(cosmic
      ? '.windowElement[data-link="nemo"] [data-sidebar-id="network"]'
      : '[data-nautilus-gnome-sidebar="network"]');
    await sleep(page, 400);
  }
};

import { vendorPrefix } from './apps-parity-capture-lib.mjs';

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
    { file: `${prefix}-capsule-dark-nautilus-window.png`, windowOnly: true },
    { file: `${prefix}-capsule-dark-nautilus.png` },
    { file: `${prefix}-capsule-dark-nautilus-home.png`, before: [] },
    { file: `${prefix}-capsule-dark-nautilus-documents.png`, before: ['nav-documents'] },
    { file: `${prefix}-capsule-dark-nautilus-new-folder.png`, before: ['new-folder'] },
    { file: `${prefix}-capsule-dark-nautilus-starred-network.png`, before: ['nav-starred', 'nav-network'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openNautilus(page, opts.id);
    if (shot.before) {
      for (const action of shot.before) {
        await runScenarioAction(page, action, opts.id);
      }
    }
    const out = path.join(dest, shot.file);
    if (shot.windowOnly) {
      await page.locator('.windowElement[data-link="nemo"]').screenshot({ path: out });
    } else {
      await page.screenshot({ path: out, fullPage: false });
    }
    process.stdout.write(`  → ${out}\n`);
  }

  await browser.close();
  console.log(`✓ capture-capsule-nautilus-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
