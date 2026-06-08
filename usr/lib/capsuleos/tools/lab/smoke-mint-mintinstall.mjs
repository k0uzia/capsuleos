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
await page.waitForTimeout(40);
await page.fill('#menu-search', 'Logithèque');
await page.waitForTimeout(80);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(120);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="mintinstall"]');
  const app = document.getElementById('mintInstallApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.mintInstallInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    homeVisible: app && !app.querySelector('[data-mi-page="home"]')?.hidden,
    featuredCount: app?.querySelectorAll('#mi-featured-grid .mi-app__tile').length || 0,
  };
});

await page.fill('#mi-search', 'VLC');
await page.waitForTimeout(80);

const search = await page.evaluate(() => {
  const app = document.getElementById('mintInstallApp');
  const searchPage = app?.querySelector('[data-mi-page="search"]');
  const rows = app?.querySelectorAll('#mi-search-list .mi-app__list-item').length || 0;
  return {
    searchVisible: searchPage && !searchPage.hidden,
    rows,
    title: document.querySelector('#mi-search-title')?.textContent,
  };
});

await page.click('[data-mi-cat="internet"]');
await page.waitForTimeout(60);

const category = await page.evaluate(() => {
  const app = document.getElementById('mintInstallApp');
  const listPage = app?.querySelector('[data-mi-page="list"]');
  const rows = app?.querySelectorAll('#mi-app-list .mi-app__list-item').length || 0;
  return {
    listVisible: listPage && !listPage.hidden,
    rows,
    listTitle: document.querySelector('#mi-list-title')?.textContent,
  };
});

await page.click('#mi-app-list [data-mi-install]:not([disabled])');
await page.waitForTimeout(50);

const install = await page.evaluate(() => {
  const btn = document.querySelector('#mi-app-list [data-mi-install]:disabled');
  return {
    installed: !!btn,
    label: btn?.textContent,
  };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="mintinstall"]');
  const box = win ? win.getBoundingClientRect() : null;
  return {
    win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
  };
});

await browser.close();

const ok = opened.winVisible && opened.appReady
  && opened.title === 'Logithèque'
  && opened.homeVisible && opened.featuredCount >= 4
  && search.searchVisible && search.rows >= 1
  && category.listVisible && category.rows >= 1
  && category.listTitle === 'Internet'
  && install.installed && install.label === 'Installé'
  && dims.win && dims.win.w >= 844 && dims.win.w <= 860
  && dims.win.h >= 776 && dims.win.h <= 792;

process.stdout.write(`${JSON.stringify({ opened, search, category, install, dims, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
