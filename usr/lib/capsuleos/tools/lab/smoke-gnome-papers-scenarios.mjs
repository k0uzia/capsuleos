#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Papers (Pa1–Pa4 P0) — slot `visionneur_pdf`.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-papers-scenarios.mjs --id linux-rocky
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

const openPapers = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('visionneur_pdf');
    }
  });
  await page.waitForSelector('.windowElement[data-link="visionneur_pdf"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#visionneurPdf[data-papers-gnome-root]', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('visionneurPdf')?.dataset?.papersGnomeInit === 'true',
    null,
    { timeout: 8000 },
  );
  await sleep(page, 300);
};

const readPapersDataset = async (page) => page.evaluate(() => {
  const root = document.getElementById('visionneurPdf');
  return root ? { ...root.dataset } : {};
});

const loadDemoPdf = async (page) => {
  await page.evaluate(() => { if (typeof window.openXreaderDemoPdf === 'function') window.openXreaderDemoPdf(); });
  await sleep(page, 600);
};

const scenarioPa1 = async (page, errors) => {
  await openPapers(page);
  const ds = await readPapersDataset(page);
  if (ds.papersGnomeInit !== 'true') errors.push('Pa1 : papersGnomeInit=true attendu');
  if (ds.papersGnomeHasDocument !== 'false') errors.push('Pa1 : pas de document attendu');
  const empty = await page.$('[data-papers-gnome-empty]:not([hidden])');
  if (!empty) errors.push('Pa1 : état vide non visible');
};

const scenarioPa2 = async (page, errors) => {
  await openPapers(page);
  await loadDemoPdf(page);
  const ds = await readPapersDataset(page);
  if (ds.papersGnomeHasDocument !== 'true') errors.push('Pa2 : document attendu');
  const frame = await page.$('[data-papers-gnome-canvas] .viewer-app__frame');
  if (!frame) errors.push('Pa2 : iframe PDF absent');
  const name = await page.textContent('[data-papers-gnome-filename]');
  if (!String(name).includes('Bash')) errors.push(`Pa2 : Bash.pdf attendu, obtenu « ${name} »`);
};

const scenarioPa3 = async (page, errors) => {
  await openPapers(page);
  await loadDemoPdf(page);
  let ds = await readPapersDataset(page);
  if (ds.papersGnomePage !== '1') errors.push(`Pa3 : page 1 attendue, obtenu « ${ds.papersGnomePage} »`);
  await page.click('[data-papers-gnome-action="next"]');
  await sleep(page, 150);
  ds = await readPapersDataset(page);
  if (ds.papersGnomePage !== '2') errors.push(`Pa3 : page 2 attendue, obtenu « ${ds.papersGnomePage} »`);
  await page.click('[data-papers-gnome-action="prev"]');
  await sleep(page, 150);
  ds = await readPapersDataset(page);
  if (ds.papersGnomePage !== '1') errors.push(`Pa3 : retour page 1 attendu, obtenu « ${ds.papersGnomePage} »`);
};

const scenarioPa4 = async (page, errors) => {
  await openPapers(page);
  await loadDemoPdf(page);
  await page.click('[data-papers-gnome-action="sidebar"]');
  await sleep(page, 150);
  const ds = await readPapersDataset(page);
  if (ds.papersGnomeSidebar !== 'true') errors.push('Pa4 : sidebar=true attendu');
  const pane = await page.$('[data-papers-gnome-sidebar]:not([hidden])');
  if (!pane) errors.push('Pa4 : panneau miniatures non visible');
  const thumb = await page.$('[data-papers-gnome-sidebar] .papers-app__thumb');
  if (!thumb) errors.push('Pa4 : vignette absente');
};

const SCENARIOS = { Pa1: scenarioPa1, Pa2: scenarioPa2, Pa3: scenarioPa3, Pa4: scenarioPa4 };

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
    console.error(`smoke-gnome-papers-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
  console.log(`✓ smoke-gnome-papers-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
