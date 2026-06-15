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
  navCount: document.querySelectorAll('[data-cs-nav]').length,
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
await page.waitForTimeout(120);
await page.waitForSelector('#cinnamonSettingsApp .themes-app__select', { timeout: 10000 });
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
  await page.waitForTimeout(80);
}
const styleSelect = await page.evaluate(() => ({
  label: document.querySelector('#cinnamonSettingsApp .themes-app__select span')?.textContent,
  dataTheme: document.documentElement.dataset.theme,
  lightCardActive: document.querySelector('[data-theme-option="light"]')?.classList.contains('is-active'),
}));

await page.click('[data-theme-option="dark"]');
await page.waitForTimeout(80);
const darkTheme = await page.evaluate(() => ({
  dataTheme: document.documentElement.dataset.theme,
  darkCardActive: document.querySelector('[data-theme-option="dark"]')?.classList.contains('is-active'),
  styleLabel: document.querySelector('#cinnamonSettingsApp .themes-app__select span')?.textContent,
}));

await page.click('[data-theme-option="light"]');
await page.waitForTimeout(80);
const lightToggle = await page.evaluate(() => ({
  dataTheme: document.documentElement.dataset.theme,
  taskbarColor: getComputedStyle(document.getElementById('tableau')).color,
}));

await page.click('#cs-back');
await page.waitForTimeout(80);
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
  && search.bluetoothVisible
  && themesPanel.title === 'Thèmes' && themesPanel.active
  && themesPanel.themesApp && themesPanel.mintY === 'Mint-Y-Dark-Aqua'
  && styleSelect.label === 'Mint-Y-Aqua'
  && styleSelect.dataTheme === 'light'
  && styleSelect.lightCardActive
  && darkTheme.dataTheme === 'dark'
  && darkTheme.darkCardActive
  && darkTheme.styleLabel === 'Mint-Y-Dark-Aqua'
  && lightToggle.dataTheme === 'light'
  && lightToggle.taskbarColor === 'rgb(30, 30, 30)'
  && switchToggle.ok && switchToggle.title === 'Clavier';

console.log(JSON.stringify({
  ready, search, themesPanel, stylePopover, styleSelect, darkTheme, lightToggle, switchToggle, ok,
}, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
