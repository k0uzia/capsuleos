#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Paramètres (Th1–Th4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-themes-scenarios.mjs --id linux-alma
 *   ... --scenario Th1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

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

const openThemes = async (page, panelId = 'appearance') => {
  await page.evaluate((panel) => {
    if (typeof window.setCapsuleSettingsPanel === 'function') {
      window.setCapsuleSettingsPanel(panel);
    }
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('themes');
    }
  }, panelId);
  await page.waitForSelector('.windowElement[data-link="themes"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#themesApp.gnome-settings', { timeout: 10000 });
  await page.waitForFunction(
    () => document.querySelector('#themesApp')?.dataset.initialized === 'true',
    null,
    { timeout: 10000 },
  );
  await sleep(page, 200);
};

const scenarioTh1 = async (page, errors) => {
  await openThemes(page, 'appearance');
  await page.click('[data-theme-option="dark"]');
  await sleep(page, 400);
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  if (theme !== 'dark') {
    errors.push('Th1 : dataset.theme=dark attendu');
  }
  const help = await page.textContent('[data-themes-help]');
  if (!String(help).toLowerCase().includes('sombre')) {
    errors.push(`Th1 : libellé aide sombre attendu, obtenu « ${help} »`);
  }
};

const scenarioTh2 = async (page, errors) => {
  await openThemes(page, 'background');
  const wpId = await page.evaluate(() => {
    const catalog = window.CapsuleThemeStorage?.getWallpaperCatalog?.(document.body?.id || '');
    const entry = (catalog || []).find((e) => e.default) || (catalog || [])[0];
    return entry?.id || 'almalinux';
  });
  await page.waitForSelector(`[data-wallpaper-id="${wpId}"]`, { timeout: 8000 });
  await page.click(`[data-wallpaper-id="${wpId}"]`);
  await sleep(page, 300);
  const active = await page.evaluate((id) => {
    const tile = document.querySelector(`[data-wallpaper-id="${id}"]`);
    return tile?.classList.contains('is-active');
  }, wpId);
  if (!active) {
    errors.push(`Th2 : tuile ${wpId} is-active attendue`);
  }
  const wp = await page.evaluate(() => document.documentElement.dataset.gnomeWallpaper);
  if (wp !== wpId) {
    errors.push(`Th2 : dataset.gnomeWallpaper=${wpId} attendu, obtenu « ${wp} »`);
  }
};

const scenarioTh3 = async (page, errors) => {
  await openThemes(page, 'appearance');
  await page.click('[data-accent-chip="teal"]');
  await sleep(page, 200);
  const active = await page.evaluate(() => document.querySelector('[data-accent-chip="teal"]')?.classList.contains('is-active'));
  if (!active) {
    errors.push('Th3 : pastille teal is-active attendue');
  }
  const accent = await page.evaluate(() => window.CapsuleThemeStorage?.readSavedAccent?.());
  if (accent !== 'teal') {
    errors.push(`Th3 : accent teal attendu, obtenu « ${accent} »`);
  }
};

const scenarioTh4 = async (page, errors) => {
  await openThemes(page, 'appearance');
  await page.click('.gnome-settings__navitem[data-gnome-settings-panel="displays"]');
  await sleep(page, 200);
  const panelActive = await page.evaluate(() => {
    const panel = document.querySelector('[data-gnome-settings-panel="displays"]');
    return panel?.classList.contains('is-active') && !panel.hidden;
  });
  if (!panelActive) {
    errors.push('Th4 : panneau displays actif attendu');
  }
  const title = await page.evaluate(() => {
    const el = document.querySelector('[data-gnome-settings-panel="displays"] .gnome-settings__panel-title');
    return el?.textContent?.trim() || '';
  });
  if (!title.toLowerCase().includes('cran')) {
    errors.push(`Th4 : titre Écrans attendu, obtenu « ${title} »`);
  }
};

const SCENARIOS = {
  Th1: scenarioTh1,
  Th2: scenarioTh2,
  Th3: scenarioTh3,
  Th4: scenarioTh4,
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
    console.error(`smoke-gnome-themes-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-themes-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
