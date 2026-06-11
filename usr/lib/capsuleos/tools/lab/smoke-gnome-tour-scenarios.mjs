#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Tour (T1–T4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-tour-scenarios.mjs --id linux-alma
 *   ... --scenario T1
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

const openTour = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('tour');
    }
  });
  await page.waitForSelector('.windowElement[data-link="tour"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#gnomeTourApp', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeTourApp')?.dataset.tourInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const clickNext = async (page) => {
  const action = await page.getAttribute('#gnome-tour-next', 'data-tour-gnome-action');
  await page.click('#gnome-tour-next');
  await sleep(page, 120);
  return action;
};

const scenarioT1 = async (page, errors) => {
  await openTour(page);
  const step = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourStep);
  if (step !== '1') {
    errors.push(`T1 : tourStep=1 attendu, obtenu « ${step} »`);
  }
  const welcome = await page.$('[data-tour-gnome-illus="welcome"]');
  if (!welcome) {
    errors.push('T1 : illustration welcome attendue');
  }
  const title = await page.textContent('#gnome-tour-title');
  if (!String(title).includes('Visite')) {
    errors.push(`T1 : titre Visite attendu, obtenu « ${title} »`);
  }
};

const scenarioT2 = async (page, errors) => {
  await openTour(page);
  await clickNext(page);
  const step = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourStep);
  if (step !== '2') {
    errors.push(`T2 : tourStep=2 attendu, obtenu « ${step} »`);
  }
  const overview = await page.$('[data-tour-gnome-illus="overview"]');
  if (!overview) {
    errors.push('T2 : illustration overview attendue');
  }
  const prevVisible = await page.evaluate(() => {
    const el = document.querySelector('[data-tour-gnome-action="prev"]');
    return el && !el.hidden;
  });
  if (!prevVisible) {
    errors.push('T2 : bouton Précédent visible attendu');
  }
};

const scenarioT3 = async (page, errors) => {
  await openTour(page);
  for (let i = 0; i < 5; i += 1) {
    const action = await clickNext(page);
    if (action === 'finish') {
      break;
    }
  }
  const finished = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourFinished);
  if (finished !== 'true') {
    errors.push('T3 : tourFinished=true attendu');
  }
  const finishIllus = await page.$('[data-tour-gnome-illus="finish"]');
  if (!finishIllus) {
    errors.push('T3 : illustration finish attendue');
  }
};

const scenarioT4 = async (page, errors) => {
  await openTour(page);
  await clickNext(page);
  await clickNext(page);
  const stepBefore = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourStep);
  if (stepBefore !== '3') {
    errors.push(`T4 : tourStep=3 avant retour attendu, obtenu « ${stepBefore} »`);
  }
  await page.click('[data-tour-gnome-action="prev"]');
  await sleep(page, 120);
  const step = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourStep);
  if (step !== '2') {
    errors.push(`T4 : tourStep=2 après retour attendu, obtenu « ${step} »`);
  }
  const title = await page.evaluate(() => document.getElementById('gnomeTourApp')?.dataset.tourStepTitle);
  if (!String(title).toLowerCase().includes('vue')) {
    errors.push(`T4 : titre étape Aperçu attendu, obtenu « ${title} »`);
  }
};

const SCENARIOS = {
  T1: scenarioT1,
  T2: scenarioT2,
  T3: scenarioT3,
  T4: scenarioT4,
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
    console.error(`smoke-gnome-tour-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-tour-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
