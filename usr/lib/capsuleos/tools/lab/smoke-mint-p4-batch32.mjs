#!/usr/bin/env node
/**
 * Smoke batch P4 #32+ — 8 apps catalogue Mint (gucharmap … libreoffice_impress).
 */
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const APPS = [
  { search: 'Table des caractères', slot: 'gucharmap', ready: (d) => d.gucharmapInit === 'true', title: 'Table des caractères' },
  { search: 'Numérisation', slot: 'simple_scan', ready: (d) => d.simpleScanInit === 'true', title: 'Numérisation de documents' },
  { search: 'Bibliothèque', slot: 'thingy', ready: (d) => d.thingyInit === 'true', title: 'Bibliothèque' },
  { search: 'Rhythmbox', slot: 'rhythmbox', ready: (d) => d.rhythmboxInit === 'true', title: 'Rhythmbox' },
  { search: 'Disques', slot: 'gnome_disks', ready: (d) => d.gnomeDisksInit === 'true', title: 'Disques' },
  { search: 'LibreOffice Draw', slot: 'libreoffice_draw', ready: (d) => d.libreofficeDrawInit === 'true', title: 'Sans nom 1 — LibreOffice Draw' },
  { search: 'LibreOffice Impress', slot: 'libreoffice_impress', ready: (d) => d.libreofficeImpressInit === 'true', title: 'Sans nom 1 — LibreOffice Impress' },
  { search: 'LibreOffice', slot: 'libreoffice_startcenter', ready: (d) => d.libreofficeStartcenterInit === 'true', title: 'LibreOffice' },
];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

const results = [];

for (const app of APPS) {
  await page.evaluate((slot) => {
    const win = document.querySelector(`div[data-link="${slot}"]`);
    if (win) win.style.display = 'none';
    const menu = document.getElementById('mainMenu');
    if (menu) menu.style.display = 'none';
  }, app.slot);

  await page.click('footer nav a[data-link="mainMenu"]');
  await page.waitForTimeout(50);
  await page.fill('#menu-search', app.search);
  await page.waitForTimeout(90);
  const clicked = await page.evaluate(() => {
    const item = document.querySelector('#menu-app-list .menu-app-item:not(.is-unavailable)');
    if (!item) return false;
    item.click();
    return true;
  });
  await page.waitForTimeout(140);

  const state = await page.evaluate(({ slot, title, wasClicked }) => {
    const win = document.querySelector(`div[data-link="${slot}"]`);
    const appEl = win && win.querySelector('main');
    const ds = appEl ? appEl.dataset : {};
    return {
      clicked: wasClicked,
      winVisible: win && win.style.display !== 'none',
      dataset: ds,
      wmTitle: win?.querySelector('#windowTitle')?.textContent,
      expectedTitle: title,
    };
  }, { slot: app.slot, title: app.title, wasClicked: clicked });

  const ok = clicked && state.winVisible && state.wmTitle === app.title
    && app.ready(state.dataset);
  results.push({ app: app.slot, ok, state });
}

await browser.close();

const allOk = results.every((r) => r.ok);
process.stdout.write(`${JSON.stringify({ results, allOk }, null, 2)}\n`);
process.exit(allOk ? 0 : 1);
