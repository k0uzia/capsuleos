#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Firefox (F1–F4 P0) — slot `firefox`.
 * Anti-régression Mint : --id linux-mint vérifie Firefox Cinnamon intact (pas chrome Proton GNOME).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-firefox-scenarios.mjs --id linux-alma
 *   ... --scenario F1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_PROFILES = new Set(['linux-alma', 'linux-rocky', 'linux-fedora', 'linux-ubuntu']);
const CINNAMON_PROFILES = new Set(['linux-mint']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-alma', scenario: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    if (args[i] === '--scenario' && args[i + 1]) opts.scenario = args[++i];
  }
  return opts;
};

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const openFirefox = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('firefox');
    }
  });
  await page.waitForSelector('#firefox [data-firefox-app][data-initialized="true"], #firefox [data-firefox-app][data-initialized=true]', { timeout: 15000 }).catch(() => null);
  await page.waitForFunction(
    () => {
      const app = document.querySelector('#firefox [data-firefox-app]');
      return app?.dataset?.initialized === 'true';
    },
    null,
    { timeout: 10000 },
  );
  await sleep(page, 400);
};

const readFirefoxDataset = async (page) => page.evaluate(() => {
  const root = document.querySelector('#firefox [data-firefox-gnome-root]');
  return root ? { ...root.dataset } : {};
});

const scenarioF1 = async (page, errors) => {
  await openFirefox(page);
  const init = await readFirefoxDataset(page);
  if (init.firefoxGnomeInit !== 'true') {
    errors.push('F1 : dataset.firefoxGnomeInit=true attendu');
  }
  if (init.firefoxGnomeView !== 'home') {
    errors.push(`F1 : vue home attendue, obtenu « ${init.firefoxGnomeView} »`);
  }
  const newtabVisible = await page.evaluate(() => {
    const panel = document.querySelector('[data-firefox-gnome-newtab]');
    return panel && !panel.hidden;
  });
  if (!newtabVisible) {
    errors.push('F1 : page nouvel onglet non visible');
  }
  const search = await page.locator('[data-browser-newtab-input]').count();
  if (search === 0) {
    errors.push('F1 : champ recherche nouvel onglet absent');
  }
  const tabLabel = await page.textContent('.capsule-browser__tab--active .capsule-browser__tab-label');
  if (!String(tabLabel).includes('Nouvel onglet')) {
    errors.push(`F1 : libellé « Nouvel onglet » attendu, obtenu « ${tabLabel} »`);
  }
};

const scenarioF2 = async (page, errors) => {
  await openFirefox(page);
  await page.fill('[data-firefox-gnome-address]', 'os-lacapsule');
  await page.press('[data-firefox-gnome-address]', 'Enter');
  await sleep(page, 500);
  const state = await page.evaluate(() => ({
    view: document.querySelector('[data-firefox-gnome-root]')?.dataset?.firefoxGnomeView,
    redirect: !!document.querySelector('[data-browser-redirect]:not([hidden])'),
    tabLabel: document.querySelector('.capsule-browser__tab--active .capsule-browser__tab-label')?.textContent || '',
    address: document.querySelector('[data-firefox-gnome-address]')?.value || '',
  }));
  if (state.view !== 'os-lacapsule') {
    errors.push(`F2 : vue os-lacapsule attendue, obtenu « ${state.view} »`);
  }
  if (!state.redirect) {
    errors.push('F2 : iframe os-lacapsule non visible');
  }
  if (!String(state.tabLabel).includes('Capsule')) {
    errors.push(`F2 : onglet La Capsule attendu, obtenu « ${state.tabLabel} »`);
  }
};

const scenarioF3 = async (page, errors) => {
  await openFirefox(page);
  await page.click('[data-browser-action="new-tab"]');
  await sleep(page, 300);
  let ds = await readFirefoxDataset(page);
  if (ds.firefoxGnomeTabCount !== '2') {
    errors.push(`F3 : 2 onglets attendus, obtenu « ${ds.firefoxGnomeTabCount} »`);
  }
  if (ds.firefoxGnomeActiveTabId !== 'tab-2') {
    errors.push(`F3 : tab-2 actif attendu, obtenu « ${ds.firefoxGnomeActiveTabId} »`);
  }
  await page.click('[data-browser-tab-id="tab-1"]');
  await sleep(page, 250);
  ds = await readFirefoxDataset(page);
  if (ds.firefoxGnomeActiveTabId !== 'tab-1') {
    errors.push(`F3 : tab-1 actif attendu, obtenu « ${ds.firefoxGnomeActiveTabId} »`);
  }
  const tabs = await page.locator('[data-browser-tab-id]').count();
  if (tabs !== 2) {
    errors.push(`F3 : compteur DOM onglets = 2 attendu, obtenu ${tabs}`);
  }
};

