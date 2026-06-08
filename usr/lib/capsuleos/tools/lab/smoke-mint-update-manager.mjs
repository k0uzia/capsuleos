#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.evaluate(() => {
  try {
    window.localStorage.removeItem('capsule-mintupdate-welcome-dismissed');
    window.localStorage.removeItem('capsule-mintupdate-mirror-dismissed');
  } catch (e) {
    /* ignore */
  }
});

await page.click('footer nav a[data-link="mainMenu"]');
await page.waitForTimeout(40);
await page.fill('#menu-search', 'Gestionnaire de mise à jour');
await page.waitForTimeout(80);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(180);

const welcome = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="update_manager"]');
  const header = win?.querySelector('#windowHeader');
  const title = win?.querySelector('#windowTitle');
  const hb = header ? header.getBoundingClientRect() : null;
  const tb = title ? title.getBoundingClientRect() : null;
  const titleCentered = hb && tb
    ? Math.abs((hb.left + hb.width / 2) - (tb.left + tb.width / 2)) < 12
    : false;
  return {
    winVisible: win && win.style.display !== 'none',
    title: win?.querySelector('#windowTitle')?.textContent,
    welcomeVisible: !document.getElementById('um-welcome')?.hidden,
    mainHidden: document.getElementById('um-main')?.hidden,
    welcomeTitle: document.querySelector('.update-manager__welcome-title')?.textContent,
    titleCentered,
  };
});

await page.click('[data-um-welcome="finish"]');
await page.waitForTimeout(45);

const uptodate = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="update_manager"]');
  const header = win?.querySelector('#windowHeader');
  const app = document.getElementById('updateManagerApp');
  const hb = header ? header.getBoundingClientRect() : null;
  const ab = app ? app.getBoundingClientRect() : null;
  return {
    welcomeHidden: document.getElementById('um-welcome')?.hidden,
    mainVisible: !document.getElementById('um-main')?.hidden,
    emptyVisible: !document.getElementById('um-empty')?.hidden,
    tableHidden: document.getElementById('um-tablewrap')?.hidden,
    emptyText: document.querySelector('.update-manager__empty-text')?.textContent,
    installDisabled: document.querySelector('[data-um-action="install"]')?.disabled,
    refreshEnabled: !document.querySelector('[data-um-action="refresh"]')?.disabled,
    bannerVisible: !document.getElementById('um-mirror-banner')?.hidden,
    layoutOk: hb && ab ? Math.round(ab.top) >= Math.round(hb.bottom) - 1 : false,
  };
});

await page.click('[data-um-menu="file"]');
await page.waitForTimeout(50);
const menu = await page.evaluate(() => ({
  fileOpen: !document.querySelector('[data-um-menu="file"]')
    ?.parentElement?.querySelector('.update-manager__menu-dropdown')?.hidden,
}));

await page.keyboard.press('Escape');
await page.waitForTimeout(40);
await page.click('[data-um-mirror="no"]');
await page.waitForTimeout(70);

const mirror = await page.evaluate(() => {
  const banner = document.getElementById('um-mirror-banner');
  const style = banner ? window.getComputedStyle(banner) : null;
  return {
    bannerHidden: banner ? banner.hidden : null,
    bannerDisplay: style ? style.display : null,
    mirrorDismissed: window.localStorage.getItem('capsule-mintupdate-mirror-dismissed') === '1',
  };
});

await page.click('[data-um-action="refresh"]');
await page.waitForFunction(() => {
  const table = document.getElementById('um-tablewrap');
  const status = document.getElementById('um-status-text')?.textContent || '';
  const installBtn = document.querySelector('[data-um-action="install"]');
  const selectedRow = document.querySelector('#um-tablewrap tbody tr.is-selected');
  const panel = document.getElementById('um-panel');
  return table && !table.hidden
    && status.indexOf('sélectionnée') !== -1
    && installBtn && !installBtn.disabled
    && selectedRow
    && panel && panel.textContent.indexOf('alsa-lib') !== -1;
}, null, { timeout: 5000 });
await page.waitForTimeout(50);

const updates = await page.evaluate(() => ({
  tableVisible: !document.getElementById('um-tablewrap')?.hidden,
  rowCount: document.querySelectorAll('#um-tablewrap tbody tr').length,
  status: document.getElementById('um-status-text')?.textContent,
  installEnabled: !document.querySelector('[data-um-action="install"]')?.disabled,
  selectedRow: !!document.querySelector('#um-tablewrap tbody tr.is-selected'),
  panelHasPkg: (document.getElementById('um-panel')?.textContent || '').includes('alsa-lib'),
}));

await page.click('[data-um-action="clear"]');
await page.waitForTimeout(70);

const cleared = await page.evaluate(() => ({
  status: document.getElementById('um-status-text')?.textContent,
  installDisabled: document.querySelector('[data-um-action="install"]')?.disabled,
  allUnchecked: Array.from(document.querySelectorAll('#um-tablewrap tbody input[type="checkbox"]'))
    .every((cb) => !cb.checked),
}));

