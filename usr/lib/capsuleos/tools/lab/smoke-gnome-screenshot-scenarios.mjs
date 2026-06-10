#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques Capture d'écran GNOME (Sc1–Sc4 P0, Capsule-only).
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

const openScreenshot = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') window.openWindowByDataLink('screenshot');
  });
  await page.waitForSelector('.windowElement[data-link="screenshot"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeScreenshotApp')?.dataset.shotInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioSc1 = async (page, errors) => {
  await openScreenshot(page);
  const phase = await page.evaluate(() => document.getElementById('gnomeScreenshotApp')?.dataset.shotPhase);
  if (phase !== 'config') errors.push(`Sc1 : shotPhase=config attendu, obtenu « ${phase} »`);
  const title = await page.textContent('.gnome-shot__title');
  if (!String(title).includes('Capture')) errors.push(`Sc1 : titre Capture attendu, obtenu « ${title} »`);
};

const scenarioSc2 = async (page, errors) => {
  await openScreenshot(page);
  await page.click('input[name="gnome-shot-area"][value="window"]');
  await page.waitForTimeout(100);
  const area = await page.evaluate(() => document.getElementById('gnomeScreenshotApp')?.dataset.shotArea);
  if (area !== 'window') errors.push(`Sc2 : shotArea=window attendu, obtenu « ${area} »`);
};

const scenarioSc3 = async (page, errors) => {
  await openScreenshot(page);
  await page.click('[data-shot-gnome-action="capture"]');
  await page.waitForFunction(
    () => document.getElementById('gnomeScreenshotApp')?.dataset.shotPhase === 'result',
    null,
    { timeout: 10000 },
  );
  const src = await page.getAttribute('#gnome-shot-preview', 'src');
  if (!src || !src.startsWith('data:image')) errors.push('Sc3 : aperçu data:image attendu');
};

const scenarioSc4 = async (page, errors) => {
  await openScreenshot(page);
  await page.click('[data-shot-gnome-action="capture"]');
  await page.waitForFunction(
    () => document.getElementById('gnomeScreenshotApp')?.dataset.shotPhase === 'result',
    null,
    { timeout: 10000 },
  );
  await page.click('[data-shot-gnome-action="new"]');
  await page.waitForTimeout(100);
  const phase = await page.evaluate(() => document.getElementById('gnomeScreenshotApp')?.dataset.shotPhase);
  if (phase !== 'config') errors.push(`Sc4 : shotPhase=config attendu, obtenu « ${phase} »`);
};

const SCENARIOS = { Sc1: scenarioSc1, Sc2: scenarioSc2, Sc3: scenarioSc3, Sc4: scenarioSc4 };

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) { console.error('✗ CAPSULE_HTTP_BASE requis'); process.exit(1); }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, ...(defaultChrome ? { executablePath: defaultChrome } : {}) });
  const url = resolveCapsuleOsUrl(opts.id, base);
  const errors = [];
  const runList = opts.scenario ? [opts.scenario] : Object.keys(SCENARIOS);
  for (const scenarioId of runList) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
      await SCENARIOS[scenarioId](page, errors);
      if (!errors.some((e) => e.startsWith(scenarioId))) process.stdout.write(`  ✓ ${scenarioId}\n`);
    } catch (err) {
      errors.push(`${scenarioId} : ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  if (errors.length) {
    console.error(`smoke-gnome-screenshot-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-screenshot-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => { console.error(err); process.exit(1); });
