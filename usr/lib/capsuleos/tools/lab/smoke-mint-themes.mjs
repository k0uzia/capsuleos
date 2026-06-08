#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'themes');
await page.waitForTimeout(220);

const ready = await page.evaluate(() => ({
  init: document.getElementById('cinnamonSettingsApp')?.dataset.cinnamonSettingsInit === 'true',
  title: document.querySelector('div[data-link="themes"] #windowTitle')?.textContent,
  navCount: document.querySelectorAll('#cs-sidebar .cs-app__nav').length,
  panelTitle: document.getElementById('cs-panel-title')?.textContent,
}));

await page.fill('#cs-search', 'Bluetooth');
await page.waitForTimeout(70);
const search = await page.evaluate(() => ({
  title: document.getElementById('cs-panel-title')?.textContent,
  bluetoothVisible: !document.querySelector('[data-cs-nav="bluetooth"]')?.hidden,
}));

await page.fill('#cs-search', '');
await page.waitForTimeout(40);
await page.click('[data-cs-nav="themes"]');
await page.waitForTimeout(80);
const themesPanel = await page.evaluate(() => ({
  title: document.getElementById('cs-panel-title')?.textContent,
  active: document.querySelector('[data-cs-panel="themes"]')?.classList.contains('is-active'),
  themesApp: !!document.getElementById('themesApp'),
  mintY: document.querySelector('#cinnamonSettingsApp .themes-app__select span')?.textContent,
}));

await page.click('#cinnamonSettingsApp .themes-app__select');
await page.waitForTimeout(50);
const stylePopover = await page.evaluate(() => {
  const pop = document.getElementById('themes-style-popover');
  return pop && !pop.hidden;
});
if (stylePopover) {
  await page.click('[data-mint-style="Mint-Y-Aqua"]');
  await page.waitForTimeout(40);
}
const styleSelect = await page.evaluate(() => (
  document.querySelector('#cinnamonSettingsApp .themes-app__select span')?.textContent
));

await page.click('[data-cs-nav="keyboard"]');
await page.waitForTimeout(50);
const switchToggle = await page.evaluate(() => {
  const sw = document.querySelector('[data-cs-panel="keyboard"] .cs-switch');
  if (!sw) return { ok: false };
  const before = sw.getAttribute('aria-checked');
  sw.click();
  return { ok: sw.getAttribute('aria-checked') !== before, title: document.getElementById('cs-panel-title')?.textContent };
});

const ok = ready.init && ready.title === 'Paramètres du système'
  && ready.navCount >= 30
  && search.title === 'Bluetooth' && search.bluetoothVisible
  && themesPanel.title === 'Thèmes' && themesPanel.active
  && themesPanel.themesApp && themesPanel.mintY === 'Mint-Y-Dark-Aqua'
  && styleSelect === 'Mint-Y-Aqua'
  && switchToggle.ok && switchToggle.title === 'Clavier';

console.log(JSON.stringify({
  ready, search, themesPanel, stylePopover, styleSelect, switchToggle, ok,
}, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
