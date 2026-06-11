#!/usr/bin/env node
/**
 * Captures Capsule GNOME LibreOffice Writer — scénarios Lw1–Lw4 (slot `librewriter`).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-librewriter-views.mjs --id linux-alma
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

const openLibrewriter = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="librewriter"]');
    const app = win && document.getElementById('lw-app');
    return !!(win && getComputedStyle(win).display !== 'none' && app?.dataset?.lwInit === '1');
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'librewriter') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('librewriter');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="librewriter"]');
      const app = document.getElementById('lw-app');
      return !!(win && getComputedStyle(win).display !== 'none' && app?.dataset?.lwInit === '1');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const runScenarioAction = async (page, action) => {
  if (action === 'type-text') {
    await page.click('[data-librewriter-gnome-page]');
    await page.fill('[data-librewriter-gnome-page]', 'CapsuleOS AlmaLinux');
    await sleep(page, 350);
    return;
  }
  if (action === 'bold') {
    await page.click('[data-librewriter-gnome-page]');
    await page.fill('[data-librewriter-gnome-page]', 'Titre Capsule');
    await page.evaluate(() => {
      const pageEl = document.getElementById('lw-page');
      if (!pageEl) return;
      const range = document.createRange();
      range.selectNodeContents(pageEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    await page.click('#btn-bold');
    await sleep(page, 350);
    return;
  }
  if (action === 'save') {
    await page.click('[data-librewriter-gnome-page]');
    await page.fill('[data-librewriter-gnome-page]', 'Document pédagogique');
    await sleep(page, 200);
    await page.click('[data-librewriter-gnome-toolbar-std] [data-librewriter-gnome-action="save"]');
    await sleep(page, 400);
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

  const shots = [
    { file: `${prefix}-capsule-dark-librewriter.png` },
    { file: `${prefix}-capsule-dark-librewriter-text.png`, before: ['type-text'] },
    { file: `${prefix}-capsule-dark-librewriter-bold.png`, before: ['bold'] },
    { file: `${prefix}-capsule-dark-librewriter-save.png`, before: ['save'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openLibrewriter(page);
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
  console.log(`✓ capture-capsule-librewriter-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
