#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'simple_scan');
await page.waitForTimeout(160);

const before = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="simple_scan"]');
  const app = document.getElementById('simpleScanApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.simpleScanInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    preview: document.getElementById('scn-preview')?.textContent,
    saveDisabled: document.querySelector('[data-scn-action="save"]')?.disabled,
  };
});

await page.click('[data-scn-action="scan"]');
await page.waitForTimeout(80);

const after = await page.evaluate(() => ({
  preview: document.getElementById('scn-preview')?.textContent,
  saveDisabled: document.querySelector('[data-scn-action="save"]')?.disabled,
}));

const ok = before.winVisible && before.appReady
  && before.title === 'Numérisation de documents'
  && before.preview.indexOf('Aucun document') >= 0
  && before.saveDisabled
  && after.preview.indexOf('numérisation simulée') >= 0
  && !after.saveDisabled;

console.log(JSON.stringify({ before, after, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
