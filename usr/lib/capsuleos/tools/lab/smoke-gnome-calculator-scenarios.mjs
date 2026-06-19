#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Calculatrice (C1–C4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-calculator-scenarios.mjs --id linux-alma
 *   ... --scenario C1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_CALC_SESSION_KEY = 'capsule-gnome-calculator-session';

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

const clickCalc = async (page, selector) => {
  await page.click(selector);
  await sleep(page, 60);
};

const openCalculator = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('calculator');
    }
  });
  await page.waitForSelector('.windowElement[data-link="calculator"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#gnomeCalculatorApp', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('gnomeCalculatorApp')?.dataset.calcInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const resetCalculator = async (page) => {
  await page.evaluate((key) => {
    window.sessionStorage.removeItem(key);
    const root = document.getElementById('gnomeCalculatorApp');
    if (root) {
      const clearBtn = document.querySelector('[data-calc="clear"]');
      if (clearBtn) clearBtn.click();
    }
  }, GNOME_CALC_SESSION_KEY);
  await sleep(page, 100);
};

const scenarioC1 = async (page, errors) => {
  await openCalculator(page);
  await clickCalc(page, '[data-calc="digit"][data-digit="2"]');
  await clickCalc(page, '[data-calc="op"][data-op="+"]');
  await clickCalc(page, '[data-calc="digit"][data-digit="2"]');
  await clickCalc(page, '[data-calc="equals"]');
  const value = await page.textContent('[data-calc-gnome-display]');
  if (String(value).trim() !== '4') {
    errors.push(`C1 : résultat 4 attendu, obtenu « ${value} »`);
  }
};

const scenarioC2 = async (page, errors) => {
  await openCalculator(page);
  await clickCalc(page, '[data-calc="digit"][data-digit="5"]');
  await clickCalc(page, '[data-calc="op"][data-op="*"]');
  await clickCalc(page, '[data-calc="digit"][data-digit="3"]');
  await clickCalc(page, '[data-calc="equals"]');
  const mid = await page.textContent('[data-calc-gnome-display]');
  if (String(mid).trim() !== '15') {
    errors.push(`C2 : 5×3=15 attendu avant effacement, obtenu « ${mid} »`);
  }
  await clickCalc(page, '[data-calc="clear"]');
  const cleared = await page.textContent('[data-calc-gnome-display]');
  if (String(cleared).trim() !== '0') {
    errors.push(`C2 : affichage 0 après C attendu, obtenu « ${cleared} »`);
  }
  await clickCalc(page, '[data-calc="digit"][data-digit="9"]');
  await clickCalc(page, '[data-calc="backspace"]');
  const afterBack = await page.textContent('[data-calc-gnome-display]');
  if (String(afterBack).trim() !== '0') {
    errors.push(`C2 : retour arrière vers 0 attendu, obtenu « ${afterBack} »`);
  }
};

const scenarioC3 = async (page, errors) => {
  await openCalculator(page);
  await clickCalc(page, '#gnome-calc-mode');
  await page.waitForSelector('#gnome-calc-mode-popover:not([hidden])', { timeout: 5000 });
  await clickCalc(page, '[data-calc-mode="advanced"]');
  const label = await page.textContent('#gnome-calc-mode-label');
  if (String(label).trim() !== 'Avancé') {
    errors.push(`C3 : libellé « Avancé » attendu, obtenu « ${label} »`);
  }
  const advancedVisible = await page.evaluate(() => {
    const pad = document.getElementById('gnome-calc-keypad-advanced');
    return pad && !pad.hidden;
  });
  if (!advancedVisible) {
    errors.push('C3 : pavé scientifique visible attendu');
  }
  const mode = await page.evaluate(() => document.getElementById('gnomeCalculatorApp')?.dataset.calcGnomeMode);
  if (mode !== 'advanced') {
    errors.push(`C3 : dataset.calcGnomeMode=advanced attendu, obtenu « ${mode} »`);
  }
};

const scenarioC4 = async (page, errors) => {
  await openCalculator(page);
  await clickCalc(page, '[data-calc="digit"][data-digit="7"]');
  await clickCalc(page, '[data-calc="op"][data-op="*"]');
  await clickCalc(page, '[data-calc="digit"][data-digit="8"]');
  await clickCalc(page, '[data-calc="equals"]');
  const before = await page.textContent('[data-calc-gnome-display]');
  if (String(before).trim() !== '56') {
    errors.push(`C4 : 7×8=56 attendu avant copie, obtenu « ${before} »`);
  }
  await page.evaluate(() => {
    document.querySelector('[data-calc-gnome-action="copy-result"]')?.click();
  });
  await page.waitForSelector('[data-calc-gnome-toast]:not([hidden])', { timeout: 5000 });
  const copied = await page.evaluate(() => document.getElementById('gnomeCalculatorApp')?.dataset.calcGnomeCopied);
  if (copied !== 'true') {
    errors.push('C4 : dataset.calcGnomeCopied=true attendu');
  }
};

const SCENARIOS = {
  C1: scenarioC1,
  C2: scenarioC2,
  C3: scenarioC3,
  C4: scenarioC4,
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
      await resetCalculator(page);
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
    console.error(`smoke-gnome-calculator-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-calculator-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
