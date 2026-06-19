#!/usr/bin/env node
/**
 * Captures Capsule GNOME Tour — scénarios T1–T4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-tour-views.mjs --id linux-alma
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

const openTour = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('tour');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="tour"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && document.getElementById('gnomeTourApp')?.dataset.tourInit === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 300);
};

const clickNext = async (page) => {
  await page.click('#gnome-tour-next');
  await sleep(page, 200);
};

const SCENARIOS = [
  {
    file: 'rocky-capsule-dark-tour.png',
    run: async (page) => {
      await openTour(page);
    },
  },
  {
    file: 'rocky-capsule-dark-tour-welcome.png',
    run: async (page) => {
      await openTour(page);
    },
  },
  {
    file: 'rocky-capsule-dark-tour-overview.png',
    run: async (page) => {
      await openTour(page);
      await clickNext(page);
    },
  },
  {
    file: 'rocky-capsule-dark-tour-workspaces.png',
    run: async (page) => {
      await openTour(page);
      await clickNext(page);
      await clickNext(page);
    },
  },
  {
    file: 'rocky-capsule-dark-tour-finish.png',
    run: async (page) => {
      await openTour(page);
      for (let i = 0; i < 5; i += 1) {
        const action = await page.getAttribute('#gnome-tour-next', 'data-tour-gnome-action');
        await clickNext(page);
        if (action === 'finish') {
          break;
        }
      }
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
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await scenario.run(page);
    const win = page.locator('.windowElement[data-link="tour"]');
    const outPath = path.join(outDir, scenario.file);
    await win.screenshot({ path: outPath });
    process.stdout.write(`  ✓ ${scenario.file}\n`);
    await page.close();
  }

  await browser.close();
  console.log(`✓ capture-capsule-tour-views ${opts.id} — ${SCENARIOS.length} PNG → ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
