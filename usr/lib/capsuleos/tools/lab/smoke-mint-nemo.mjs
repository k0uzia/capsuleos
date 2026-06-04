#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('footer nav a[data-link="nemo"]');
await page.waitForSelector('div[data-link="nemo"]', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(1000);

const home = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const title = win && win.querySelector('#windowTitle') ? win.querySelector('#windowTitle').textContent : '';
  const path = typeof window.getExplorerCurrentPath === 'function' ? window.getExplorerCurrentPath('nemo') : '';
  const sidebarReady = win && win.dataset.nemoInit === 'true';
  return { title, path, sidebarReady };
});

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(600);

const docs = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const title = win && win.querySelector('#windowTitle') ? win.querySelector('#windowTitle').textContent : '';
  const path = typeof window.getExplorerCurrentPath === 'function' ? window.getExplorerCurrentPath('nemo') : '';
  const pathLabel = win && win.querySelector('.nemo-app__path-current')
    ? win.querySelector('.nemo-app__path-current').textContent
    : '';
  const activeLink = win && win.querySelector('#voletnemo a[data-link="Documents"].nemo-sidebar__link--active');
  return { title, path, pathLabel, sidebarActive: !!activeLink };
});

const ok = home.sidebarReady
  && home.title && home.title.indexOf('Nemo') >= 0
  && docs.path && docs.path.indexOf('Documents') >= 0
  && docs.title && docs.title.indexOf('Documents') >= 0
  && docs.title.indexOf('Nemo') >= 0
  && (docs.sidebarActive || (docs.pathLabel && docs.pathLabel.indexOf('Documents') >= 0));

console.log(JSON.stringify({ home, docs, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
