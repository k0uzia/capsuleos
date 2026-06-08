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
await page.fill('#menu-search', 'Celluloid');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(600);

const state = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="lecteur_multimedia"]');
  const app = document.getElementById('lecteurMultimedia');
  const menubar = app?.querySelector('.celluloid-app__menubar');
  const viewport = document.getElementById('mint-media-viewer-content');
  const controls = app?.querySelector('.celluloid-app__controls');
  const menubarStyle = menubar ? window.getComputedStyle(menubar) : null;
  const viewportStyle = viewport ? window.getComputedStyle(viewport) : null;
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.celluloidInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    menuCount: menubar ? menubar.querySelectorAll('.celluloid-app__menu-btn').length : 0,
    viewportBg: viewportStyle ? viewportStyle.backgroundColor : '',
    controlsVisible: !!(controls && controls.offsetParent !== null),
    playDisabled: app?.querySelector('.celluloid-app__ctl--play')?.disabled,
    chromeToolkit: win?.getAttribute('data-window-chrome-toolkit'),
    menubarDisplay: menubarStyle ? menubarStyle.display : '',
  };
});

await browser.close();

const ok = state.winVisible
  && state.appReady
  && state.title === 'Celluloid'
  && state.menuCount >= 6
  && state.controlsVisible
  && state.playDisabled === true
  && /rgb\(0,\s*0,\s*0\)|#000/.test(state.viewportBg);

process.stdout.write(`${JSON.stringify({ state, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
