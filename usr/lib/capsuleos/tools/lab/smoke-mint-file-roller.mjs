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
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.fileRollerInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
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
  const win = document.querySelector('div[data-link="file_roller"]');
  const rows = document.querySelectorAll('#fr-list-body tr');
  return {
    title: win?.querySelector('#windowTitle')?.textContent,
    headerTitle: document.getElementById('fr-app-title')?.textContent,
    navVisible: !document.getElementById('fr-nav-row')?.hidden,
    rowCount: rows.length,
    firstName: rows[0]?.querySelector('.fr-app__file-cell span:last-child')?.textContent,
    firstSize: rows[0]?.cells?.[1]?.textContent,
    path: document.getElementById('fr-path-text')?.textContent,
  };
});

const ok = empty.winVisible && empty.appReady && empty.title === 'Gestionnaire d\'archives'
  && empty.emptyVisible && empty.navHidden && empty.extractDisabled
  && open.title === 'demo.zip' && open.headerTitle === 'demo.zip'
  && open.navVisible && open.rowCount === 1 && open.firstName === 'demo.txt'
  && open.firstSize === '11 octets' && open.path === '/';

console.log(JSON.stringify({ empty, open, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
