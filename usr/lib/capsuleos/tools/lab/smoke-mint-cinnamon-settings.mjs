#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.evaluate(() => window.openWindowByDataLink('themes'));
await page.waitForTimeout(200);

const opened = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="themes"]');
  const app = document.getElementById('cinnamonSettingsApp');
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: app && app.dataset.cinnamonSettingsInit === 'true',
    title: win?.querySelector('#windowTitle')?.textContent,
    navCount: app?.querySelectorAll('[data-cs-nav]').length || 0,
    panelTitle: app?.querySelector('#cs-panel-title')?.textContent,
  };
});

await page.click('[data-cs-nav="themes"]');
await page.waitForTimeout(80);

const themesPanel = await page.evaluate(() => {
  const panel = document.querySelector('[data-cs-panel="themes"]');
  const gtk = panel?.querySelector('[data-themes-gtk]')?.textContent
    || panel?.querySelector('[data-cs-theme="gtk"]')?.textContent;
  return {
    visible: panel && !panel.hidden,
    gtk,
    cards: panel?.querySelectorAll('[data-theme-option]').length || 0,
  };
});

await page.fill('#cs-search', 'son');
await page.waitForTimeout(80);

const search = await page.evaluate(() => ({
  panelTitle: document.querySelector('#cs-panel-title')?.textContent,
  soundNavVisible: !document.querySelector('[data-cs-nav="sound"]')?.hidden,
  themesNavHidden: document.querySelector('[data-cs-nav="themes"]')?.hidden,
}));

await page.fill('#cs-search', '');
await page.waitForTimeout(80);
await page.click('[data-cs-nav="backgrounds"]');
await page.waitForTimeout(80);

const backgrounds = await page.evaluate(() => {
  const panel = document.querySelector('[data-cs-panel="backgrounds"]');
  const tiles = panel?.querySelectorAll('[data-wallpaper-grid] .gnome-settings-wallpaper').length || 0;
  return { visible: panel && !panel.hidden, tiles };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="themes"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

await browser.close();

const ok = opened.appReady
  && opened.title === 'Paramètres du système'
  && opened.navCount >= 28
  && themesPanel.visible
  && themesPanel.gtk && /Mint-Y-(Dark-)?Aqua/.test(themesPanel.gtk)
  && search.panelTitle === 'Son'
  && backgrounds.visible
  && dims.win && dims.win.w >= 780 && dims.win.h >= 580;

console.log(JSON.stringify({ opened, themesPanel, search, backgrounds, dims, ok }, null, 2));
process.exit(ok ? 0 : 1);
