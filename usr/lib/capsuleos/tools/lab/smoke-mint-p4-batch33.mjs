#!/usr/bin/env node
/**
 * Smoke batch P4 #33 — baobab, Pix, moniteur système (catalogue Mint résiduel).
 */
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const APPS = [
  {
    search: 'Analyseur',
    slot: 'baobab',
    ready: (d) => d.baobabInit === 'true',
    title: 'Analyseur d\'espace disque',
  },
  {
    search: 'Pix',
    slot: 'visionneur_images',
    ready: (d) => d.visionneurImagesInit === 'true',
    title: 'Visionneur d\'images',
    exactName: true,
  },
  {
    search: 'Moniteur système',
    slot: 'system_monitor',
    ready: (d) => d.systemMonitorInit === 'true',
    title: 'Moniteur système',
    exactName: true,
  },
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
  const clicked = await page.evaluate(({ exactName, searchText }) => {
    const items = document.querySelectorAll('#menu-app-list .menu-app-item:not(.is-unavailable)');
    var i;
    for (i = 0; i < items.length; i += 1) {
      var label = items[i].querySelector('.menu-app-item__name');
      var name = label ? label.textContent.trim() : '';
      if (exactName && name !== searchText) {
        continue;
      }
      items[i].click();
      return true;
    }
    return false;
  }, { exactName: !!app.exactName, searchText: app.search });
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
