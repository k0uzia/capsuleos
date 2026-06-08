#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.evaluate(() => window.openWindowByDataLink('firefox'));
await page.waitForTimeout(180);

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
  return {
    visible: win && win.style.display !== 'none',
    noCsdClass: !(win && win.classList.contains('firefox-window--fedora')),
    initialized: app && app.dataset.initialized === 'true',
    headerInTabs: !!(tabsbar && header && tabsbar.contains(header)),
    headerBeforeApp: headerIdx >= 0 && appHostIdx > headerIdx,
    titleText: title ? title.textContent.replace(/\s+/g, ' ').trim() : '',
    newtabVisible: !!(newtab && !newtab.hidden),
    hasNewtabSearch: !!(newtab && newtab.querySelector('[data-browser-newtab-input]')),
    hasNewtabLogo: !!(newtab && newtab.querySelector('.capsule-browser-newtab__logo')),
    bookmarksHidden: bookmarks ? bookmarks.hidden : false,
    initialTabCount: tabs,
    protonMenuIcon: menuBtn ? getComputedStyle(menuBtn, '::before').maskImage !== 'none' : false,
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

await page.click('div[data-link="firefox"] [data-browser-newtab-link="os-lacapsule"]');
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

await page.click('div[data-link="firefox"] [data-browser-action="toggle-bookmarks"]');
await page.waitForTimeout(70);

const bookmarksToggle = await page.evaluate(() => {
  const bar = document.querySelector('#firefox [data-browser-bookmarks]');
  const btn = document.querySelector('#firefox [data-browser-action="toggle-bookmarks"]');
  return {
    visible: bar && !bar.hidden,
    pressed: btn && btn.getAttribute('aria-pressed') === 'true',
  };
});

await page.click('div[data-link="firefox"] [data-browser-action="home"]');
await page.waitForTimeout(80);

const homeView = await page.evaluate(() => {
  const app = document.querySelector('#firefox [data-firefox-app]');
  const home = app && app.querySelector('[data-browser-home]');
  return {
    view: app && app.getAttribute('data-browser-current-view'),
    homeVisible: home && !home.hidden,
  };
});

const ok = chrome.visible && chrome.noCsdClass && chrome.initialized
  && !chrome.headerInTabs && chrome.headerBeforeApp
  && chrome.titleText.indexOf('Mozilla Firefox') >= 0
  && chrome.newtabVisible && chrome.hasNewtabSearch && chrome.hasNewtabLogo
  && chrome.bookmarksHidden && chrome.initialTabCount === 1 && chrome.goHidden
  && multiTab.count === 2 && multiTab.activeIsSecond
  && osPage.view === 'os-lacapsule' && osPage.redirectVisible
  && osPage.tabLabel.indexOf('Capsule') >= 0
  && bookmarksToggle.visible && bookmarksToggle.pressed
  && homeView.view === 'home' && homeView.homeVisible;

console.log(JSON.stringify({ chrome, multiTab, osPage, bookmarksToggle, homeView, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
