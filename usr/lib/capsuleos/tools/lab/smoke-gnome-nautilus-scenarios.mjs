#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Nautilus (N1–N4 P0) — slot CapsuleOS `nemo`.
 * Anti-régression Mint : --id linux-mint vérifie Nemo Cinnamon intact (pas Nautilus 47).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-scenarios.mjs --id linux-alma
 *   ... --scenario N1
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

const openNautilus = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('nemo');
    }
  });
  await page.waitForSelector('div[data-link="nemo"] .nautilus-app--n47', { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('div[data-link="nemo"] [data-nautilus-gnome-root]');
      return root?.dataset?.nautilusGnomeInit === 'true'
        || typeof window.bindFileExplorerNautilusFeatures === 'function';
    },
    null,
    { timeout: 10000 },
  );
  await sleep(page, 500);
};

const scenarioN1 = async (page, errors) => {
  await openNautilus(page);
  const title = await page.textContent('[data-nautilus-gnome-title]');
  if (String(title).trim() !== 'Fichiers') {
    errors.push(`N1 : titre « Fichiers » attendu, obtenu « ${title} »`);
  }
  const crumb = await page.textContent('#nautilus-path-crumbs');
  if (!String(crumb).includes('Dossier personnel')) {
    errors.push(`N1 : fil d'Ariane Dossier personnel attendu, obtenu « ${crumb} »`);
  }
  const pathbarVisible = await page.evaluate(() => {
    const bar = document.querySelector('[data-nautilus-gnome-path-crumbbar]');
    return bar && !bar.hidden;
  });
  if (!pathbarVisible) {
    errors.push('N1 : barre chemin non visible');
  }
  const grid = await page.locator('[data-nautilus-gnome-grid]').count();
  if (grid === 0) {
    errors.push('N1 : grille fichiers absente');
  }
  const place = await page.evaluate(() => (
    document.querySelector('[data-nautilus-gnome-root]')?.dataset?.nautilusGnomePlace
    || document.querySelector('div[data-link="nemo"] main')?.dataset?.nautilusGnomePlace
  ));
  if (place !== 'home') {
    errors.push(`N1 : dataset.nautilusGnomePlace=home attendu, obtenu « ${place} »`);
  }
};

const scenarioN2 = async (page, errors) => {
  await openNautilus(page);
  await page.click('[data-nautilus-gnome-sidebar="documents"]');
  await sleep(page, 450);
  const docsPath = await page.evaluate(() => window.getExplorerCurrentPath('nemo'));
  if (!String(docsPath).endsWith('/Documents')) {
    errors.push(`N2 : chemin Documents attendu, obtenu « ${docsPath} »`);
  }
  const placeDocs = await page.evaluate(() => (
    document.querySelector('[data-nautilus-gnome-root]')?.dataset?.nautilusGnomePlace
  ));
  if (placeDocs !== 'documents') {
    errors.push(`N2 : place documents attendue, obtenu « ${placeDocs} »`);
  }
  await page.click('[data-nautilus-gnome-sidebar="downloads"]');
  await sleep(page, 450);
  const dlPath = await page.evaluate(() => window.getExplorerCurrentPath('nemo'));
  if (!String(dlPath).endsWith('/Téléchargements') && !String(dlPath).endsWith('/Downloads')) {
    errors.push(`N2 : chemin Téléchargements attendu, obtenu « ${dlPath} »`);
  }
};

const scenarioN3 = async (page, errors) => {
  await openNautilus(page);
  const pathbar = await page.evaluate(() => {
    const bar = document.querySelector('[data-nautilus-gnome-path-crumbbar]');
    return bar && !bar.hidden;
  });
  if (!pathbar) {
    errors.push('N3 : barre chemin absente');
  }
  const chromeMode = await page.evaluate(() => (
    document.querySelector('[data-nautilus-gnome-root]')?.dataset?.nautilusGnomeChromeMode
  ));
  if (chromeMode !== 'breadcrumb') {
    errors.push(`N3 : chromeMode breadcrumb attendu, obtenu « ${chromeMode} »`);
  }
  await page.click('[data-nautilus-gnome-action="new-folder"]');
  await sleep(page, 550);
  const created = await page.evaluate(() => ({
    folder: !!document.querySelector('.nemoElement a[data-item-name^="Nouveau dossier"]'),
    rename: !!document.querySelector('.nemo-app__item-rename-input'),
  }));
  if (!created.folder) {
    errors.push('N3 : nouveau dossier non créé');
  }
  if (!created.rename) {
    errors.push('N3 : renommage inline absent');
  }
};

