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
await page.fill('#menu-search', 'LibreOffice Writer');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(600);

const state = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="librewriter"]');
  const app = document.getElementById('lw-app');
  const menubar = app?.querySelector('.lw-menubar');
  const pageEl = document.getElementById('lw-page');
  const wordCount = document.getElementById('lw-word-count');
  const zoomSlider = document.getElementById('lw-zoom');
  const zoomValue = document.getElementById('lw-zoom-value');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.lwInit === '1',
    title: win?.querySelector('#windowTitle')?.textContent,
    menuCount: menubar ? menubar.querySelectorAll('.lw-menu__trigger').length : 0,
    pageReady: !!pageEl && pageEl.getAttribute('contenteditable') === 'true',
    wordCountText: wordCount ? wordCount.textContent : '',
    zoomDefault: zoomSlider ? zoomSlider.value : '',
    zoomLabel: zoomValue ? zoomValue.textContent : '',
    chromeToolkit: win?.getAttribute('data-window-chrome-toolkit'),
  };
});

await browser.close();

const ok = state.winVisible
  && state.appReady
  && state.title === 'Sans nom 1 - LibreOffice Writer'
  && state.menuCount >= 11
  && state.pageReady
  && /mot/.test(state.wordCountText)
  && (state.zoomDefault === '100' || state.zoomLabel === '100 %');

process.stdout.write(`${JSON.stringify({ state, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