const scenarioF4 = async (page, errors) => {
  await openFirefox(page);
  const bookmarks = await page.evaluate(() => ({
    visible: (() => {
      const bar = document.querySelector('[data-firefox-gnome-bookmarks]');
      return bar && !bar.hidden;
    })(),
    dataset: document.querySelector('[data-firefox-gnome-root]')?.dataset?.firefoxGnomeBookmarksVisible,
  }));
  if (!bookmarks.visible) {
    errors.push('F4 : barre favoris non visible (chrome GNOME)');
  }
  if (bookmarks.dataset !== 'true') {
    errors.push(`F4 : firefoxGnomeBookmarksVisible=true attendu, obtenu « ${bookmarks.dataset} »`);
  }
  await page.evaluate(() => {
    const link = document.querySelector('[data-browser-bookmark="La Capsule"]');
    if (link) {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });
  await sleep(page, 450);
  const state = await page.evaluate(() => ({
    view: document.querySelector('[data-firefox-gnome-root]')?.dataset?.firefoxGnomeView,
    redirect: !!document.querySelector('[data-browser-redirect]:not([hidden])'),
  }));
  if (state.view !== 'os-lacapsule') {
    errors.push(`F4 : navigation favori os-lacapsule attendue, obtenu « ${state.view} »`);
  }
  if (!state.redirect) {
    errors.push('F4 : page La Capsule non affichée après favori');
  }
};

const SCENARIOS = {
  F1: scenarioF1,
  F2: scenarioF2,
  F3: scenarioF3,
  F4: scenarioF4,
};

const smokeMintAntiRegression = async (page, errors) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('firefox');
    }
  });
  await sleep(page, 800);
  const state = await page.evaluate(() => {
    const win = document.getElementById('firefox');
    const app = win && win.querySelector('[data-firefox-app]');
    const header = win && win.querySelector('#windowHeader');
    const tabsbar = app && app.querySelector('.capsule-browser__tabsbar');
    return {
      bodyId: document.body.id,
      initialized: app && app.dataset.initialized === 'true',
      noFedoraClass: !(win && win.classList.contains('firefox-window--fedora')),
      headerInTabs: !!(tabsbar && header && tabsbar.contains(header)),
      gnomeDatasetInit: app && app.dataset.firefoxGnomeInit === 'true',
      bookmarksHidden: app && app.querySelector('[data-browser-bookmarks]')?.hidden,
      titleText: win && win.querySelector('#windowTitle')?.textContent?.trim(),
    };
  });
  if (state.bodyId !== 'mint') {
    errors.push(`Mint : body#mint attendu, obtenu « ${state.bodyId} »`);
  }
  if (!state.initialized) {
    errors.push('Mint : Firefox non initialisé');
  }
  if (!state.noFedoraClass) {
    errors.push('Mint : classe firefox-window--fedora interdite sur Mint');
  }
  if (state.headerInTabs) {
    errors.push('Mint : contrôles fenêtre dans tabsbar (régression Proton GNOME)');
  }
  if (state.gnomeDatasetInit) {
    errors.push('Mint : dataset.firefoxGnomeInit actif (fuite GNOME)');
  }
  if (!state.bookmarksHidden) {
    errors.push('Mint : barre favoris doit rester masquée par défaut');
  }
  if (!state.titleText || state.titleText.indexOf('Firefox') < 0) {
    errors.push(`Mint : titre fenêtre Firefox attendu, obtenu « ${state.titleText} »`);
  }
};

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });

  const url = resolveCapsuleOsUrl(opts.id, base);
  const errors = [];

  if (CINNAMON_PROFILES.has(opts.id)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
      await smokeMintAntiRegression(page, errors);
    } catch (err) {
      errors.push(`Mint anti-régression : ${err.message}`);
    } finally {
      await page.close();
    }
  } else if (!GNOME_PROFILES.has(opts.id)) {
    errors.push(`${opts.id} : profil non supporté (GNOME ou Mint attendu)`);
  } else {
    const runList = opts.scenario ? [opts.scenario] : Object.keys(SCENARIOS);
    for (const scenarioId of runList) {
      const fn = SCENARIOS[scenarioId];
      if (!fn) {
        errors.push(`${scenarioId} : scénario inconnu`);
        continue;
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
        await fn(page, errors);
        if (!errors.some((e) => e.startsWith(scenarioId))) {
          process.stdout.write(`  ✓ ${scenarioId}\n`);
        }
      } catch (err) {
        errors.push(`${scenarioId} : ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  if (errors.length) {
    console.error(`smoke-gnome-firefox-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (CINNAMON_PROFILES.has(opts.id)) {
    console.log(`✓ smoke-gnome-firefox-scenarios ${opts.id} OK — anti-régression Firefox Cinnamon`);
  } else {
    const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
    console.log(`✓ smoke-gnome-firefox-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
