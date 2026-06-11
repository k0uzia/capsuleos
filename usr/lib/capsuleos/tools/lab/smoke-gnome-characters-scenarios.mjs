#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Characters (Ch1–Ch4 P0).
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

const openCharacters = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') window.openWindowByDataLink('characters');
  });
  await page.waitForSelector('.windowElement[data-link="characters"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeCharactersApp')?.dataset.charactersInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioCh1 = async (page, errors) => {
  await openCharacters(page);
  const glyph = await page.textContent('#gnome-characters-glyph');
  if (!String(glyph).includes('é')) errors.push(`Ch1 : é attendu, obtenu « ${glyph} »`);
  const title = await page.textContent('.gnome-characters__section-title');
  if (!String(title).includes('Récents')) errors.push(`Ch1 : Récents attendu, obtenu « ${title} »`);
};

const scenarioCh2 = async (page, errors) => {
  await openCharacters(page);
  await page.fill('[data-characters-gnome-action="search"]', 'euro');
  await page.waitForTimeout(150);
  const selected = await page.evaluate(() => document.getElementById('gnomeCharactersApp')?.dataset.charactersSelected);
  if (selected !== '€') errors.push(`Ch2 : € attendu, obtenu « ${selected} »`);
};

const scenarioCh3 = async (page, errors) => {
  await openCharacters(page);
  await page.click('[data-characters-gnome-glyph="©"]');
  await page.waitForTimeout(100);
  const selected = await page.evaluate(() => document.getElementById('gnomeCharactersApp')?.dataset.charactersSelected);
  if (selected !== '©') errors.push(`Ch3 : © attendu, obtenu « ${selected} »`);
  const code = await page.textContent('#gnome-characters-code');
  if (!String(code).includes('U+00A9')) errors.push(`Ch3 : U+00A9 attendu, obtenu « ${code} »`);
};

const scenarioCh4 = async (page, errors) => {
  await openCharacters(page);
  const disabled = await page.evaluate(() => document.querySelector('[data-characters-gnome-action="copy"]')?.disabled);
  if (disabled) errors.push('Ch4 : bouton Copier doit être actif');
  await page.click('[data-characters-gnome-action="copy"]');
  const copied = await page.evaluate(() => document.getElementById('gnomeCharactersApp')?.dataset.charactersCopied);
  if (copied !== 'é') errors.push(`Ch4 : charactersCopied=é attendu, obtenu « ${copied} »`);
};

const SCENARIOS = { Ch1: scenarioCh1, Ch2: scenarioCh2, Ch3: scenarioCh3, Ch4: scenarioCh4 };

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
    console.error(`smoke-gnome-characters-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-characters-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => { console.error(err); process.exit(1); });