await page.click('[data-um-action="selectAll"]');
await page.waitForTimeout(70);

const selectedAll = await page.evaluate(() => ({
  status: document.getElementById('um-status-text')?.textContent,
  installEnabled: !document.querySelector('[data-um-action="install"]')?.disabled,
}));

await page.click('[data-um-action="install"]');
await page.waitForFunction(() => {
  const tray = document.querySelector('[data-update-manager-tray]');
  const empty = document.getElementById('um-empty');
  const table = document.getElementById('um-tablewrap');
  const installBtn = document.querySelector('[data-um-action="install"]');
  const app = document.getElementById('updateManagerApp');
  return empty && !empty.hidden
    && table && table.hidden
    && installBtn && installBtn.disabled
    && tray && tray.dataset.hasUpdates === 'false'
    && app && app.dataset.umBusy !== 'true';
}, null, { timeout: 6000 });
await page.waitForTimeout(50);

const installed = await page.evaluate(() => {
  const tray = document.querySelector('[data-update-manager-tray]');
  return {
    emptyVisible: !document.getElementById('um-empty')?.hidden,
    tableHidden: document.getElementById('um-tablewrap')?.hidden,
    installDisabled: document.querySelector('[data-um-action="install"]')?.disabled,
    trayHasUpdates: tray ? tray.dataset.hasUpdates === 'true' : null,
    busy: document.getElementById('updateManagerApp')?.dataset.umBusy === 'true',
  };
});

const dims = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="update_manager"]');
  const menubar = document.querySelector('.update-manager__menubar');
  const toolbar = document.querySelector('.update-manager__toolbar');
  const banner = document.getElementById('um-mirror-banner');
  const winBox = win ? win.getBoundingClientRect() : null;
  const menubarBox = menubar ? menubar.getBoundingClientRect() : null;
  const toolbarBox = toolbar ? toolbar.getBoundingClientRect() : null;
  const bannerBox = banner && !banner.hidden ? banner.getBoundingClientRect() : null;
  const bannerStyle = banner ? window.getComputedStyle(banner) : null;
  const header = win?.querySelector('#windowHeader');
  const rightNav = header?.querySelector('nav:last-child');
  const headerBox = header ? header.getBoundingClientRect() : null;
  const rightNavBox = rightNav ? rightNav.getBoundingClientRect() : null;
  return {
    win: winBox ? { w: Math.round(winBox.width), h: Math.round(winBox.height) } : null,
    menubar: menubarBox ? { h: Math.round(menubarBox.height) } : null,
    toolbar: toolbarBox ? { h: Math.round(toolbarBox.height) } : null,
    banner: bannerBox ? { h: Math.round(bannerBox.height), bg: bannerStyle?.backgroundColor } : null,
    bannerVisible: banner && !banner.hidden,
    header: headerBox ? { w: Math.round(headerBox.width), overflow: header.scrollWidth > header.clientWidth } : null,
    controlsInWin: winBox && rightNavBox
      ? Math.round(rightNavBox.right) <= Math.round(winBox.right) + 1
      : false,
  };
});

const ok = welcome.winVisible && welcome.welcomeVisible && welcome.mainHidden
  && welcome.title === 'Gestionnaire de mise à jour'
  && welcome.welcomeTitle === 'Bienvenue dans le gestionnaire de mise à jour'
  && welcome.titleCentered
  && uptodate.welcomeHidden && uptodate.mainVisible && uptodate.emptyVisible
  && uptodate.emptyText === 'Votre système est à jour'
  && uptodate.installDisabled && uptodate.refreshEnabled
  && uptodate.bannerVisible && uptodate.layoutOk
  && menu.fileOpen
  && mirror.bannerHidden && mirror.bannerDisplay === 'none' && mirror.mirrorDismissed
  && updates.tableVisible && updates.rowCount >= 6
  && updates.status && updates.installEnabled && updates.selectedRow && updates.panelHasPkg
  && cleared.allUnchecked && cleared.installDisabled
  && cleared.status === 'Aucune mise à jour sélectionnée'
  && selectedAll.status === '129 mises à jour sont sélectionnées (1,1 Go)'
  && selectedAll.installEnabled
  && installed.emptyVisible && installed.tableHidden && installed.installDisabled
  && installed.trayHasUpdates === false && !installed.busy
  && dims.win && dims.win.w >= 784 && dims.win.w <= 796
  && dims.win.h >= 564 && dims.win.h <= 576
  && dims.menubar && dims.menubar.h >= 24 && dims.menubar.h <= 32
  && dims.toolbar && dims.toolbar.h >= 56 && dims.toolbar.h <= 64
  && dims.header && !dims.header.overflow
  && dims.controlsInWin;

console.log(JSON.stringify({
  welcome, uptodate, menu, mirror, updates, cleared, selectedAll, installed, dims, ok,
}, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
