#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Snapshot (Sn1–Sn4 P0).
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

const openSnapshot = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('snapshot');
    }
  });
  await page.waitForSelector('.windowElement[data-link="snapshot"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeSnapshotApp')?.dataset.snapshotInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioSn1 = async (page, errors) => {
  await openSnapshot(page);
  const mode = await page.evaluate(() => document.getElementById('gnomeSnapshotApp')?.dataset.snapshotMode);
  if (mode !== 'photo') errors.push('Sn1 : snapshotMode=photo attendu');
  const tab = await page.$('[data-snapshot-gnome-mode="photo"].is-active');
  if (!tab) errors.push('Sn1 : onglet Photo actif attendu');
};

const scenarioSn2 = async (page, errors) => {
  await openSnapshot(page);
  await page.click('[data-snapshot-gnome-mode="video"]');
  await page.waitForTimeout(120);
  const mode = await page.evaluate(() => document.getElementById('gnomeSnapshotApp')?.dataset.snapshotMode);
  if (mode !== 'video') errors.push('Sn2 : snapshotMode=video attendu');
};

const scenarioSn3 = async (page, errors) => {
  await openSnapshot(page);
  const camera = await page.evaluate(() => document.getElementById('gnomeSnapshotApp')?.dataset.snapshotCamera);
  if (camera !== 'none') errors.push('Sn3 : snapshotCamera=none attendu');
  const title = await page.textContent('#gnome-snapshot-empty-title');
  if (!String(title).toLowerCase().includes('caméra')) errors.push(`Sn3 : titre caméra attendu, obtenu « ${title} »`);
};

const scenarioSn4 = async (page, errors) => {
  await openSnapshot(page);
  const photo = await page.textContent('#gnome-snapshot-tab-photo');
  const video = await page.textContent('#gnome-snapshot-tab-video');
  if (!String(photo).includes('Photo')) errors.push(`Sn4 : Photo attendu, obtenu « ${photo} »`);
  if (!String(video).includes('Vidéo')) errors.push(`Sn4 : Vidéo attendu, obtenu « ${video} »`);
};

const SCENARIOS = { Sn1: scenarioSn1, Sn2: scenarioSn2, Sn3: scenarioSn3, Sn4: scenarioSn4 };

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, ...(defaultChrome ? { executablePath: defaultChrome } : {}) });
  const url = resolveCapsuleOsUrl(opts.id, base);
  const errors = [];
  const runList = opts.scenario ? [opts.scenario] : Object.keys(SCENARIOS);
  for (const scenarioId of runList) {
    const fn = SCENARIOS[scenarioId];
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
      await fn(page, errors);
      if (!errors.some((e) => e.startsWith(scenarioId))) process.stdout.write(`  ✓ ${scenarioId}\n`);
    } catch (err) {
      errors.push(`${scenarioId} : ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  if (errors.length) {
    console.error(`smoke-gnome-snapshot-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-snapshot-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => { console.error(err); process.exit(1); });
