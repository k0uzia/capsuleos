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
await page.waitForTimeout(500);
await page.fill('#menu-search', 'Capture');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(700);

const before = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="screenshot"]');
  const app = document.getElementById('gnomeScreenshotApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.shotInit === 'true',
    title: document.querySelector('div[data-link="screenshot"] #windowTitle')?.textContent,
    hasCaptureBtn: !!document.getElementById('gnome-shot-capture'),
  };
});

await page.click('#gnome-shot-capture');
await page.waitForTimeout(900);

const after = await page.evaluate(() => {
  const result = document.getElementById('gnome-shot-result');
  const preview = document.getElementById('gnome-shot-preview');
  return {
    resultVisible: result && !result.hasAttribute('hidden'),
    previewHasSrc: preview && preview.src && preview.src.indexOf('data:image') === 0,
  };
});

const ok = before.winVisible && before.appReady && before.title === 'Capture d\'écran'
  && before.hasCaptureBtn && after.resultVisible && after.previewHasSrc;

console.log(JSON.stringify({ before, after, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
