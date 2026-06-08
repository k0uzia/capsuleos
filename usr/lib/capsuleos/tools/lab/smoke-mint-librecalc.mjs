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
await page.fill('#menu-search', 'LibreOffice Calc');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(600);

const state = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="librecalc"]');
  const app = document.getElementById('lc-app');
  const menubar = app?.querySelector('.lc-menubar');
  const gridCells = app?.querySelectorAll('.lc-grid__cell');
  const formula = document.getElementById('lc-formula-input');
  const cellRef = document.getElementById('lc-cell-ref');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.lcInit === '1',
    title: win?.querySelector('#windowTitle')?.textContent,
    menuCount: menubar ? menubar.querySelectorAll('.lw-menu__trigger').length : 0,
    gridCellCount: gridCells ? gridCells.length : 0,
    selectedCell: app?.querySelector('.lc-grid__cell.is-selected') !== null,
    formulaValue: formula ? formula.value : '',
    cellRef: cellRef ? cellRef.textContent : '',
    sheetTab: app?.querySelector('.lc-sheets__tab.is-active')?.textContent,
  };
});

await browser.close();

const ok = state.winVisible
  && state.appReady
  && state.title === 'Sans nom 1 - LibreOffice Calc'
  && state.menuCount >= 9
  && state.gridCellCount >= 200
  && state.selectedCell
  && state.formulaValue === '='
  && state.cellRef === 'A1'
  && state.sheetTab === 'Feuille1';

process.stdout.write(`${JSON.stringify({ state, ok }, null, 2)}\n`);
process.exit(ok ? 0 : 1);
