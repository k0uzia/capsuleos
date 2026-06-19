#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('.desktop-shortcut[data-link="calculator"]');
await page.waitForTimeout(180);

const state = await page.evaluate(() => {
  const root = document.getElementById('gnomeCalculatorApp');
  const win = document.querySelector('div[data-link="calculator"]');
  const value = document.getElementById('gnome-calc-value');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: root && root.dataset.calcInit === 'true',
    title: document.querySelector('div[data-link="calculator"] #windowTitle')?.textContent,
    initial: value ? value.textContent : null,
  };
});

await page.click('[data-calc="digit"][data-digit="2"]');
await page.click('[data-calc="op"][data-op="+"]');
await page.click('[data-calc="digit"][data-digit="3"]');
await page.click('[data-calc="equals"]');
await page.waitForTimeout(70);

const after = await page.evaluate(() => {
  return document.getElementById('gnome-calc-value')?.textContent;
});

await page.click('#gnome-calc-mode');
await page.waitForTimeout(50);
const modePopover = await page.evaluate(() => {
  const pop = document.getElementById('gnome-calc-mode-popover');
  return { open: pop && !pop.hidden, options: pop ? pop.querySelectorAll('[data-calc-mode]').length : 0 };
});
await page.click('[data-calc-mode="advanced"]');
await page.waitForTimeout(40);
const advanced = await page.evaluate(() => ({
  classOn: document.getElementById('gnomeCalculatorApp')?.classList.contains('gnome-calc--advanced'),
  label: document.getElementById('gnome-calc-mode')?.textContent?.replace(/\s+/g, ' ').trim(),
}));

await page.click('[data-calc="clear"]');
await page.click('[data-calc="digit"][data-digit="9"]');
await page.click('[data-calc="backspace"]');
await page.waitForTimeout(40);
const backspace = await page.evaluate(() => document.getElementById('gnome-calc-value')?.textContent);

const modeLabel = await page.evaluate(() => document.getElementById('gnome-calc-mode-label')?.textContent);

const ok = state.winVisible && state.appReady && state.title === 'Calculatrice' && after === '5'
  && modePopover.open && modePopover.options >= 3
  && advanced.classOn && modeLabel === 'Avancé'
  && backspace === '0';
console.log(JSON.stringify({ state, after, modePopover, advanced, backspace, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
