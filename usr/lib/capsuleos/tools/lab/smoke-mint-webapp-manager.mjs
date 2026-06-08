#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('footer nav a[data-link="mainMenu"]');
await page.waitForTimeout(40);
await page.fill('#menu-search', 'Applications Web');
await page.waitForTimeout(80);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(120);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="webapp_manager"]');
  const app = document.getElementById('webappManagerApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.webappManagerInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    listItems: app?.querySelectorAll('.wam-app__item').length || 0,
    detailTitle: app?.querySelector('.wam-app__detail-title')?.textContent,
  };
});

await page.click('[data-wam-action="launch"]');
await page.waitForTimeout(40);

const launch = await page.evaluate(() => ({
  status: document.getElementById('wam-status')?.textContent,
}));

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="webapp_manager"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

await browser.close();

const ok = opened.winVisible && opened.appReady
  && opened.title === 'Applications Web'
  && opened.listItems >= 1
  && opened.detailTitle === 'Matrix'
  && /Matrix/i.test(launch.status || '')
  && dims.win && dims.win.w >= 844 && dims.win.w <= 876
  && dims.win.h >= 564 && dims.win.h <= 596;

process.stdout.write(`${JSON.stringify({ opened, launch, dims, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
