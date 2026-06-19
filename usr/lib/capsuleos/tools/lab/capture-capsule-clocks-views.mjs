#!/usr/bin/env node
/**
 * Captures Capsule GNOME Horloges — scénarios H1–H4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-clocks-views.mjs --id linux-alma
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GNOME_CLOCKS_SESSION_KEY = 'capsule-gnome-clocks-session';

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

const openClocks = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('clocks');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="clocks"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && document.getElementById('gnomeClocksApp')?.dataset.clocksInit === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 300);
};

const SCENARIOS = [
  {
    file: 'rocky-capsule-dark-clocks.png',
    run: async (page) => {
      await openClocks(page);
    },
  },
  {
    file: 'rocky-capsule-dark-clocks-world-tokyo.png',
    run: async (page) => {
      await openClocks(page);
      await page.click('[data-clocks-action="add-city"]');
      await sleep(page, 250);
    },
  },
  {
    file: 'rocky-capsule-dark-clocks-stopwatch-running.png',
    run: async (page) => {
      await openClocks(page);
      await page.click('[data-clocks-view="stopwatch"]');
      await sleep(page, 150);
      await page.click('[data-clocks-action="stopwatch-toggle"]');
      await sleep(page, 400);
    },
  },
  {
    file: 'rocky-capsule-dark-clocks-timer-running.png',
    run: async (page) => {
      await openClocks(page);
      await page.click('[data-clocks-view="timer"]');
      await sleep(page, 150);
      await page.click('[data-clocks-action="timer-toggle"]');
      await sleep(page, 300);
    },
  },
  {
    file: 'rocky-capsule-dark-clocks-alarm-added.png',
    run: async (page) => {
      await openClocks(page);
      await page.click('[data-clocks-view="alarms"]');
      await sleep(page, 150);
      await page.click('[data-clocks-action="add-alarm"]');
      await sleep(page, 250);
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
    await page.evaluate((key) => {
      window.sessionStorage.removeItem(key);
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    }, GNOME_CLOCKS_SESSION_KEY);
    await scenario.run(page);
    const win = page.locator('.windowElement[data-link="clocks"]');
    const outPath = path.join(outDir, scenario.file);
    await win.screenshot({ path: outPath });
    process.stdout.write(`  ✓ ${scenario.file}\n`);
    await page.close();
  }

  await browser.close();
  console.log(`✓ capture-capsule-clocks-views ${opts.id} — ${SCENARIOS.length} PNG → ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
