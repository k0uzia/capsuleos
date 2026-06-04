#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  permissions: ['clipboard-read', 'clipboard-write'],
});
const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('a.desktop-shortcut[data-link="text_editor"]');
await page.waitForTimeout(800);

const menuOpen = await page.evaluate(() => {
  const trigger = document.querySelector('.xed-menu__trigger');
  if (!trigger) return { ok: false };
  trigger.click();
  const dropdown = trigger.parentElement.querySelector('.xed-menu__dropdown');
  return { ok: dropdown && !dropdown.hidden };
});
await page.waitForTimeout(150);

await page.evaluate(() => {
  document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
});
await page.fill('#xed-area', 'texte initial');
await page.keyboard.press('Control+a');
await page.keyboard.press('Control+c');
await page.fill('#xed-area', '');
await page.click('#xed-toolbar [data-xed-action="paste"]');
await page.waitForTimeout(200);

const after = await page.evaluate(() => {
  const area = document.getElementById('xed-area');
  const title = document.querySelector('div[data-link="text_editor"] #windowTitle')?.textContent;
  return {
    value: area ? area.value : '',
    title: title,
    appReady: document.getElementById('xedApp')?.dataset.xedInit === 'true',
  };
});

const ok = after.appReady && menuOpen.ok && after.value === 'texte initial'
  && after.title === '*Sans titre';

console.log(JSON.stringify({ after, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
