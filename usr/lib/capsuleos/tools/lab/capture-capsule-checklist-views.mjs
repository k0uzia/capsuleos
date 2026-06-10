#!/usr/bin/env node
/**
 * Captures Capsule GNOME Missions checklist — scénarios Ck1–Ck4 (slot `checklist`, Capsule-only).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-checklist-views.mjs --id linux-alma
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

const openChecklist = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="checklist"]');
    const root = document.querySelector('[data-checklist-gnome-root]');
    return !!(win && getComputedStyle(win).display !== 'none' && root?.dataset?.checklistGnomeInit === 'true');
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'checklist') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('checklist');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="checklist"]');
      const root = document.querySelector('[data-checklist-gnome-root]');
      return !!(win && getComputedStyle(win).display !== 'none' && root?.dataset?.checklistGnomeInit === 'true');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const runScenarioAction = async (page, action) => {
  if (action === 'check-nemo') {
    await page.click('[data-checklist-gnome-task-id="open-nemo"] [data-checklist-gnome-check]');
    await sleep(page, 350);
    return;
  }
  if (action === 'check-two') {
    await page.click('[data-checklist-gnome-task-id="open-nemo"] [data-checklist-gnome-check]');
    await sleep(page, 150);
    await page.click('[data-checklist-gnome-task-id="open-firefox"] [data-checklist-gnome-check]');
    await sleep(page, 350);
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
    { file: `${prefix}-capsule-dark-checklist.png` },
    { file: `${prefix}-capsule-dark-checklist-mission.png` },
    { file: `${prefix}-capsule-dark-checklist-done.png`, before: ['check-nemo'] },
    { file: `${prefix}-capsule-dark-checklist-progress.png`, before: ['check-two'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      const key = window.CAPSULE_CHECKLIST_STORAGE_KEY || 'mint-checklist';
      localStorage.removeItem(key);
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openChecklist(page);
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
  console.log(`✓ capture-capsule-checklist-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
