#!/usr/bin/env node
/**
 * Captures Capsule GNOME Rhythmbox — scénarios Rb1–Rb4 (slot `lecteur_multimedia` Ubuntu).
 */
import fs from 'fs';
import path from 'path';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { vendorPrefix } from './apps-parity-capture-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu' };
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

const openRhythmbox = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('lecteur_multimedia');
    }
  });
  await page.waitForSelector('.windowElement[data-link="lecteur_multimedia"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('rhythmboxApp')?.dataset?.rbGnomeInit === 'true',
    null,
    { timeout: 15000 },
  );
  await sleep(page, 400);
};

const main = async () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  fs.mkdirSync(paths.capsuleCapturesDir, { recursive: true });
  const url = resolveCapsuleOsUrl(opts.id, resolveCapsuleHttpBase(opts.id));
  const prefix = vendorPrefix(opts.id);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const shots = [
    { file: `${prefix}-capsule-dark-rhythmbox-library.png`, setup: null },
    { file: `${prefix}-capsule-dark-rhythmbox-track.png`, setup: 'track' },
    { file: `${prefix}-capsule-dark-rhythmbox-play.png`, setup: 'play' },
    { file: `${prefix}-capsule-dark-rhythmbox-podcasts.png`, setup: 'podcasts' },
  ];

  for (const shot of shots) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('gnome-theme', 'dark');
    });
    await openRhythmbox(page);
    const clickRb = async (sel) => page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }, sel);
    if (shot.setup === 'track') {
      await clickRb('[data-rb-gnome-track="capsule-lab-mix"]');
      await sleep(page, 200);
    }
    if (shot.setup === 'play') {
      await clickRb('[data-rb-gnome-action="play-pause"]');
      await sleep(page, 200);
    }
    if (shot.setup === 'podcasts') {
      await clickRb('[data-rb-gnome-nav="podcasts"]');
      await sleep(page, 200);
    }
    const out = path.join(paths.capsuleCapturesDir, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    process.stdout.write(`  → ${out}\n`);
    if (shot.setup === null && opts.id === 'linux-popos') {
      const alias = path.join(paths.capsuleCapturesDir, 'popos-capsule-dark-lecteur_multimedia.png');
      fs.copyFileSync(out, alias);
      process.stdout.write(`  → ${alias} (alias lecteur_multimedia)\n`);
    }
  }

  await browser.close();
  console.log(`✓ capture-capsule-rhythmbox-views ${opts.id} — ${shots.length} fichiers`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
