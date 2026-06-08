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
await page.fill('#menu-search', 'Moniteur système');
await page.waitForTimeout(80);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(120);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="system_monitor"]');
  const app = document.getElementById('systemMonitorApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.systemMonitorInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    rows: app?.querySelectorAll('#gsm-process-body tr').length || 0,
    tab: app?.querySelector('[data-gsm-tab].is-active')?.textContent,
  };
});

await page.click('#gsm-process-body tr');
await page.waitForTimeout(40);

const select = await page.evaluate(() => ({
  selected: !!document.querySelector('#gsm-process-body tr.is-selected'),
  stopEnabled: !document.querySelector('[data-gsm-action="stop"]')?.disabled,
}));

await page.click('[data-gsm-tab="resources"]');
await page.waitForTimeout(50);

const resources = await page.evaluate(() => {
  const panel = document.querySelector('[data-gsm-panel="resources"]');
  return {
    visible: panel && !panel.hidden,
    title: panel?.querySelector('.gsm-app__chart-title')?.textContent,
  };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="system_monitor"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

await browser.close();

const ok = opened.winVisible && opened.appReady
  && opened.title === 'Moniteur système'
  && opened.rows >= 4
  && opened.tab === 'Processus'
  && resources.visible
  && /Processeurs/i.test(resources.title || '')
  && select.selected && select.stopEnabled
  && dims.win && dims.win.w >= 814 && dims.win.w <= 830
  && dims.win.h >= 614 && dims.win.h <= 630;

process.stdout.write(`${JSON.stringify({ opened, resources, select, dims, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
