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
];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.CapsuleMintTray === 'object', null, { timeout: 60000 });

const results = [];

for (const row of TRAY_CASES) {
  await page.click(row.btn);
  await page.waitForTimeout(200);
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
  await page.waitForTimeout(120);
}

await page.evaluate(() => window.openWindowByDataLink('nemo'));
await page.waitForTimeout(500);
await page.click('#tray-btn-cornerbar');
await page.waitForTimeout(300);
const cornerbarHide = await page.evaluate(() => {
  const nemo = document.querySelector('div[data-link="nemo"]');
  const btn = document.getElementById('tray-btn-cornerbar');
  return {
    pressed: btn ? btn.getAttribute('aria-pressed') : null,
    nemoHidden: nemo ? nemo.style.display === 'none' : false,
  };
});

await page.click('#tray-btn-cornerbar');
await page.waitForTimeout(400);
const cornerbarRestore = await page.evaluate(() => {
  const nemo = document.querySelector('div[data-link="nemo"]');
  const btn = document.getElementById('tray-btn-cornerbar');
  return {
    pressed: btn ? btn.getAttribute('aria-pressed') : null,
    nemoVisible: nemo ? nemo.style.display !== 'none' : false,
  };
});

const trayOk = results.every((r) => r.ok);
const cornerOk = cornerbarHide.nemoHidden && cornerbarRestore.nemoVisible;

console.log(JSON.stringify({ results, cornerbarHide, cornerbarRestore, trayOk, cornerOk }, null, 2));
await browser.close();
process.exit(trayOk && cornerOk ? 0 : 1);
