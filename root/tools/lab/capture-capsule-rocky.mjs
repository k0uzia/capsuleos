#!/usr/bin/env node
/**
 * Captures PNG du skin Rocky CapsuleOS (Playwright) pour inventaire parité.
 * Fichiers *-nautilus.png = slot gabarit `nemo` (app simulée « Fichiers », pas Nemo Cinnamon).
 * *-terminal.png = slot `terminal` (Ptyxis côté VM réelle).
 * Usage : node root/tools/lab/capture-capsule-rocky.mjs [dest-dir]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DEST = process.argv[2] || path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/rocky/inventory/rocky-capsule');
const URL = process.env.CAPSULE_ROCKY_URL || 'http://127.0.0.1:5500/home/RedHat/Rocky/index.html';
const VIEWPORT = { width: 1280, height: 800 };
const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
const chromePath = process.env.PLAYWRIGHT_CHROME || defaultChrome;

const sleep = (page, ms) => page.waitForTimeout(ms);

const setTheme = async (page, theme) => {
  await page.evaluate((t) => {
    const resolved = t === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('gnome-theme', resolved);
    localStorage.setItem('mint-theme', resolved);
  }, theme);
};

const resetWindows = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset ? win.dataset.link : '';
      if (!slot || slot === 'mainMenu') return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
      link.classList.remove('running-link', 'active-link');
    });
    try {
      if (window.CapsuleTaskbarLauncherState?.refresh) {
        window.CapsuleTaskbarLauncherState.refresh();
      }
    } catch (_) {
      /* dock GNOME sans barre Mint */
    }
  });
};

const openSlot = async (page, slot) => {
  let opened = { ok: false, display: 'missing' };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    opened = await page.evaluate((s) => {
      const el = document.querySelector('.windowElement[data-link="' + s + '"]');
      if (el) {
        el.classList.remove('windowElementActive', 'active');
      }
      const ok = typeof window.openWindowByDataLink === 'function'
        ? window.openWindowByDataLink(s)
        : false;
      const display = el ? getComputedStyle(el).display : 'missing';
      return { ok, display, style: el?.style?.display || '' };
    }, slot);
    if (opened.ok && opened.display !== 'none' && opened.display !== 'missing') {
      break;
    }
    await sleep(page, 500);
  }
  if (!opened.ok || opened.display === 'none' || opened.display === 'missing') {
    throw new Error(`Impossible d'ouvrir ${slot} (display=${opened.display}, style=${opened.style})`);
  }
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        if (!root.querySelector('.nautilus-app__headerbar')) return false;
        const grid = root.querySelector('.nemo-app__content-grid');
        if (!grid || grid.children.length < 2) return false;
        const img = grid.querySelector('img');
        return !!(img && img.complete && img.naturalWidth > 0 && !String(img.src).includes('cinnamon'));
      },
      null,
      { timeout: 60000 },
    );
  }
  await sleep(page, 800);
};

const main = async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
    timeout: 60000,
  });
  await page.waitForFunction(
    () => document.querySelector('.windowElement[data-link="nemo"] main#gestionnaire.nemo-app'),
    null,
    { timeout: 90000 },
  );
  await page.evaluate(() => {
    if (window.CapsuleExplorerIconBase?.apply) {
      window.CapsuleExplorerIconBase.apply();
    }
  });

  const shots = [
    { file: 'rocky-capsule-dark-desktop.png', theme: 'dark', slots: [] },
    { file: 'rocky-capsule-dark-nautilus.png', theme: 'dark', slots: ['nemo'], focus: 'nemo' },
    { file: 'rocky-capsule-dark-firefox.png', theme: 'dark', slots: ['firefox'], focus: 'firefox' },
    { file: 'rocky-capsule-dark-terminal.png', theme: 'dark', slots: ['terminal'], focus: 'terminal' },
    { file: 'rocky-capsule-light-desktop.png', theme: 'light', slots: [] },
    { file: 'rocky-capsule-light-firefox.png', theme: 'light', slots: ['firefox'], focus: 'firefox' },
    { file: 'rocky-capsule-light-nautilus.png', theme: 'light', slots: ['nemo'], focus: 'nemo' },
  ];

  for (const { file, theme, slots, focus } of shots) {
    await setTheme(page, theme);
    await resetWindows(page);
    await sleep(page, 300);
    const order = focus && !slots.includes(focus) ? [...slots, focus] : slots;
    for (const slot of order) {
      await openSlot(page, slot);
    }
    if (focus) {
      await openSlot(page, focus);
    }
    const out = path.join(DEST, file);
    await page.screenshot({ path: out, fullPage: false });
    const size = fs.statSync(out).size;
    process.stdout.write(`  → ${out} (${size} octets)\n`);
  }

  await browser.close();
  process.stdout.write(`OK ${DEST} (${shots.length} fichiers)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
