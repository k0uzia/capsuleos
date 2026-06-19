#!/usr/bin/env node
/**
 * Captures PNG apps P0 du skin Mint CapsuleOS (Playwright).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node root/tools/lab/capture-capsule-mint.mjs [dest-dir]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../../../usr/lib/capsuleos/tools/linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DEST = process.argv[2]
  || path.join(ROOT, 'root/docs/inventaires/captures/linux-mint/apps-visual-capsule');
const URL = process.env.CAPSULE_MINT_URL
  || resolveCapsuleOsUrl('linux-mint', process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500');
const VIEWPORT = { width: 1280, height: 800 };
const CAPTURE_CLOCK_ISO = '2026-06-08T14:30:00+02:00';

const defaultChrome = [
  process.env.PLAYWRIGHT_CHROME,
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const P0_SLOTS = [
  'nemo', 'firefox', 'terminal', 'themes', 'mintinstall', 'update_manager',
  'calculator', 'calendar', 'screenshot', 'text_editor', 'drawing',
  'lecteur_multimedia', 'libreoffice_startcenter',
];

const resetShell = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset?.link;
      if (!slot || slot === 'mainMenu') return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
      link.classList.remove('running-link', 'active-link');
    });
  });
  await sleep(page, 120);
};

const openSlot = async (page, slot) => {
  await resetShell(page);
  await page.evaluate((s) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(s);
    }
  }, slot);
  await page.waitForSelector(`.windowElement[data-link="${slot}"]`, {
    state: 'visible',
    timeout: 20000,
  }).catch(() => {});
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        const grid = root.querySelector('.nemoElement[data-pane="primary"], #voletContainer > .nemoElement');
        return grid && grid.querySelectorAll('a[data-item-name]').length >= 2;
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
  }
  if (slot === 'themes') {
    await page.waitForFunction(
      () => document.getElementById('cinnamonSettingsApp')?.dataset?.cinnamonSettingsInit === 'true',
      null,
      { timeout: 20000 },
    ).catch(() => {});
  }
  if (slot === 'mintinstall') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="mintinstall"]');
        return root && root.style.display !== 'none' && root.querySelector('[data-mintinstall-home]');
      },
      null,
      { timeout: 25000 },
    ).catch(() => {});
  }
  if (slot === 'update_manager') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="update_manager"]');
        return root && root.style.display !== 'none' && root.querySelector('[data-mintupdate-root]');
      },
      null,
      { timeout: 25000 },
    ).catch(() => {});
  }
  await sleep(page, 500);
};

const main = async () => {
  const { chromium } = await import('playwright');
  fs.mkdirSync(DEST, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: defaultChrome,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.clock.install({ time: new Date(CAPTURE_CLOCK_ISO) });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  let count = 0;
  for (const slot of P0_SLOTS) {
    await openSlot(page, slot);
    const file = path.join(DEST, `mint-capsule-${slot}.png`);
    await page.screenshot({ path: file, fullPage: false });
    process.stdout.write(`  → ${file.replace(`${ROOT}/`, '')}\n`);
    count += 1;
  }

  await browser.close();
  process.stdout.write(`✓ capture-capsule-mint — ${count} fichier(s)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
