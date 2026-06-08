#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'bulky');
await page.waitForTimeout(200);

const ready = await page.evaluate(() => ({
  init: document.getElementById('bulkyApp')?.dataset.bulkyInit === 'true',
  title: document.querySelector('div[data-link="bulky"] #windowTitle')?.textContent,
  preview: document.querySelector('#blk-body .blk-app__preview')?.textContent,
}));

await page.fill('#blk-prefix', 'VAC_');
await page.waitForTimeout(40);
const prefix = await page.evaluate(() => (
  document.querySelector('#blk-body .blk-app__preview')?.textContent
));

await page.click('[data-blk-action="rename"]');
await page.waitForTimeout(50);
const renamed = await page.evaluate(() => ({
  first: document.querySelector('#blk-body tr td:first-child')?.textContent,
  btn: document.querySelector('[data-blk-action="rename"]')?.textContent,
}));

const ok = ready.init && ready.title === 'Renommer fichiers'
  && ready.preview === 'IMG_001.jpg'
  && prefix === 'VAC_001.jpg'
  && renamed.first === 'VAC_001.jpg' && renamed.btn === 'Renommé';

console.log(JSON.stringify({ ready, prefix, renamed, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
