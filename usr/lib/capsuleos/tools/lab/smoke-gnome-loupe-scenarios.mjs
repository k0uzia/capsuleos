#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Loupe (Li1–Li4 P0) — slot `visionneur_images`.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-loupe-scenarios.mjs --id linux-rocky
 *   ... --scenario Li1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_PROFILES = new Set(['linux-alma', 'linux-rocky', 'linux-fedora', 'linux-ubuntu']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', scenario: null };
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

const openLoupe = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('visionneur_images');
    }
  });
  await page.waitForSelector('.windowElement[data-link="visionneur_images"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#visionneurImages[data-loupe-gnome-root]', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('visionneurImages')?.dataset?.loupeGnomeInit === 'true',
    null,
    { timeout: 8000 },
  );
  await sleep(page, 300);
};

const readLoupeDataset = async (page) => page.evaluate(() => {
  const root = document.getElementById('visionneurImages');
  return root ? { ...root.dataset } : {};
});

const scenarioLi1 = async (page, errors) => {
  await openLoupe(page);
  const ds = await readLoupeDataset(page);
  if (ds.loupeGnomeInit !== 'true') errors.push('Li1 : loupeGnomeInit=true attendu');
  if (ds.loupeGnomeHasImage !== 'false') errors.push(`Li1 : pas d'image attendu, obtenu « ${ds.loupeGnomeHasImage} »`);
  const empty = await page.$('[data-loupe-gnome-empty]:not([hidden])');
  if (!empty) errors.push('Li1 : état vide non visible');
};

const scenarioLi2 = async (page, errors) => {
  await openLoupe(page);
  await page.evaluate(() => { if (typeof window.openPixDemoImage === 'function') window.openPixDemoImage(); });
  await sleep(page, 600);
  const ds = await readLoupeDataset(page);
  if (ds.loupeGnomeHasImage !== 'true') errors.push('Li2 : image attendue');
  const img = await page.$('[data-loupe-gnome-canvas] .viewer-app__image');
  if (!img) errors.push('Li2 : élément image absent');
  const name = await page.textContent('[data-loupe-gnome-filename]');
  if (!String(name).toLowerCase().includes('demo')) errors.push(`Li2 : nom demo attendu, obtenu « ${name} »`);
};

const scenarioLi3 = async (page, errors) => {
  await openLoupe(page);
  await page.evaluate(() => { if (typeof window.openPixDemoImage === 'function') window.openPixDemoImage(); });
  await sleep(page, 500);
  await page.click('[data-loupe-gnome-action="zoom-in"]');
  await sleep(page, 150);
  let ds = await readLoupeDataset(page);
  if (ds.loupeGnomeZoom !== '125') errors.push(`Li3 : zoom 125 attendu, obtenu « ${ds.loupeGnomeZoom} »`);
  await page.click('[data-loupe-gnome-action="zoom-out"]');
  await sleep(page, 150);
  ds = await readLoupeDataset(page);
  if (ds.loupeGnomeZoom !== '100') errors.push(`Li3 : zoom 100 attendu, obtenu « ${ds.loupeGnomeZoom} »`);
};

const scenarioLi4 = async (page, errors) => {
  await openLoupe(page);
  await page.evaluate(() => { if (typeof window.openPixDemoImage === 'function') window.openPixDemoImage(); });
  await sleep(page, 500);
  await page.click('[data-loupe-gnome-action="toggle-meta"]');
  await sleep(page, 150);
  const ds = await readLoupeDataset(page);
  if (ds.loupeGnomeMetaOpen !== 'true') errors.push('Li4 : méta ouvert attendu');
  const pane = await page.$('[data-loupe-gnome-meta]:not([hidden])');
  if (!pane) errors.push('Li4 : panneau propriétés non visible');
};

const SCENARIOS = { Li1: scenarioLi1, Li2: scenarioLi2, Li3: scenarioLi3, Li4: scenarioLi4 };

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }
  if (!GNOME_PROFILES.has(opts.id)) {
    console.error(`✗ ${opts.id} : profil GNOME attendu`);
    process.exit(1);
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });
  const url = resolveCapsuleOsUrl(opts.id, base);
  const errors = [];
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

  await browser.close();

  if (errors.length) {
    console.error(`smoke-gnome-loupe-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
  console.log(`✓ smoke-gnome-loupe-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