const scenarioN4 = async (page, errors) => {
  await openNautilus(page);
  const placesSection = await page.locator('[data-nautilus-gnome-sidebar-section="places"]').count();
  const otherSection = await page.locator('[data-nautilus-gnome-sidebar-section="other-places"]').count();
  if (placesSection === 0 || otherSection === 0) {
    errors.push('N4 : sections sidebar places/other-places absentes');
  }
  await page.click('[data-nautilus-gnome-sidebar="starred"]');
  await sleep(page, 400);
  const starred = await page.evaluate(() => ({
    place: document.querySelector('[data-nautilus-gnome-root]')?.dataset?.nautilusGnomePlace,
    empty: !!document.querySelector('.nautilus-folder-empty--star'),
    path: window.getExplorerCurrentPath('nemo'),
    expected: window.CAPSULE_PLACE_STARRED,
  }));
  if (starred.place !== 'starred') {
    errors.push(`N4 : place starred attendue, obtenu « ${starred.place} »`);
  }
  if (!starred.empty) {
    errors.push('N4 : empty state Favoris absent');
  }
  if (starred.path !== starred.expected) {
    errors.push(`N4 : chemin Favoris incorrect (${starred.path})`);
  }
  await page.click('[data-nautilus-gnome-sidebar="network"]');
  await sleep(page, 400);
  const network = await page.evaluate(() => ({
    place: document.querySelector('[data-nautilus-gnome-root]')?.dataset?.nautilusGnomePlace,
    empty: !!document.querySelector('.nautilus-folder-empty--network'),
    bar: !!document.querySelector('#nautilus-network-bar:not([hidden])'),
  }));
  if (network.place !== 'network') {
    errors.push(`N4 : place network attendue, obtenu « ${network.place} »`);
  }
  if (!network.empty) {
    errors.push('N4 : empty state Réseau absent');
  }
  if (!network.bar) {
    errors.push('N4 : barre réseau absente');
  }
};

const SCENARIOS = {
  N1: scenarioN1,
  N2: scenarioN2,
  N3: scenarioN3,
  N4: scenarioN4,
};

const smokeMintAntiRegression = async (page, errors) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('nemo');
    }
  });
  await sleep(page, 800);
  const state = await page.evaluate(() => ({
    template: window.CAPSULE_EXPLORER_TEMPLATE,
    isNemo: typeof window.isNemoTemplate === 'function' ? window.isNemoTemplate() : null,
    isNautilusGnome: typeof window.isNautilusGnomeTemplate === 'function' ? window.isNautilusGnomeTemplate() : null,
    hasNautilus47: !!document.querySelector('div[data-link="nemo"] .nautilus-app--n47'),
    hasCinnamonNemo: !!document.querySelector('div[data-link="nemo"] .nemo-app:not(.nautilus-app)'),
    hasNautilusGnomeMarkers: !!document.querySelector('[data-nautilus-gnome-root]'),
    hasMenubar: !!document.querySelector('#nemo .nemo-app__menubar'),
  }));
  if (state.template !== 'nemo') {
    errors.push(`Mint : CAPSULE_EXPLORER_TEMPLATE=${state.template} (attendu nemo Cinnamon)`);
  }
  if (state.isNemo !== true) {
    errors.push('Mint : isNemoTemplate() doit être true');
  }
  if (state.isNautilusGnome === true) {
    errors.push('Mint : isNautilusGnomeTemplate() ne doit pas être actif');
  }
  if (state.hasNautilus47) {
    errors.push('Mint : gabarit Nautilus 47 détecté (régression Cinnamon)');
  }
  if (state.hasNautilusGnomeMarkers) {
    errors.push('Mint : marqueurs data-nautilus-gnome-* présents (fuite GNOME)');
  }
  if (!state.hasCinnamonNemo && !state.hasMenubar) {
    errors.push('Mint : gabarit Nemo Cinnamon non détecté');
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
    console.error(`smoke-gnome-nautilus-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (CINNAMON_PROFILES.has(opts.id)) {
    console.log(`✓ smoke-gnome-nautilus-scenarios ${opts.id} OK — anti-régression Nemo Cinnamon`);
  } else {
    const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
    console.log(`✓ smoke-gnome-nautilus-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
