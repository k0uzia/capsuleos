#!/usr/bin/env node
/**
 * Captures Capsule GNOME Text Editor — scénarios T1–T4.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-capsule-text-editor-views.mjs --id linux-alma
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

const openTextEditor = async (page) => {
  const ready = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="text_editor"]');
    return !!(win && getComputedStyle(win).display !== 'none'
      && win.querySelector('#xedApp.text-editor--gnome'));
  });
  if (ready) {
    await sleep(page, 300);
    return;
  }
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== 'text_editor') {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('text_editor');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="text_editor"]');
      return !!(win && getComputedStyle(win).display !== 'none'
        && win.querySelector('#xedApp.text-editor--gnome'));
    },
    null,
    { timeout: 60000 },
  );
  await page.waitForFunction(
    () => document.getElementById('xedApp')?.dataset.xedInit === 'true',
    null,
    { timeout: 8000 },
  );
  await sleep(page, 400);
};

const runScenarioAction = async (page, action) => {
  if (action === 'reset-session') {
    await page.evaluate(() => {
      window.sessionStorage.removeItem('capsule-gnome-text-editor-session');
    });
    return;
  }
  if (action === 'new-doc-dirty') {
    await page.fill('[data-te-gnome-area]', 'Bonjour CapsuleOS');
    await sleep(page, 200);
    return;
  }
  if (action === 'open-vfs') {
    await page.evaluate(() => {
      document.querySelector('[data-te-gnome-action="open-vfs"]')?.click();
    });
    await page.waitForFunction(
      () => document.querySelector('[data-te-gnome-area]')?.value.includes('Introduction à Bash'),
      null,
      { timeout: 8000 },
    );
    await sleep(page, 300);
    return;
  }
  if (action === 'save-as-dialog') {
    await page.fill('[data-te-gnome-area]', 'Contenu pédagogique');
    await page.evaluate(() => {
      document.querySelector('[data-te-gnome-action="save-as"]')?.click();
    });
    await page.waitForSelector('[data-te-gnome-save-dialog]:not([hidden])', { timeout: 5000 });
    return;
  }
  if (action === 'tabs-two') {
    await page.fill('[data-te-gnome-area]', 'Onglet un');
    await page.evaluate(() => {
      document.querySelector('[data-te-gnome-action="new-tab"]')?.click();
    });
    await sleep(page, 250);
    await page.fill('[data-te-gnome-area]', 'Onglet deux');
    await sleep(page, 300);
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
    { file: 'rocky-capsule-dark-text-editor.png' },
    { file: 'rocky-capsule-dark-text-editor-new-doc.png', before: ['new-doc-dirty'] },
    { file: 'rocky-capsule-dark-text-editor-open-file.png', before: ['open-vfs'] },
    { file: 'rocky-capsule-dark-text-editor-save-as.png', before: ['save-as-dialog'] },
    { file: 'rocky-capsule-dark-text-editor-tabs.png', before: ['tabs-two'] },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
      window.sessionStorage.removeItem('capsule-gnome-text-editor-session');
    });
    await openTextEditor(page);
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
  console.log(`✓ capture-capsule-text-editor-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
