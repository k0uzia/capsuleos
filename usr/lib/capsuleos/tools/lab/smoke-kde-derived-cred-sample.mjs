#!/usr/bin/env node
/**
 * Échantillon Cred* sur dérivés KDE — kickoff + Discover (sans inventaire Cred dédié).
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-derived-cred-sample.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500').replace(/\/$/, '');
const DERIVED = [
  { id: 'linux-opensuse', url: `${BASE}/home/SUSE/openSUSE/index.html` },
  { id: 'linux-mx-kde', url: `${BASE}/home/Debian/MX-KDE/index.html` },
  { id: 'linux-debian-kde', url: `${BASE}/home/Debian/Debian-KDE/index.html` },
];
const errors = [];

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));

if (!chromePath) {
  console.error('Chrome/Playwright introuvable');
  process.exit(1);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: chromePath });

for (const skin of DERIVED) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(skin.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

    await page.evaluate(() => window.openWindowByDataLink('mainMenu'));
    const minKickoffApps = skin.id === 'linux-mx-kde' ? 1 : 6;
    if (skin.id === 'linux-mx-kde') {
      await page.click('#mainMenu .menu-cat[data-cat-id="system"]');
    }
    await page.waitForFunction(
      ({ min }) => {
        const menu = document.getElementById('mainMenu');
        const apps = document.querySelectorAll('.menu-app-item').length;
        return menu && menu.style.display !== 'none' && apps >= min;
      },
      { min: minKickoffApps },
      { timeout: 25000 },
    ).catch(async () => {
      const apps = await page.locator('.menu-app-item').count();
      errors.push(`${skin.id} kickoff : ${apps} apps (attendu ≥${minKickoffApps})`);
    });

    await page.evaluate(() => {
      document.querySelectorAll('.windowElement[data-link]').forEach((w) => { w.style.display = 'none'; });
    });
    await page.evaluate(() => window.openWindowByDataLink('update_manager'));
    await page.waitForSelector('.windowElement[data-link="update_manager"]', { state: 'visible', timeout: 15000 });
    const cards = await page.locator('[data-discover-home-mount] .kde-discover-card').count();
    if (cards < 3) {
      errors.push(`${skin.id} Discover : ${cards} cartes (attendu ≥3)`);
    }
  } catch (err) {
    errors.push(`${skin.id} : ${err.message || err}`);
  } finally {
    await page.close();
  }
}

await browser.close();

if (errors.length) {
  console.error('✗ smoke-kde-derived-cred-sample');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('✓ smoke-kde-derived-cred-sample OK');
