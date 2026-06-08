#!/usr/bin/env node
/**
 * Smoke Mint — icônes chargées (menu, logithèque, paramètres).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-mint-icon-load.mjs
 */
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath, MINT_URL } from './mint-smoke-open.mjs';

const countLoadedIcons = (selectors) => {
  const imgs = Array.from(document.querySelectorAll(selectors));
  const broken = [];
  let loaded = 0;
  for (let i = 0; i < imgs.length; i += 1) {
    const img = imgs[i];
    const src = img.currentSrc || img.src || '';
    if (!src || src.indexOf('data:') === 0) {
      continue;
    }
    if (img.complete && img.naturalWidth > 0) {
      loaded += 1;
    } else {
      broken.push(src);
    }
  }
  return { total: imgs.length, loaded, brokenCount: broken.length, broken: broken.slice(0, 5) };
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);

await page.click('a[target="windowElement"][data-link="mainMenu"]');
await page.waitForTimeout(250);
await page.waitForFunction(
  (sel) => {
    const imgs = Array.from(document.querySelectorAll(sel));
    return imgs.length >= 10
      && imgs.every((img) => img.complete && img.naturalWidth > 0);
  },
  '#menu-app-list .menu-app-item__icon',
  { timeout: 15000 },
);
const menu = await page.evaluate(countLoadedIcons, '#menu-app-list .menu-app-item__icon');

await page.click('a[target="windowElement"][data-link="mainMenu"]');
await page.waitForTimeout(120);
await openMintSlot(page, 'mintinstall');
await page.waitForTimeout(250);
await page.click('[data-mi-cat="internet"]');
await page.waitForTimeout(200);
await page.waitForFunction(
  (sel) => {
    const imgs = Array.from(document.querySelectorAll(sel));
    return imgs.length >= 3
      && imgs.every((img) => img.complete && img.naturalWidth > 0);
  },
  '#mi-app-list .mi-app__list-icon, .mi-app__featured img',
  { timeout: 15000 },
);
const mintinstall = await page.evaluate(
  countLoadedIcons,
  '#mi-app-list .mi-app__list-icon, .mi-app__featured img'
);

await openMintSlot(page, 'themes');
await page.waitForTimeout(250);
await page.waitForFunction(
  (sel) => {
    const imgs = Array.from(document.querySelectorAll(sel));
    return imgs.length >= 20
      && imgs.every((img) => img.complete && img.naturalWidth > 0);
  },
  '#cinnamonSettingsApp .cs-app__nav-icon',
  { timeout: 15000 },
);
const settings = await page.evaluate(countLoadedIcons, '#cinnamonSettingsApp .cs-app__nav-icon');

await browser.close();

const ok = menu.total >= 10 && menu.brokenCount === 0
  && mintinstall.total >= 3 && mintinstall.brokenCount === 0
  && settings.total >= 20 && settings.brokenCount === 0;

console.log(JSON.stringify({
  url: MINT_URL,
  menu,
  mintinstall,
  settings,
  ok,
}, null, 2));
process.exit(ok ? 0 : 1);
