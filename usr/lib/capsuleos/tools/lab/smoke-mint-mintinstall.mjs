#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'mintinstall');
await page.waitForTimeout(200);

const ready = await page.evaluate(() => ({
  init: document.getElementById('mintInstallApp')?.dataset.mintInstallInit === 'true',
  title: document.querySelector('div[data-link="mintinstall"] #windowTitle')?.textContent,
  home: !document.querySelector('[data-mi-page="home"]')?.hidden,
}));

await page.fill('#mi-search', 'VLC');
await page.waitForTimeout(80);
const search = await page.evaluate(() => ({
  pageVisible: !document.querySelector('[data-mi-page="search"]')?.hidden,
  count: document.querySelectorAll('#mi-search-list .mi-app__list-item').length,
  title: document.getElementById('mi-search-title')?.textContent,
}));

await page.fill('#mi-search', '');
await page.waitForTimeout(40);
await page.click('[data-mi-cat="internet"]');
await page.waitForTimeout(70);
const internet = await page.evaluate(() => ({
  active: document.querySelector('[data-mi-cat="internet"]')?.classList.contains('is-active'),
  listVisible: !document.querySelector('[data-mi-page="list"]')?.hidden,
  rows: document.querySelectorAll('#mi-app-list .mi-app__list-item').length,
}));

await page.click('[data-mi-install="firefox"]');
await page.waitForTimeout(50);
const install = await page.evaluate(() => ({
  status: document.getElementById('mi-status')?.textContent,
  installed: document.querySelector('[data-mi-install="firefox"]')?.disabled,
}));

await page.click('[data-mi-action="menu"]');
await page.waitForTimeout(40);
const menu = await page.evaluate(() => !document.getElementById('mi-menu')?.hidden);

const ok = ready.init && ready.title === 'Logithèque' && ready.home
  && search.pageVisible && search.count >= 1 && search.title.indexOf('VLC') >= 0
  && internet.active && internet.listVisible && internet.rows >= 2
  && install.status && install.status.indexOf('Firefox') >= 0 && install.installed
  && menu;

console.log(JSON.stringify({ ready, search, internet, install, menu, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
