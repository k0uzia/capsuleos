#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Baobab (B1–B4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-baobab-scenarios.mjs --id linux-alma
 *   ... --scenario B1
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

const openBaobab = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('baobab');
    }
  });
  await page.waitForSelector('.windowElement[data-link="baobab"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#gnomeBaobabApp', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeBaobabApp')?.dataset.baobabInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioB1 = async (page, errors) => {
  await openBaobab(page);
  const homeActive = await page.$('[data-baobab-gnome-volume="home"].gnome-baobab__place--active');
  if (!homeActive) {
    errors.push('B1 : Dossier personnel actif attendu');
  }
  const overview = await page.$('[data-baobab-gnome-view="overview"].is-active');
  if (!overview) {
    errors.push('B1 : vue overview active attendue');
  }
  const label = await page.evaluate(() => document.getElementById('gnomeBaobabApp')?.dataset.baobabVolumeLabel);
  if (!String(label).toLowerCase().includes('personnel')) {
    errors.push(`B1 : libellé personnel attendu, obtenu « ${label} »`);
  }
};

const scenarioB2 = async (page, errors) => {
  await openBaobab(page);
  await page.click('[data-baobab-gnome-volume="root"]');
  await sleep(page, 120);
  const active = await page.$('[data-baobab-gnome-volume="root"].gnome-baobab__place--active');
  if (!active) {
    errors.push('B2 : Ordinateur actif attendu');
  }
  const volume = await page.evaluate(() => document.getElementById('gnomeBaobabApp')?.dataset.baobabVolume);
  if (volume !== 'root') {
    errors.push(`B2 : baobabVolume=root attendu, obtenu « ${volume} »`);
  }
  const title = await page.textContent('#gnome-baobab-title');
  if (!String(title).includes('Ordinateur')) {
    errors.push(`B2 : titre Ordinateur attendu, obtenu « ${title} »`);
  }
};

const scenarioB3 = async (page, errors) => {
  await openBaobab(page);
  await page.click('[data-baobab-gnome-action="scan"]');
  await page.waitForFunction(
    () => document.getElementById('gnomeBaobabApp')?.dataset.baobabTreemapReady === 'true',
    null,
    { timeout: 8000 },
  );
  const treemap = await page.$('[data-baobab-gnome-view="treemap"].is-active');
  if (!treemap) {
    errors.push('B3 : vue treemap active attendue');
  }
  const cell = await page.$('[data-baobab-gnome-treemap-cell]');
  if (!cell) {
    errors.push('B3 : cellule treemap attendue');
  }
};

const scenarioB4 = async (page, errors) => {
  await openBaobab(page);
  await page.click('[data-baobab-gnome-volume="boot"]');
  await sleep(page, 120);
  const volume = await page.evaluate(() => document.getElementById('gnomeBaobabApp')?.dataset.baobabVolume);
  if (volume !== 'boot') {
    errors.push(`B4 : baobabVolume=boot attendu, obtenu « ${volume} »`);
  }
  const scanEnabled = await page.$('[data-baobab-gnome-action="scan"]:not([disabled])');
  if (!scanEnabled) {
    errors.push('B4 : bouton Analyser actif attendu');
  }
};

const SCENARIOS = {
  B1: scenarioB1,
  B2: scenarioB2,
  B3: scenarioB3,
  B4: scenarioB4,
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
    console.error(`smoke-gnome-baobab-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-baobab-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
