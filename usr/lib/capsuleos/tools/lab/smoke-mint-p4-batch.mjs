#!/usr/bin/env node
/**
 * Smoke batch P4 — 10 apps catalogue Mint (webapp_manager … mintwelcome).
 */
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const APPS = [
  { search: 'Applications Web', slot: 'webapp_manager', ready: (d) => d.webappManagerInit === 'true', title: 'Applications Web' },
  { search: 'Notes', slot: 'sticky', ready: (d) => d.stickyInit === 'true', title: 'Notes' },
  { search: 'Warpinator', slot: 'warpinator', ready: (d) => d.warpinatorInit === 'true', title: 'Warpinator' },
  { search: 'Hypnotix', slot: 'hypnotix', ready: (d) => d.hypnotixInit === 'true', title: 'Hypnotix' },
  { search: 'Transmission', slot: 'transmission', ready: (d) => d.transmissionInit === 'true', title: 'Transmission' },
  { search: 'sauvegarde', slot: 'mintbackup', ready: (d) => d.mintbackupInit === 'true', title: 'Outil de sauvegarde' },
  { search: 'Renommer', slot: 'bulky', ready: (d) => d.bulkyInit === 'true', title: 'Renommer fichiers' },
  { search: 'Timeshift', slot: 'timeshift', ready: (d) => d.timeshiftInit === 'true', title: 'Timeshift' },
  { search: 'Thunderbird', slot: 'thunderbird', ready: (d) => d.thunderbirdInit === 'true', title: 'Thunderbird' },
  { search: 'accueil Mint', slot: 'mintwelcome', ready: (d) => d.mintwelcomeInit === 'true', title: 'Écran d\'accueil Mint' },
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
