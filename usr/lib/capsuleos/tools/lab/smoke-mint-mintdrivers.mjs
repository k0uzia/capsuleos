#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('footer nav a[data-link="mainMenu"]');
await page.waitForTimeout(400);
await page.fill('#menu-search', 'Gestionnaire de pilotes');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(200);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="mintdrivers"]');
  const app = document.getElementById('mintDriversApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.mintDriversInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
  };
});

await page.waitForTimeout(1000);

const settled = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="mintdrivers"]');
  const app = document.getElementById('mintDriversApp');
  const noDrivers = app?.querySelector('[data-md-page="no-drivers"]');
  return {
    noDriversVisible: noDrivers && !noDrivers.hidden,
    noDriversTitle: noDrivers?.querySelector('.md-page__title')?.textContent,
    noDriversBody: noDrivers?.querySelector('.md-page__body')?.textContent,
    title: win?.querySelector('#windowTitle')?.textContent,
    chromeToolkit: win?.getAttribute('data-window-chrome-toolkit'),
  };
});

await browser.close();

const ok = opened.winVisible
  && opened.appReady
  && settled.noDriversVisible
  && /pilote/i.test(settled.noDriversTitle || '')
  && /aucun pilote/i.test(settled.noDriversBody || '')
  && settled.title === 'Gestionnaire de pilotes';

const report = { opened, settled, ok };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(ok ? 0 : 1);
