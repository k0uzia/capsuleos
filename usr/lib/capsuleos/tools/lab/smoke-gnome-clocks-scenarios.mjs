#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Horloges (H1–H4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-clocks-scenarios.mjs --id linux-alma
 *   ... --scenario H1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_CLOCKS_SESSION_KEY = 'capsule-gnome-clocks-session';

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

const openClocks = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('clocks');
    }
  });
  await page.waitForSelector('.windowElement[data-link="clocks"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#gnomeClocksApp', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeClocksApp')?.dataset.clocksInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const resetClocks = async (page) => {
  await page.evaluate((key) => {
    window.sessionStorage.removeItem(key);
  }, GNOME_CLOCKS_SESSION_KEY);
  await sleep(page, 80);
};

const scenarioH1 = async (page, errors) => {
  await openClocks(page);
  const paris = await page.$('[data-clocks-gnome-city="paris"]');
  if (!paris) {
    errors.push('H1 : carte Paris attendue');
  }
  await page.click('[data-clocks-action="add-city"]');
  await sleep(page, 150);
  const tokyo = await page.$('[data-clocks-gnome-city="tokyo"]');
  if (!tokyo) {
    errors.push('H1 : carte Tokyo attendue après ajout');
  }
  const count = await page.evaluate(() => document.getElementById('gnomeClocksApp')?.dataset.clocksCityCount);
  if (count !== '4') {
    errors.push(`H1 : clocksCityCount=4 attendu, obtenu « ${count} »`);
  }
};

const scenarioH2 = async (page, errors) => {
  await openClocks(page);
  await page.click('[data-clocks-view="stopwatch"]');
  await sleep(page, 120);
  await page.click('[data-clocks-action="stopwatch-toggle"]');
  await sleep(page, 200);
  const running = await page.evaluate(() => document.getElementById('gnomeClocksApp')?.dataset.clocksStopwatchRunning);
  if (running !== 'true') {
    errors.push('H2 : clocksStopwatchRunning=true attendu');
  }
  const hint = await page.textContent('[data-clocks-gnome-hint="stopwatch"]');
  if (!String(hint).toLowerCase().includes('arrêter')) {
    errors.push(`H2 : libellé arrêter attendu, obtenu « ${hint} »`);
  }
};

const scenarioH3 = async (page, errors) => {
  await openClocks(page);
  await page.click('[data-clocks-view="timer"]');
  await sleep(page, 120);
  await page.click('[data-clocks-action="timer-toggle"]');
  await sleep(page, 200);
  const running = await page.evaluate(() => document.getElementById('gnomeClocksApp')?.dataset.clocksTimerRunning);
  if (running !== 'true') {
    errors.push('H3 : clocksTimerRunning=true attendu');
  }
  const face = await page.textContent('[data-clocks-gnome-face="timer"]');
  if (!String(face).includes(':')) {
    errors.push(`H3 : affichage minuteur attendu, obtenu « ${face} »`);
  }
};

const scenarioH4 = async (page, errors) => {
  await openClocks(page);
  await page.click('[data-clocks-view="alarms"]');
  await sleep(page, 120);
  const emptyVisible = await page.evaluate(() => {
    const el = document.querySelector('[data-clocks-gnome-empty="alarms"]');
    return el && !el.hidden;
  });
  if (!emptyVisible) {
    errors.push('H4 : état vide alarmes attendu');
  }
  await page.click('[data-clocks-action="add-alarm"]');
  await sleep(page, 150);
  const alarm = await page.$('[data-clocks-gnome-alarm="alarm-1"]');
  if (!alarm) {
    errors.push('H4 : carte alarm-1 attendue');
  }
  const count = await page.evaluate(() => document.getElementById('gnomeClocksApp')?.dataset.clocksAlarmCount);
  if (count !== '1') {
    errors.push(`H4 : clocksAlarmCount=1 attendu, obtenu « ${count} »`);
  }
};

const SCENARIOS = {
  H1: scenarioH1,
  H2: scenarioH2,
  H3: scenarioH3,
  H4: scenarioH4,
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
      await resetClocks(page);
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
    console.error(`smoke-gnome-clocks-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-clocks-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
