#!/usr/bin/env node
/**
 * Captures Capsule GNOME Software — vues explore / updates / installed / detail / category.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-software-views.mjs --id linux-alma
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

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

const openSoftware = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="update_manager"]');
    return !!(win && getComputedStyle(win).display !== 'none'
      && win.querySelector('#updateManagerApp.gnome-software, .update-manager--gnome .gnome-software'));
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'update_manager') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('update_manager');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="update_manager"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && win.querySelector('#updateManagerApp, .update-manager--gnome .gnome-software'));
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 600);
};

const setSoftwareView = async (page, view, extra) => {
  await page.evaluate(({ viewId, extraOpts }) => {
    const root = document.getElementById('updateManagerApp');
    if (!root) return;
    if (viewId === 'explore') {
      root.querySelector('[data-um-gnome-nav="explore"]')?.click();
      return;
    }
    if (viewId === 'updates') {
      root.querySelector('[data-um-gnome-nav="updates"]')?.click();
      return;
    }
    if (viewId === 'installed') {
      root.querySelector('[data-um-gnome-nav="installed"]')?.click();
      return;
    }
    if (viewId === 'detail') {
      root.querySelector('[data-um-gnome-app="' + (extraOpts.appId || 'firefox') + '"]')?.click();
      return;
    }
    if (viewId === 'category') {
      root.querySelector('[data-um-gnome-category="' + (extraOpts.categoryId || 'productivity') + '"]')?.click();
    }
  }, { viewId: view, extraOpts: extra || {} });
  await sleep(page, 500);
};

const runScenarioAction = async (page, action) => {
  if (action === 'reset-installed') {
    await page.evaluate(() => {
      window.sessionStorage.removeItem('capsule-gnome-software-installed');
    });
    return;
  }
  if (action === 'install-writer') {
    await page.evaluate(async () => {
      const root = document.getElementById('updateManagerApp');
      root.querySelector('[data-um-gnome-app="libreoffice-writer"]')?.click();
      await new Promise((r) => setTimeout(r, 400));
      root.querySelector('[data-um-gnome-action="install"]')?.click();
    });
    await page.waitForFunction(
      () => document.querySelector('.gnome-software__detail-install')?.textContent === 'Ouvrir',
      null,
      { timeout: 12000 },
    );
    return;
  }
  if (action === 'search-writer') {
    await page.fill('[data-um-gnome-search]', 'writer');
    await sleep(page, 500);
    return;
  }
  if (action === 'updates-empty') {
    await page.click('[data-um-gnome-nav="updates"]');
    await sleep(page, 300);
    await page.click('[data-um-gnome-action="updateAll"]');
    await page.waitForSelector('[data-um-gnome-updates-empty]:not([hidden])', { timeout: 8000 });
    return;
  }
  if (action === 'installed-open-firefox') {
    await page.click('[data-um-gnome-nav="installed"]');
    await sleep(page, 400);
    await page.click('[data-um-gnome-installed-list] [data-um-gnome-action="open"][data-um-gnome-app="firefox"]');
    await sleep(page, 600);
  }
};

const main = async () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  const dest = paths.capsuleCapturesDir;
  fs.mkdirSync(dest, { recursive: true });

  const httpBase = resolveCapsuleHttpBase(opts.id);
  const url = resolveCapsuleOsUrl(opts.id, httpBase);

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
    { file: 'rocky-capsule-dark-software.png', view: 'explore' },
    { file: 'rocky-capsule-dark-software-updates.png', view: 'updates' },
    { file: 'rocky-capsule-dark-software-installed.png', view: 'installed' },
    { file: 'rocky-capsule-dark-software-detail.png', view: 'detail', extra: { appId: 'firefox' } },
    { file: 'rocky-capsule-dark-software-categories.png', view: 'category', extra: { categoryId: 'productivity' } },
    { file: 'rocky-capsule-dark-software-install-open.png', view: 'detail', extra: { appId: 'libreoffice-writer' }, before: ['reset-installed', 'install-writer'] },
    { file: 'rocky-capsule-dark-software-search-install.png', view: 'search', before: ['reset-installed', 'search-writer'] },
    { file: 'rocky-capsule-dark-software-updates-empty.png', view: 'updates', before: ['updates-empty'] },
    { file: 'rocky-capsule-dark-software-installed-open.png', view: 'installed', before: ['installed-open-firefox'] },
  ];

  await openSoftware(page);
  for (const shot of shots) {
    await openSoftware(page);
    if (shot.before) {
      for (const action of shot.before) {
        await runScenarioAction(page, action);
      }
    }
    if (shot.view === 'search') {
      await page.waitForSelector('[data-um-gnome-pane="search"]:not([hidden])', { timeout: 5000 }).catch(() => {});
    } else {
      await setSoftwareView(page, shot.view, shot.extra);
    }
    const out = path.join(dest, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    process.stdout.write(`  → ${out}\n`);
  }

  await browser.close();
  console.log(`✓ capture-capsule-software-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
