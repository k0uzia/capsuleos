#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('a.desktop-shortcut[data-link="text_editor"]');
await page.waitForTimeout(800);

const before = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="text_editor"]');
  const app = document.getElementById('xedApp');
  const area = document.getElementById('xed-area');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.xedInit === 'true',
    title: document.querySelector('div[data-link="text_editor"] #windowTitle')?.textContent,
    hasMenubar: !!document.querySelector('.xed-app__menubar'),
    hasStatus: document.getElementById('xed-status-pos')?.textContent,
  };
});

await page.fill('#xed-area', 'Bonjour xed\nligne 2');
await page.waitForTimeout(200);

const after = await page.evaluate(() => {
  const area = document.getElementById('xed-area');
  const title = document.querySelector('div[data-link="text_editor"] #windowTitle')?.textContent;
  const pos = document.getElementById('xed-status-pos')?.textContent;
  const chars = document.getElementById('xed-status-chars')?.textContent;
  return {
    value: area ? area.value : '',
    title: title,
    pos: pos,
    chars: chars,
  };
});

const ok = before.winVisible && before.appReady && before.title === 'Sans titre'
  && before.hasMenubar && before.hasStatus === 'Ligne 1, Col 1'
  && after.value.indexOf('Bonjour xed') >= 0
  && after.title === '*Sans titre'
  && after.pos && after.pos.indexOf('Ligne') >= 0
  && after.chars && after.chars.indexOf('caract') >= 0;

console.log(JSON.stringify({ before, after, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
