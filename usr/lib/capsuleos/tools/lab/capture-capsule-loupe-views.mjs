#!/usr/bin/env node
/**
 * Captures Capsule GNOME Loupe — scénarios Li1–Li4 (slot `visionneur_images`).
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
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const vendorPrefix = (registryId) => {
  if (registryId === 'linux-alma') return 'alma';
  if (registryId === 'linux-fedora') return 'fedora';
  if (registryId === 'linux-ubuntu') return 'ubuntu';
  return 'rocky';
};

const openLoupe = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('visionneur_images');
    }
  });
  await page.waitForFunction(
    () => document.getElementById('visionneurImages')?.dataset?.loupeGnomeInit === 'true',
    null,
    { timeout: 15000 },
  );
  await sleep(page, 400);
};

const main = async () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  fs.mkdirSync(paths.capsuleCapturesDir, { recursive: true });
  const prefix = vendorPrefix(opts.id);
  const url = resolveCapsuleOsUrl(opts.id, resolveCapsuleHttpBase(opts.id));

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
    { file: `${prefix}-capsule-dark-loupe-empty.png`, setup: null },
    { file: `${prefix}-capsule-dark-loupe-image.png`, setup: 'demo' },
    { file: `${prefix}-capsule-dark-loupe-zoom.png`, setup: 'zoom' },
    { file: `${prefix}-capsule-dark-loupe-meta.png`, setup: 'meta' },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openLoupe(page);
    if (shot.setup === 'demo' || shot.setup === 'zoom' || shot.setup === 'meta') {
      await page.evaluate(() => { if (typeof window.openPixDemoImage === 'function') window.openPixDemoImage(); });
      await sleep(page, 500);
    }
    if (shot.setup === 'zoom') {
      await page.click('[data-loupe-gnome-action="zoom-in"]');
      await sleep(page, 200);
    }
    if (shot.setup === 'meta') {
      await page.click('[data-loupe-gnome-action="toggle-meta"]');
      await sleep(page, 200);
    }
    const out = path.join(paths.capsuleCapturesDir, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    process.stdout.write(`  → ${out}\n`);
  }

  await browser.close();
  console.log(`✓ capture-capsule-loupe-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
