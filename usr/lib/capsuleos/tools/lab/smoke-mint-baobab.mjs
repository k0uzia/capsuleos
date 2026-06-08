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
await page.fill('#menu-search', 'Analyseur');
await page.waitForTimeout(80);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(120);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="baobab"]');
  const app = document.getElementById('gnomeBaobabApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.baobabInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    appTitle: app?.querySelector('.gnome-baobab__title')?.textContent,
    places: app?.querySelectorAll('.gnome-baobab__place').length || 0,
    ring: app?.querySelector('.gnome-baobab__ring-center')?.textContent,
  };
});

await page.click('.gnome-baobab__place:not(.gnome-baobab__place--active)');
await page.waitForTimeout(40);

const select = await page.evaluate(() => ({
  active: document.querySelector('.gnome-baobab__place--active')?.querySelector('.gnome-baobab__place-label')?.textContent,
}));

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="baobab"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

await browser.close();

const ok = opened.winVisible && opened.appReady
  && opened.title === 'Analyseur d\'espace disque'
  && opened.appTitle === 'Analyseur d\'espace disque'
  && opened.places >= 2
  && /%/.test(opened.ring || '')
  && select.active === 'Dossier personnel'
  && dims.win && dims.win.w >= 784 && dims.win.w <= 816
  && dims.win.h >= 564 && dims.win.h <= 596;

process.stdout.write(`${JSON.stringify({ opened, select, dims, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
