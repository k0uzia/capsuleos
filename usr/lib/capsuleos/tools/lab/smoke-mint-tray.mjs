#!/usr/bin/env node
/**
 * Smoke — zone de notification Mint : chaque applet ouvre un popover ou une action.
 */
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const TRAY_CASES = [
  { btn: '#tray-btn-xapp', popover: '#mint-tray-popover-xapp' },
  { btn: '#tray-btn-notifications', popover: '#mint-tray-popover-notifications' },
  { btn: '#tray-btn-printers', popover: '#mint-tray-popover-printers' },
  { btn: '#tray-btn-removable', popover: '#mint-tray-popover-removable' },
  { btn: '#tray-btn-keyboard', popover: '#mint-tray-popover-keyboard' },
  { btn: '#tray-btn-network', popover: '#mint-tray-popover-network' },
  { btn: '#tray-sound-btn', popover: '#volume-popover' },
  { btn: '.taskbar-tray__btn--power', popover: '#mint-power-menu' },
  { btn: '[data-update-manager-tray]', action: 'open-update-manager' },
];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.CapsuleMintTray === 'object', null, { timeout: 60000 });

const results = [];

for (const row of TRAY_CASES) {
  const visible = await page.evaluate((btnSel) => {
    const el = document.querySelector(btnSel);
    if (!el) return false;
    if (el.hidden) return false;
    return getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  }, row.btn);
  if (!visible) {
    results.push({ btn: row.btn, skipped: true, ok: true });
    continue;
  }
  if (row.action === 'open-update-manager') {
    await page.click(row.btn);
    await page.waitForTimeout(120);
    const opened = await page.evaluate(() => {
      const win = document.querySelector('div[data-link="update_manager"]');
      return win && win.style.display !== 'none';
    });
    results.push({ btn: row.btn, action: row.action, ok: opened });
    continue;
  }
  await page.click(row.btn);
  await page.waitForTimeout(70);
  const state = await page.evaluate(({ btnSel, popSel }) => {
    const btn = document.querySelector(btnSel);
    const pop = document.querySelector(popSel);
    return {
      expanded: btn ? btn.getAttribute('aria-expanded') : null,
      popHidden: pop ? pop.hasAttribute('hidden') : true,
    };
  }, { btnSel: row.btn, popSel: row.popover });
  results.push({
    btn: row.btn,
    popover: row.popover,
    ok: state.expanded === 'true' && state.popHidden === false,
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(45);
}

const cornerbarVisible = await page.evaluate(() => {
  const btn = document.getElementById('tray-btn-cornerbar');
  return btn && !btn.hidden && getComputedStyle(btn).display !== 'none';
});

let cornerbarHide = { skipped: true };
let cornerbarRestore = { skipped: true };
let cornerOk = true;

if (cornerbarVisible) {
  await page.evaluate(() => window.openWindowByDataLink('nemo'));
  await page.waitForTimeout(45);
  await page.click('#tray-btn-cornerbar');
  await page.waitForFunction(() => {
    const nemo = document.querySelector('div[data-link="nemo"]');
    return nemo && nemo.style.display === 'none';
  }, null, { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(40);
  cornerbarHide = await page.evaluate(() => {
    const nemo = document.querySelector('div[data-link="nemo"]');
    const btn = document.getElementById('tray-btn-cornerbar');
    return {
      pressed: btn ? btn.getAttribute('aria-pressed') : null,
      nemoHidden: nemo ? nemo.style.display === 'none' : false,
    };
  });

  await page.click('#tray-btn-cornerbar');
  await page.waitForFunction(() => {
    const nemo = document.querySelector('div[data-link="nemo"]');
    return nemo && nemo.style.display !== 'none';
  }, null, { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(40);
  cornerbarRestore = await page.evaluate(() => {
    const nemo = document.querySelector('div[data-link="nemo"]');
    const btn = document.getElementById('tray-btn-cornerbar');
    return {
      pressed: btn ? btn.getAttribute('aria-pressed') : null,
      nemoVisible: nemo ? nemo.style.display !== 'none' : false,
    };
  });
  cornerOk = cornerbarHide.nemoHidden && cornerbarRestore.nemoVisible;
}

const trayOk = results.every((r) => r.ok);

console.log(JSON.stringify({ results, cornerbarHide, cornerbarRestore, trayOk, cornerOk }, null, 2));
await browser.close();
process.exit(trayOk && cornerOk ? 0 : 1);
