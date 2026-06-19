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

await page.fill('#mi-search', 'Transmission');
await page.waitForTimeout(80);
const search = await page.evaluate(() => ({
  pageVisible: !document.querySelector('[data-mi-page="search"]')?.hidden,
  count: document.querySelectorAll('#mi-search-list .mi-app__list-item').length,
  title: document.getElementById('mi-search-title')?.textContent,
}));

await page.fill('#mi-search', '');
await page.waitForTimeout(40);
// Layout VM 8.4 : sur l'accueil la sidebar est masquée — passer par la tuile catégorie.
await page.evaluate(() => {
  const homeBtn = document.querySelector('[data-mi-home-cat="internet"]');
  if (homeBtn) {
    homeBtn.click();
    return;
  }
  document.querySelector('[data-mi-cat="internet"]')?.click();
});
await page.waitForTimeout(70);
const internet = await page.evaluate(() => ({
  active: document.querySelector('[data-mi-cat="internet"]')?.classList.contains('is-active'),
  listVisible: !document.querySelector('[data-mi-page="list"]')?.hidden,
  rows: document.querySelectorAll('#mi-app-list .mi-app__list-item').length,
}));

const install = await page.evaluate(() => {
  const row = document.querySelector('#mi-app-list .mi-app__list-item[data-mi-pkg="firefox"]');
  // Préinstallé = bouton Ouvrir (data-mi-open), pas de bouton Installer actif.
  return {
    firefoxPreinstalled: !!row && (!!row.querySelector('[data-mi-open]')
      || row.querySelector('[data-mi-install]')?.disabled === true),
  };
});

await page.click('[data-mi-action="menu"]');
await page.waitForTimeout(40);
const menu = await page.evaluate(() => !document.getElementById('mi-menu')?.hidden);

const ok = ready.init && ready.title === 'Logithèque' && ready.home
  && search.pageVisible && search.count >= 1 && search.title.indexOf('Transmission') >= 0
  && internet.active && internet.listVisible && internet.rows >= 2
  && install.firefoxPreinstalled
  && menu;

console.log(JSON.stringify({ ready, search, internet, install, menu, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
