#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Rhythmbox (Rb1–Rb4 P0) — slot `lecteur_multimedia` Ubuntu.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-rhythmbox-scenarios.mjs --id linux-ubuntu
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', scenario: null };
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

const openRhythmbox = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('lecteur_multimedia');
    }
  });
  await page.waitForSelector('.windowElement[data-link="lecteur_multimedia"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('rhythmboxApp')?.dataset?.rbGnomeInit === 'true',
    null,
    { timeout: 10000 },
  );
  await sleep(page, 300);
};

const readRbDataset = async (page) => page.evaluate(() => {
  const root = document.getElementById('rhythmboxApp');
  return root ? { ...root.dataset } : {};
});

const clickInRb = async (page, selector) => {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, selector);
};

const scenarioRb1 = async (page, errors) => {
  await openRhythmbox(page);
  const ds = await readRbDataset(page);
  if (ds.rbGnomeInit !== 'true') errors.push('Rb1 : rbGnomeInit=true attendu');
  if (ds.rbGnomeView !== 'library') errors.push(`Rb1 : vue library attendue, obtenu « ${ds.rbGnomeView} »`);
  const nav = await page.$('[data-rb-gnome-nav="library"].is-active');
  if (!nav) errors.push('Rb1 : bibliothèque non active');
  const tracks = await page.$$('[data-rb-gnome-tracks] .rb-app__track');
  if (tracks.length < 2) errors.push('Rb1 : liste de pistes incomplète');
};

const scenarioRb2 = async (page, errors) => {
  await openRhythmbox(page);
  await clickInRb(page, '[data-rb-gnome-track="capsule-lab-mix"]');
  await sleep(page, 150);
  const ds = await readRbDataset(page);
  if (ds.rbGnomeTrack !== 'capsule-lab-mix') errors.push(`Rb2 : piste capsule-lab-mix attendue, obtenu « ${ds.rbGnomeTrack} »`);
  const now = await page.textContent('[data-rb-gnome-now]');
  if (!String(now).includes('Capsule Lab Mix')) errors.push(`Rb2 : now playing attendu, obtenu « ${now} »`);
  if (ds.rbGnomePlaying !== 'false') errors.push('Rb2 : pause attendue après sélection');
};

const scenarioRb3 = async (page, errors) => {
  await openRhythmbox(page);
  await clickInRb(page, '[data-rb-gnome-action="play-pause"]');
  await sleep(page, 150);
  let ds = await readRbDataset(page);
  if (ds.rbGnomePlaying !== 'true') errors.push('Rb3 : lecture attendue');
  const now = await page.textContent('[data-rb-gnome-now]');
  if (!String(now).includes('Lecture')) errors.push(`Rb3 : libellé Lecture attendu, obtenu « ${now} »`);
  await clickInRb(page, '[data-rb-gnome-action="play-pause"]');
  await sleep(page, 150);
  ds = await readRbDataset(page);
  if (ds.rbGnomePlaying !== 'false') errors.push('Rb3 : pause attendue');
};

const scenarioRb4 = async (page, errors) => {
  await openRhythmbox(page);
  await clickInRb(page, '[data-rb-gnome-nav="podcasts"]');
  await sleep(page, 150);
  let ds = await readRbDataset(page);
  if (ds.rbGnomeView !== 'podcasts') errors.push(`Rb4 : vue podcasts attendue, obtenu « ${ds.rbGnomeView} »`);
  const active = await page.$('[data-rb-gnome-nav="podcasts"].is-active');
  if (!active) errors.push('Rb4 : onglet podcasts non actif');
  await clickInRb(page, '[data-rb-gnome-nav="library"]');
  await sleep(page, 150);
  ds = await readRbDataset(page);
  if (ds.rbGnomeView !== 'library') errors.push('Rb4 : retour bibliothèque attendu');
};

const SCENARIOS = { Rb1: scenarioRb1, Rb2: scenarioRb2, Rb3: scenarioRb3, Rb4: scenarioRb4 };

const main = async () => {
  const opts = parseArgs();
  if (opts.id !== 'linux-ubuntu') {
    console.error(`✗ ${opts.id} : smoke Rhythmbox réservé à linux-ubuntu`);
    process.exit(1);
  }
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
    console.error(`smoke-gnome-rhythmbox-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
  console.log(`✓ smoke-gnome-rhythmbox-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
