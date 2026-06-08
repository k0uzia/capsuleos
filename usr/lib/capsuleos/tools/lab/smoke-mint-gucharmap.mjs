#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'gucharmap');
await page.waitForTimeout(200);

const ready = await page.evaluate(() => ({
  init: document.getElementById('gucharmapApp')?.dataset.gucharmapInit === 'true',
  title: document.querySelector('div[data-link="gucharmap"] #windowTitle')?.textContent,
  cells: document.querySelectorAll('#gcm-grid .gcm-app__cell').length,
}));

await page.click('#gcm-grid .gcm-app__cell:nth-child(5)');
await page.waitForTimeout(40);
const cell = await page.evaluate(() => ({
  preview: document.getElementById('gcm-preview')?.textContent,
}));

const ok = ready.init && ready.title === 'Table des caractères'
  && ready.cells >= 20 && cell.preview.indexOf('sélectionné') >= 0;

console.log(JSON.stringify({ ready, cell, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
