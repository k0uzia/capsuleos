#!/usr/bin/env node
/**
 * Captures Capsule GNOME Baobab — scénarios B1–B4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-baobab-views.mjs --id linux-alma
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

const openBaobab = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('baobab');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="baobab"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && document.getElementById('gnomeBaobabApp')?.dataset.baobabInit === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 300);
};

const SCENARIOS = [
  {
    file: 'rocky-capsule-dark-baobab.png',
    run: async (page) => {
      await openBaobab(page);
    },
  },
  {
    file: 'rocky-capsule-dark-baobab-home.png',
    run: async (page) => {
      await openBaobab(page);
      await page.click('[data-baobab-gnome-volume="home"]');
      await sleep(page, 200);
    },
  },
  {
    file: 'rocky-capsule-dark-baobab-computer.png',
    run: async (page) => {
      await openBaobab(page);
      await page.click('[data-baobab-gnome-volume="root"]');
      await sleep(page, 200);
    },
  },
  {
    file: 'rocky-capsule-dark-baobab-treemap.png',
    run: async (page) => {
      await openBaobab(page);
      await page.click('[data-baobab-gnome-action="scan"]');
      await page.waitForFunction(
        () => document.getElementById('gnomeBaobabApp')?.dataset.baobabTreemapReady === 'true',
        null,
        { timeout: 8000 },
      );
      await sleep(page, 200);
    },
  },
  {
    file: 'rocky-capsule-dark-baobab-boot.png',
    run: async (page) => {
      await openBaobab(page);
      await page.click('[data-baobab-gnome-volume="boot"]');
      await sleep(page, 200);
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
    const win = page.locator('.windowElement[data-link="baobab"]');
    const outPath = path.join(outDir, scenario.file);
    await win.screenshot({ path: outPath });
    process.stdout.write(`  ✓ ${scenario.file}\n`);
    await page.close();
  }

  await browser.close();
  console.log(`✓ capture-capsule-baobab-views ${opts.id} — ${SCENARIOS.length} PNG → ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
