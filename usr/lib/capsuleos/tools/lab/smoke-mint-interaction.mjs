#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, openMintMainMenu } from './mint-smoke-open.mjs';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await openMintSlot(page, 'nemo');

const before = await page.evaluate(() => {
  const n = document.querySelector('div[data-link="nemo"]');
  return { left: n.style.left, top: n.style.top, dragInit: n.dataset.dragInit, desktopTag: document.querySelector('#desktop').tagName };
});

const header = await page.locator('div[data-link="nemo"] #windowHeader');
const box = await header.boundingBox();
await page.mouse.move(box.x + 40, box.y + 10);
await page.mouse.down();
await page.mouse.move(box.x + 140, box.y + 60, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(40);

const after = await page.evaluate(() => {
  const n = document.querySelector('div[data-link="nemo"]');
  return { left: n.style.left, top: n.style.top };
});

await openMintMainMenu(page);

const menu = await page.evaluate(() => {
  const m = document.getElementById('mainMenu');
  const r = m.getBoundingClientRect();
  const footer = document.querySelector('footer').getBoundingClientRect();
  return {
    display: getComputedStyle(m).display,
    bottom: Math.round(r.bottom),
    footerTop: Math.round(footer.top),
    hasMenuRoot: !!m.querySelector('.menu-root'),
    width: Math.round(r.width),
  };
});

const moved = before.left !== after.left || before.top !== after.top;
const menuOk = menu.hasMenuRoot && menu.display !== 'none' && menu.bottom <= menu.footerTop + 4;

console.log(JSON.stringify({ before, after, moved, menu, menuOk }, null, 2));
await browser.close();
process.exit(moved && menuOk ? 0 : 1);
