#!/usr/bin/env node
/**
 * Captures Capsule GNOME Paramètres — scénarios Th1–Th4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-themes-views.mjs --id linux-alma
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

const openThemes = async (page, panelId = 'appearance') => {
  await page.evaluate((panel) => {
    if (typeof window.setCapsuleSettingsPanel === 'function') {
      window.setCapsuleSettingsPanel(panel);
    }
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('themes');
    }
  }, panelId);
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="themes"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && document.querySelector('#themesApp')?.dataset.initialized === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 400);
};

const SCENARIOS = [
  {
    file: 'rocky-capsule-dark-themes-dark-mode.png',
    run: async (page) => {
      await openThemes(page, 'appearance');
      await page.click('[data-theme-option="dark"]');
      await sleep(page, 500);
    },
  },
  {
    file: 'rocky-capsule-dark-themes-wallpaper-alma.png',
    run: async (page) => {
      await openThemes(page, 'background');
      const wpId = await page.evaluate(() => {
        const catalog = window.CapsuleThemeStorage?.getWallpaperCatalog?.(document.body?.id || '');
        const entry = (catalog || []).find((e) => e.default) || (catalog || [])[0];
        return entry?.id || 'almalinux';
      });
      await page.waitForSelector(`[data-wallpaper-id="${wpId}"]`, { timeout: 8000 });
      await page.click(`[data-wallpaper-id="${wpId}"]`);
      await sleep(page, 400);
    },
  },
  {
    file: 'rocky-capsule-dark-themes-accent-teal.png',
    run: async (page) => {
      await openThemes(page, 'appearance');
      await page.click('[data-accent-chip="teal"]');
      await sleep(page, 300);
    },
  },
  {
    file: 'rocky-capsule-dark-themes-displays.png',
    run: async (page) => {
      await openThemes(page, 'appearance');
      await page.click('.gnome-settings__navitem[data-gnome-settings-panel="displays"]');
      await sleep(page, 300);
    },
  },
];

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }

  const paths = appsPathsForRegistry(opts.id);
  const outDir = paths.capsuleCapturesDir;
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });

  const url = resolveCapsuleOsUrl(opts.id, base);

  for (const scenario of SCENARIOS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await scenario.run(page);
    const win = page.locator('.windowElement[data-link="themes"]');
    const outPath = path.join(outDir, scenario.file);
    await win.screenshot({ path: outPath });
    process.stdout.write(`  ✓ ${scenario.file}\n`);
    await page.close();
  }

  await browser.close();
  console.log(`✓ capture-capsule-themes-views ${opts.id} — ${SCENARIOS.length} PNG → ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
