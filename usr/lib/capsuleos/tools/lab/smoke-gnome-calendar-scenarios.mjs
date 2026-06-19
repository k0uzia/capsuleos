#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Agenda (Cal1–Cal4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-calendar-scenarios.mjs --id linux-alma
 *   ... --scenario Cal1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_CALENDAR_SESSION_KEY = 'capsule-gnome-calendar-session';

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

const openCalendar = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('calendar');
    }
  });
  await page.waitForSelector('.windowElement[data-link="calendar"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#gnomeCalendarApp', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeCalendarApp')?.dataset.calendarInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const resetCalendar = async (page) => {
  await page.evaluate((key) => {
    window.sessionStorage.removeItem(key);
  }, GNOME_CALENDAR_SESSION_KEY);
  await sleep(page, 80);
};

const scenarioCal1 = async (page, errors) => {
  await openCalendar(page);
  const monthActive = await page.$('[data-cal-gnome-view="month"].is-active');
  if (!monthActive) {
    errors.push('Cal1 : onglet Mois actif attendu');
  }
  const panel = await page.$('[data-cal-gnome-panel="month"]:not([hidden])');
  if (!panel) {
    errors.push('Cal1 : panneau mois visible attendu');
  }
  const days = await page.$$('#gnome-cal-grid [data-cal-gnome-day]');
  if (days.length < 28) {
    errors.push(`Cal1 : grille mois attendue, obtenu ${days.length} jours`);
  }
  const label = await page.evaluate(() => document.getElementById('gnomeCalendarApp')?.dataset.calendarPeriodLabel);
  if (!label) {
    errors.push('Cal1 : libellé période attendu');
  }
};

const scenarioCal2 = async (page, errors) => {
  await openCalendar(page);
  await page.click('[data-cal-gnome-action="new-event"]');
  await sleep(page, 120);
  const editorVisible = await page.evaluate(() => {
    const el = document.querySelector('[data-cal-gnome-editor]');
    return el && !el.hidden;
  });
  if (!editorVisible) {
    errors.push('Cal2 : éditeur évènement attendu');
  }
  await page.fill('[data-cal-gnome-event-title]', 'Réunion CapsuleOS');
  await page.click('[data-cal-gnome-action="save-event"]');
  await sleep(page, 180);
  const event = await page.$('[data-cal-gnome-event="evt-1"]');
  if (!event) {
    errors.push('Cal2 : évènement evt-1 attendu');
  }
  const count = await page.evaluate(() => document.getElementById('gnomeCalendarApp')?.dataset.calendarTodayCount);
  if (count !== '1') {
    errors.push(`Cal2 : calendarTodayCount=1 attendu, obtenu « ${count} »`);
  }
};

const scenarioCal3 = async (page, errors) => {
  await openCalendar(page);
  await page.click('[data-cal-gnome-view="week"]');
  await sleep(page, 150);
  const weekActive = await page.$('[data-cal-gnome-view="week"].is-active');
  if (!weekActive) {
    errors.push('Cal3 : onglet Semaine actif attendu');
  }
  const cols = await page.$$('[data-cal-gnome-weekday]');
  if (cols.length !== 7) {
    errors.push(`Cal3 : 7 colonnes semaine attendues, obtenu ${cols.length}`);
  }
  const view = await page.evaluate(() => document.getElementById('gnomeCalendarApp')?.dataset.calendarView);
  if (view !== 'week') {
    errors.push(`Cal3 : calendarView=week attendu, obtenu « ${view} »`);
  }
};

const scenarioCal4 = async (page, errors) => {
  await openCalendar(page);
  await page.click('[data-cal-gnome-view="month"]');
  await sleep(page, 100);
  const before = await page.evaluate(() => document.getElementById('gnomeCalendarApp')?.dataset.calendarPeriodLabel);
  if (!before) {
    errors.push('Cal4 : libellé initial attendu');
  }
  await page.click('[data-cal-gnome-action="next"]');
  await sleep(page, 150);
  const after = await page.evaluate(() => document.getElementById('gnomeCalendarApp')?.dataset.calendarPeriodLabel);
  if (!after || after === before) {
    errors.push(`Cal4 : libellé période doit changer (avant « ${before} », après « ${after} »)`);
  }
};

const SCENARIOS = {
  Cal1: scenarioCal1,
  Cal2: scenarioCal2,
  Cal3: scenarioCal3,
  Cal4: scenarioCal4,
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
      await resetCalendar(page);
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
    console.error(`smoke-gnome-calendar-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-calendar-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
