#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const SAMPLE_PDF = '../../../../home/public/Documents/Bash.pdf';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openFileInViewer === 'function', null, { timeout: 60000 });

await page.evaluate((href) => {
  window.openFileInViewer(href, 'pdf', 'Bash.pdf');
}, SAMPLE_PDF);
await page.waitForTimeout(350);

const shell = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="visionneur_pdf"]');
  const app = document.getElementById('visionneurPdf');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.xreaderInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    menus: app?.querySelectorAll('.xreader-app__menu').length || 0,
  };
});

const loaded = await page.evaluate(() => {
  const frame = document.querySelector('#mint-pdf-viewer-content .viewer-app__frame');
  return {
    hasFrame: !!frame,
    filename: document.getElementById('mint-pdf-viewer-filename')?.textContent,
    page: document.getElementById('xreader-page')?.textContent,
    zoom: document.getElementById('xreader-zoom')?.textContent,
  };
});

await page.evaluate(() => {
  document.querySelector('[data-xr-action="sidebar"]').click();
});
await page.waitForTimeout(50);

const sidebar = await page.evaluate(() => ({
  visible: !document.getElementById('xreader-sidebar')?.hidden,
  thumb: !!document.querySelector('.xreader-app__thumb'),
}));

await browser.close();

const ok = shell.appReady && loaded.hasFrame && loaded.filename === 'Bash.pdf'
  && loaded.page === 'Page 1 sur 1' && sidebar.visible && sidebar.thumb;

console.log(JSON.stringify({ shell, loaded, sidebar, ok }, null, 2));
process.exit(ok ? 0 : 1);
