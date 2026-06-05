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
await page.fill('#menu-search', 'Gestionnaire d\'archives');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(800);

const empty = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  const app = document.getElementById('fileRollerApp');
  const wmHeader = win?.querySelector('#windowHeader');
  const wmStyle = wmHeader && window.getComputedStyle(wmHeader);
  const controls = win?.querySelector('.fr-app__window-controls');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.fileRollerInit === 'true',
    csd: win?.classList.contains('file-roller--csd'),
    headerHidden: !wmHeader || wmStyle?.display === 'none',
    controlsInHeader: !!(controls && controls.querySelector('#closeBtn')),
    headerTitle: document.getElementById('fr-app-title')?.textContent,
    emptyVisible: !document.getElementById('fr-empty')?.hidden,
    navHidden: document.getElementById('fr-nav-row')?.hidden,
    extractDisabled: document.querySelector('[data-fr-action="extract"]')?.disabled,
  };
});

await page.click('[data-fr-action="menu"]');
await page.waitForTimeout(200);
await page.click('[data-fr-menu="open-demo"]');
await page.waitForTimeout(500);

const open = await page.evaluate(() => {
  const rows = document.querySelectorAll('#fr-list-body tr');
  return {
    headerTitle: document.getElementById('fr-app-title')?.textContent,
    navVisible: !document.getElementById('fr-nav-row')?.hidden,
    rowCount: rows.length,
    firstName: rows[0]?.querySelector('.fr-app__file-cell span:last-child')?.textContent,
    firstSize: rows[0]?.cells?.[1]?.textContent,
    path: document.getElementById('fr-path-text')?.textContent,
  };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  const headerbar = document.querySelector('.fr-app__headerbar');
  const nav = document.getElementById('fr-nav-row');
  const colName = document.querySelector('.fr-app__col--name');
  const box = win ? win.getBoundingClientRect() : null;
  const hb = headerbar ? headerbar.getBoundingClientRect() : null;
  const navBox = nav && !nav.hidden ? nav.getBoundingClientRect() : null;
  const colBox = colName ? colName.getBoundingClientRect() : null;
  const tableWrap = document.getElementById('fr-list-wrap');
  const tableBox = tableWrap && !tableWrap.hidden ? tableWrap.getBoundingClientRect() : null;
  return {
    win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
    headerbar: hb ? { h: Math.round(hb.height) } : null,
    nav: navBox ? { h: Math.round(navBox.height) } : null,
    colNamePct: tableBox && colBox ? Math.round((colBox.width / tableBox.width) * 100) : null,
  };
});

const dragBefore = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  const handle = window.CapsuleWindowDragTargets?.resolveDragHandle(win, { requireHeader: true });
  return {
    handleOk: !!(handle && handle.classList.contains('fr-app__headerbar')),
    left: win ? win.getBoundingClientRect().left : null,
  };
});

const titleBox = await page.locator('#fr-app-title').boundingBox();
if (titleBox) {
  await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(titleBox.x + titleBox.width / 2 + 70, titleBox.y + titleBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

const dragAfter = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  return win ? win.getBoundingClientRect().left : null;
});

const drag = {
  handleOk: dragBefore.handleOk,
  moved: dragBefore.left !== null && dragAfter !== null && Math.abs(dragAfter - dragBefore.left) > 15,
  before: dragBefore.left,
  after: dragAfter,
};

const ok = empty.winVisible && empty.appReady && empty.csd && empty.headerHidden
  && empty.controlsInHeader && empty.headerTitle === 'Gestionnaire d\'archives'
  && empty.emptyVisible && empty.navHidden && empty.extractDisabled
  && open.headerTitle === 'demo.zip'
  && open.navVisible && open.rowCount === 1 && open.firstName === 'demo.txt'
  && open.firstSize === '11 octets' && open.path === '/'
  && dims.win && dims.win.w >= 644 && dims.win.w <= 660
  && dims.win.h >= 571 && dims.win.h <= 587
  && dims.headerbar && dims.headerbar.h >= 42 && dims.headerbar.h <= 50
  && dims.nav && dims.nav.h >= 40 && dims.nav.h <= 48
  && dims.colNamePct !== null && dims.colNamePct >= 40 && dims.colNamePct <= 44
  && drag.handleOk && drag.moved;

console.log(JSON.stringify({ empty, open, drag, dims, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
