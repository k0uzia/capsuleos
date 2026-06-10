#!/usr/bin/env node
/**
 * Captures Capsule GNOME Calculatrice — scénarios C1–C4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-calculator-views.mjs --id linux-alma
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

const openCalculator = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="calculator"]');
    return !!(win && getComputedStyle(win).display !== 'none'
      && document.getElementById('gnomeCalculatorApp'));
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'calculator') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('calculator');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="calculator"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && document.getElementById('gnomeCalculatorApp'));
    },
    null,
    { timeout: 60000 },
  );
  await page.waitForFunction(
    () => document.getElementById('gnomeCalculatorApp')?.dataset.calcInit === 'true',
    null,
    { timeout: 8000 },
  );
  await sleep(page, 400);
};

const clickCalc = async (page, selector) => {
  await page.click(selector);
  await sleep(page, 80);
};

const runScenarioAction = async (page, action) => {
  if (action === 'basic-2plus2') {
    await clickCalc(page, '[data-calc="digit"][data-digit="2"]');
    await clickCalc(page, '[data-calc="op"][data-op="+"]');
    await clickCalc(page, '[data-calc="digit"][data-digit="2"]');
    await clickCalc(page, '[data-calc="equals"]');
    return;
  }
  if (action === 'chain-5x3') {
    await clickCalc(page, '[data-calc="digit"][data-digit="5"]');
    await clickCalc(page, '[data-calc="op"][data-op="*"]');
    await clickCalc(page, '[data-calc="digit"][data-digit="3"]');
    await clickCalc(page, '[data-calc="equals"]');
    return;
  }
  if (action === 'mode-advanced') {
    await clickCalc(page, '#gnome-calc-mode');
    await page.waitForSelector('#gnome-calc-mode-popover:not([hidden])', { timeout: 5000 });
    await clickCalc(page, '[data-calc-mode="advanced"]');
    await sleep(page, 300);
    return;
  }
  if (action === 'copy-7x8') {
    await clickCalc(page, '[data-calc="digit"][data-digit="7"]');
    await clickCalc(page, '[data-calc="op"][data-op="*"]');
    await clickCalc(page, '[data-calc="digit"][data-digit="8"]');
    await clickCalc(page, '[data-calc="equals"]');
    await page.evaluate(() => {
      document.querySelector('[data-calc-gnome-action="copy-result"]')?.click();
    });
    await page.waitForSelector('[data-calc-gnome-toast]:not([hidden])', { timeout: 5000 });
    await sleep(page, 250);
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
    { file: 'rocky-capsule-dark-calculator.png' },
    { file: 'rocky-capsule-dark-calculator-basic.png', before: ['basic-2plus2'] },
    { file: 'rocky-capsule-dark-calculator-chain-clear.png', before: ['chain-5x3'] },
    { file: 'rocky-capsule-dark-calculator-advanced.png', before: ['mode-advanced'] },
    { file: 'rocky-capsule-dark-calculator-copy.png', before: ['copy-7x8'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openCalculator(page);
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
  console.log(`✓ capture-capsule-calculator-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
