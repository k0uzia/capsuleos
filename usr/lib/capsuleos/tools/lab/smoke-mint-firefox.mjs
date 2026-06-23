#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

function parseRgb(color) {
  const m = String(color || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function rgbNear(actual, expected, tolerance = 4) {
  const a = parseRgb(actual);
  const e = parseRgb(expected);
  if (!a || !e) return false;
  return Math.abs(a[0] - e[0]) <= tolerance
    && Math.abs(a[1] - e[1]) <= tolerance
    && Math.abs(a[2] - e[2]) <= tolerance;
}

function probeFirefoxTheme() {
  const app = document.querySelector('#firefox [data-firefox-app]');
  const tabsbar = app && app.querySelector('.capsule-browser__tabsbar');
  const toolbar = app && app.querySelector('.capsule-browser__toolbar');
  const activeTab = app && app.querySelector('.capsule-browser__tab--active');
  const newtab = app && app.querySelector('[data-browser-home]');
  const address = app && app.querySelector('.capsule-browser__addressbar');
  const activeStyle = activeTab ? getComputedStyle(activeTab) : null;
  return {
    tabsBg: tabsbar ? getComputedStyle(tabsbar).backgroundColor : '',
    toolbarBg: toolbar ? getComputedStyle(toolbar).backgroundColor : '',
    activeTabBg: activeTab ? getComputedStyle(activeTab).backgroundColor : '',
    activeTabShadow: activeStyle ? activeStyle.boxShadow : '',
    addressBg: address ? getComputedStyle(address).backgroundColor : '',
    newtabBg: newtab ? getComputedStyle(newtab).backgroundColor : '',
    fontFamily: app ? getComputedStyle(app).fontFamily : '',
  };
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.evaluate(() => window.openWindowByDataLink('firefox'));
await page.waitForFunction(
  () => document.querySelector('#firefox [data-firefox-app]')?.dataset?.initialized === 'true',
  null,
  { timeout: 15000 },
);
await page.waitForTimeout(250);

const darkTheme = await page.evaluate(probeFirefoxTheme);
const darkOk = rgbNear(darkTheme.tabsBg, 'rgb(28, 27, 34)')
  && rgbNear(darkTheme.toolbarBg, 'rgb(43, 42, 51)')
  && rgbNear(darkTheme.activeTabBg, 'rgb(66, 65, 77)')
  && rgbNear(darkTheme.addressBg, 'rgb(66, 65, 77)')
  && rgbNear(darkTheme.newtabBg, 'rgb(28, 27, 34)')
  && (darkTheme.activeTabShadow === 'none' || darkTheme.activeTabShadow === '')
  && darkTheme.fontFamily.toLowerCase().includes('ubuntu');

await page.evaluate(() => {
  document.documentElement.dataset.theme = 'light';
  localStorage.setItem('gnome-theme', 'light');
});
await page.waitForTimeout(300);

const lightTheme = await page.evaluate(probeFirefoxTheme);
const lightOk = rgbNear(lightTheme.tabsBg, 'rgb(240, 240, 244)')
  && rgbNear(lightTheme.toolbarBg, 'rgb(249, 249, 251)')
  && rgbNear(lightTheme.activeTabBg, 'rgb(255, 255, 255)')
  && rgbNear(lightTheme.newtabBg, 'rgb(249, 249, 251)');

const chrome = await page.evaluate(() => {
  const win = document.getElementById('firefox');
  const app = win && win.querySelector('[data-firefox-app]');
  const tabsbar = app && app.querySelector('.capsule-browser__tabsbar');
  const header = win && win.querySelector('#windowHeader');
  const title = header && header.querySelector('#windowTitle');
  const childLinks = win ? Array.from(win.children) : [];
  const headerIdx = header ? childLinks.indexOf(header) : -1;
  const appHostIdx = app
    ? childLinks.findIndex((el) => el === app || el.contains(app))
    : -1;
  const newtab = app && app.querySelector('[data-browser-home]');
  const bookmarks = app && app.querySelector('[data-browser-bookmarks]');
  const tabs = app ? app.querySelectorAll('[data-browser-tab-id]').length : 0;
  const menuBtn = app && app.querySelector('.capsule-browser__btn--icon-menu');
  const profileBtn = app && app.querySelector('[data-browser-action="profile"]');
  const pocketBtn = app && app.querySelector('[data-browser-action="pocket"]');
  const homeBtn = app && app.querySelector('[data-browser-action="home"]');
  const shortcutCount = app ? app.querySelectorAll('[data-browser-newtab-link]').length : 0;
  const pocketSection = app && app.querySelector('.capsule-browser-newtab__pocket');
  const bg = newtab ? getComputedStyle(newtab).backgroundColor : '';
  const titleStyle = title ? getComputedStyle(title) : null;
  const leftNav = header && header.querySelector(':scope > nav:first-child');
  const leftNavBefore = leftNav ? getComputedStyle(leftNav, '::before') : null;
  return {
    visible: win && win.style.display !== 'none',
    mintProton: app && app.classList.contains('capsule-browser--proton'),
    noCsdClass: !(win && win.classList.contains('firefox-window--fedora')),
    initialized: app && app.dataset.initialized === 'true',
    headerInTabs: !!(tabsbar && header && tabsbar.contains(header)),
    headerBeforeApp: headerIdx >= 0 && appHostIdx > headerIdx,
    titleText: title ? title.textContent.replace(/\s+/g, ' ').trim() : '',
    titleAlignCenter: titleStyle ? titleStyle.textAlign === 'center' : false,
    titleJustifyCenter: titleStyle ? titleStyle.justifySelf === 'center' : false,
    titleIconInNav: leftNavBefore ? leftNavBefore.content !== 'none' && leftNavBefore.content !== 'normal' : false,
    headerHeightPx: header ? parseFloat(getComputedStyle(header).height) : 0,
    headerDragHandle: header ? header.hasAttribute('data-window-drag-handle') : false,
    newtabVisible: !!(newtab && !newtab.hidden),
    hasNewtabBrand: !!(newtab && newtab.querySelector('.capsule-browser-newtab__brand')),
    hasNewtabSearch: !!(newtab && newtab.querySelector('[data-browser-newtab-input]')),
    hasGoogleIcon: !!(newtab && newtab.querySelector('.capsule-browser-newtab__search-icon')),
    bookmarksHidden: bookmarks ? bookmarks.hidden : false,
    initialTabCount: tabs,
    protonMenuIcon: menuBtn ? getComputedStyle(menuBtn, '::before').maskImage !== 'none' : false,
    hasProfile: !!profileBtn,
    hasPocket: !!pocketBtn,
    noHomeBtn: !homeBtn,
    shortcutCount,
    hasPocketSection: !!pocketSection,
    lightNewtabBg: bg,
    goHidden: app
      ? getComputedStyle(app.querySelector('.capsule-browser__btn--go')).display === 'none'
      : false,
  };
});

await page.click('div[data-link="firefox"] [data-browser-action="new-tab"]');
await page.waitForTimeout(80);

const multiTab = await page.evaluate(() => {
  const app = document.querySelector('#firefox [data-firefox-app]');
  const tabs = app ? app.querySelectorAll('[data-browser-tab-id]') : [];
  return { count: tabs.length, activeIsSecond: tabs[1] && tabs[1].classList.contains('capsule-browser__tab--active') };
});

await page.click('div[data-link="firefox"] [data-browser-newtab-link="amazon"]');
await page.waitForTimeout(45);

const osPage = await page.evaluate(() => {
  const app = document.querySelector('#firefox [data-firefox-app]');
  const redirect = app && app.querySelector('[data-browser-redirect]');
  const input = app && app.querySelector('[data-browser-address]');
  const activeTab = app && app.querySelector('.capsule-browser__tab--active .capsule-browser__tab-label');
  return {
    view: app && app.getAttribute('data-browser-current-view'),
    redirectVisible: redirect && !redirect.hidden,
    address: input ? input.value : '',
    tabLabel: activeTab ? activeTab.textContent : '',
  };
});

const ok = darkOk && lightOk
  && chrome.visible && chrome.mintProton && chrome.noCsdClass && chrome.initialized
  && !chrome.headerInTabs && chrome.headerBeforeApp
  && chrome.headerDragHandle && chrome.headerHeightPx >= 30 && chrome.headerHeightPx <= 34
  && chrome.titleAlignCenter && chrome.titleJustifyCenter
  && chrome.titleText.indexOf('Mozilla Firefox') >= 0
  && chrome.newtabVisible && chrome.hasNewtabBrand && chrome.hasNewtabSearch && chrome.hasGoogleIcon
  && chrome.bookmarksHidden && chrome.initialTabCount === 1 && chrome.goHidden
  && chrome.hasProfile && chrome.hasPocket && chrome.noHomeBtn
  && chrome.shortcutCount >= 7 && chrome.hasPocketSection
  && multiTab.count === 2 && multiTab.activeIsSecond
  && osPage.view === 'web' && osPage.redirectVisible
  && (osPage.tabLabel.indexOf('amazon') >= 0 || osPage.address.indexOf('amazon') >= 0);

console.log(JSON.stringify({ darkTheme, darkOk, lightTheme, lightOk, chrome, multiTab, osPage, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
