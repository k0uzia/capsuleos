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
    homeTiles: app?.querySelectorAll('[data-cs-home-module]').length || 0,
    categories: app?.querySelectorAll('[data-cs-category]').length || 0,
    view: app?.dataset.csView,
    panelTitle: app?.querySelector('#cs-panel-title')?.textContent,
  };
});

await page.click('[data-cs-nav="themes"]');
await page.waitForTimeout(80);

const themesPanel = await page.evaluate(() => {
  const panel = document.querySelector('[data-cs-panel="themes"]');
  const parityBuilt = panel?.dataset?.csParityBuilt === 'true';
  const gtk = parityBuilt
    ? document.body?.dataset?.capsuleGtkTheme
    : (panel?.querySelector('[data-themes-gtk]')?.textContent
      || panel?.querySelector('[data-cs-theme="gtk"]')?.textContent);
  return {
    visible: panel && !panel.hidden,
    parityBuilt,
    gtk,
    parityControls: panel?.querySelectorAll('[data-cs-capsule-key]').length || 0,
    cards: panel?.querySelectorAll('[data-theme-option]').length || 0,
  };
});

await page.fill('#cs-search', 'thème');
await page.waitForTimeout(80);

const search = await page.evaluate(() => ({
  panelTitle: document.querySelector('#cs-panel-title')?.textContent,
  themesTileVisible: !document.querySelector('[data-cs-nav="themes"]')?.hidden,
  generalTileHidden: document.querySelector('[data-cs-nav="general"]')?.hidden,
}));

await page.fill('#cs-search', '');
await page.waitForTimeout(80);
await page.click('[data-cs-nav="backgrounds"]');
await page.waitForTimeout(80);

const backgrounds = await page.evaluate(() => {
  const panel = document.querySelector('[data-cs-panel="backgrounds"]');
  const parityBuilt = panel?.dataset?.csParityBuilt === 'true';
  const tiles = panel?.querySelectorAll('[data-wallpaper-grid] .gnome-settings-wallpaper').length || 0;
  return {
    visible: panel && !panel.hidden,
    parityBuilt,
    parityControls: panel?.querySelectorAll('[data-cs-capsule-key]').length || 0,
    tiles,
  };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="themes"]');
  const box = win ? win.getBoundingClientRect() : null;
  return { win: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null };
});

const parityBoot = await page.evaluate(() => ({
  store: typeof window.CapsuleCinnamonGSettings !== 'undefined',
  parity: typeof window.CapsuleCinnamonSettingsParity !== 'undefined',
  wiredCount: window.CapsuleCinnamonSettingsParity?.wiredPanelIds?.length || 0,
}));

await page.evaluate(() => {
  document.querySelector('#cinnamonSettingsApp [data-cs-nav="desktop"]')?.click();
});
await page.waitForTimeout(120);

const desktopParity = await page.evaluate(() => {
  const panel = document.querySelector('[data-cs-panel="desktop"]');
  const switches = panel?.querySelectorAll('.cs-switch[data-cs-capsule-key]') || [];
  const shortcuts = document.querySelector('.desktop-shortcuts');
  const showToggle = panel?.querySelector('[data-cs-capsule-key="mint-desktop-show-icons"]');
  const shortcutsVisible = shortcuts && shortcuts.style.display !== 'none';
  if (showToggle && shortcutsVisible) {
    showToggle.click();
  }
  const afterHide = shortcuts && shortcuts.style.display === 'none';
  if (showToggle && afterHide) {
    showToggle.click();
  }
  const restored = shortcuts && shortcuts.style.display !== 'none';
  const stored = window.CapsuleCinnamonGSettings?.getBool?.('mint-desktop-show-icons', true);
  return {
    panelVisible: panel && !panel.hidden,
    parityBuilt: panel?.dataset?.csParityBuilt === 'true',
    switchCount: switches.length,
    shortcutsVisible,
    toggleHidesIcons: afterHide,
    toggleRestoresIcons: restored,
    gsettingsPersist: stored === true,
  };
});

