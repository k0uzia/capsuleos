#!/usr/bin/env node
import { chromium } from 'playwright';
import {
  chromePath,
  MINT_VIEWPORT,
  openMintSlot,
  openMintMainMenu,
  waitMintReady,
} from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

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
await page.waitForSelector('#mainMenu .menu-root', { timeout: 10000 });
await page.waitForTimeout(300);

const menu = await page.evaluate(() => {
  const m = document.getElementById('mainMenu');
  const r = m.getBoundingClientRect();
  const footer = document.getElementById('tableau').getBoundingClientRect();
  return {
    display: getComputedStyle(m).display,
    bottom: Math.round(r.bottom),
    footerTop: Math.round(footer.top),
    bottomGapPx: Math.round(footer.top - r.bottom),
    hasMenuRoot: !!m.querySelector('.menu-root'),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
});

const moved = before.left !== after.left || before.top !== after.top;
const menuOk = menu.hasMenuRoot
  && menu.display !== 'none'
  && menu.bottomGapPx >= 0
  && menu.bottomGapPx <= 4
  && menu.width >= 598
  && menu.height >= 478;

console.log(JSON.stringify({ before, after, moved, menu, menuOk }, null, 2));
await browser.close();
process.exit(moved && menuOk ? 0 : 1);
