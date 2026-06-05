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
await page.fill('#menu-search', 'Dessin');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(800);

const before = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="drawing"]');
  const app = document.getElementById('drawingApp');
  const canvas = document.getElementById('drawing-canvas');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.drawingInit === 'true',
    title: document.querySelector('div[data-link="drawing"] #windowTitle')?.textContent,
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
  };
});

const box = await page.locator('#drawing-canvas').boundingBox();
if (box) {
  await page.mouse.move(box.x + 80, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 140, { steps: 6 });
  await page.mouse.up();
}
await page.waitForTimeout(300);

const after = await page.evaluate(() => {
  const canvas = document.getElementById('drawing-canvas');
  if (!canvas) return { hasInk: false };
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  var i;
  var nonWhite = 0;
  for (i = 0; i < data.length; i += 4) {
    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
      nonWhite++;
      if (nonWhite > 20) break;
    }
  }
  return { hasInk: nonWhite > 20 };
});

const ok = before.winVisible && before.appReady && before.title === 'Sans titre — Dessin'
  && before.canvasSize && before.canvasSize.w > 0 && after.hasInk;

console.log(JSON.stringify({ before, after, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