const p2Parity = await page.evaluate(() => {
  const a11yPanel = document.querySelector('[data-cs-panel="accessibility"]');
  const hotcornerPanel = document.querySelector('[data-cs-panel="hotcorner"]');
  const appletsPanel = document.querySelector('[data-cs-panel="applets"]');
  document.querySelector('#cinnamonSettingsApp [data-cs-nav="accessibility"]')?.click();
  const contrastToggle = a11yPanel?.querySelector('[data-cs-capsule-key="mint-a11y-high-contrast"]');
  const beforeContrast = document.documentElement.dataset.contrastMode || 'normal';
  if (contrastToggle) {
    contrastToggle.click();
  }
  const afterContrast = document.documentElement.dataset.contrastMode;
  if (contrastToggle && afterContrast === 'high') {
    contrastToggle.click();
  }
  document.querySelector('#cinnamonSettingsApp [data-cs-nav="applets"]')?.click();
  const calToggle = appletsPanel?.querySelector('[data-cs-capsule-key="mint-applet-calendar"]');
  const clock = document.getElementById('taskbar-clock-trigger');
  const clockWasVisible = clock && !clock.hasAttribute('hidden');
  if (calToggle && clockWasVisible) {
    calToggle.click();
  }
  const clockHidden = clock && clock.hasAttribute('hidden');
  if (calToggle && clockHidden) {
    calToggle.click();
  }
  return {
    a11yBuilt: a11yPanel?.dataset?.csParityBuilt === 'true',
    a11ySwitches: a11yPanel?.querySelectorAll('.cs-switch[data-cs-capsule-key]').length || 0,
    contrastToggles: beforeContrast !== 'high' && afterContrast === 'high',
    hotcornerBuilt: hotcornerPanel?.dataset?.csParityBuilt === 'true',
    hotcornerControls: hotcornerPanel?.querySelectorAll('[data-cs-capsule-key]').length || 0,
    appletsBuilt: appletsPanel?.dataset?.csParityBuilt === 'true',
    appletsSwitches: appletsPanel?.querySelectorAll('.cs-switch[data-cs-capsule-key]').length || 0,
    calendarAppletHidesClock: clockWasVisible && clockHidden,
    calendarAppletRestoresClock: clock && !clock.hasAttribute('hidden'),
  };
});

await browser.close();

const ok = opened.appReady
  && opened.title === 'Paramètres du système'
  && opened.homeTiles >= 21
  && opened.categories === 2
  && opened.view === 'home'
  && themesPanel.visible
  && (themesPanel.parityBuilt
    ? themesPanel.parityControls >= 2 && /Mint-Y/.test(themesPanel.gtk || '')
    : themesPanel.gtk && /Mint-Y-(Dark-)?Aqua/.test(themesPanel.gtk))
  && search.panelTitle === 'Thèmes'
  && search.themesTileVisible
  && backgrounds.visible
  && (backgrounds.parityBuilt ? backgrounds.parityControls >= 2 : backgrounds.tiles >= 0)
  && dims.win && dims.win.w >= 795 && dims.win.h >= 620
  && parityBoot.store
  && parityBoot.parity
  && parityBoot.wiredCount >= 35
  && desktopParity.panelVisible
  && desktopParity.parityBuilt
  && desktopParity.switchCount === 3
  && desktopParity.toggleHidesIcons
  && desktopParity.toggleRestoresIcons
  && desktopParity.gsettingsPersist
  && p2Parity.a11yBuilt
  && p2Parity.a11ySwitches === 2
  && p2Parity.contrastToggles
  && p2Parity.hotcornerBuilt
  && p2Parity.hotcornerControls === 8
  && p2Parity.appletsBuilt
  && p2Parity.appletsSwitches === 3
  && p2Parity.calendarAppletHidesClock
  && p2Parity.calendarAppletRestoresClock;

console.log(JSON.stringify({
  opened, themesPanel, search, backgrounds, dims, parityBoot, desktopParity, p2Parity, ok,
}, null, 2));
process.exit(ok ? 0 : 1);
