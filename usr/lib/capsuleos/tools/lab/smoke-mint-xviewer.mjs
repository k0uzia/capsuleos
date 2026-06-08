#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const SAMPLE_IMG = './assets/images/vendors/mint/wallpaper/default_background.jpg';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openFileInViewer === 'function', null, { timeout: 60000 });

await page.evaluate((href) => {
  window.openFileInViewer(href, 'jpg', 'default_background.jpg');
}, SAMPLE_IMG);
await page.waitForTimeout(350);

const shell = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="visionneur_images"]');
  const app = document.getElementById('visionneurImages');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.xviewerInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    navCount: app?.querySelectorAll('.xviewer-app__menu').length || 0,
    tools: app?.querySelectorAll('[data-xv-action]').length || 0,
  };
});

const loaded = await page.evaluate(() => {
  const img = document.querySelector('#mint-image-viewer-content .viewer-app__image');
  return {
    hasImage: !!img,
    filename: document.getElementById('mint-image-viewer-filename')?.textContent,
    zoom: document.getElementById('xviewer-zoom')?.textContent,
  };
});

await page.evaluate(() => {
  document.querySelector('[data-xv-action="zoom-in"]').click();
});
await page.waitForTimeout(50);

const zoomed = await page.evaluate(() => ({
  zoom: document.getElementById('xviewer-zoom')?.textContent,
}));

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="visionneur_images"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

await browser.close();

const ok = shell.appReady && shell.navCount === 4 && shell.tools >= 5
  && loaded.hasImage && loaded.filename === 'default_background.jpg'
  && zoomed.zoom === '125 %';

console.log(JSON.stringify({ shell, loaded, zoomed, dims, ok }, null, 2));
process.exit(ok ? 0 : 1);
