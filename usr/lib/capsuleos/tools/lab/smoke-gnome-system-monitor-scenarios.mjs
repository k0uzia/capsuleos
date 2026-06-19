#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME System Monitor (Sm1–Sm4 P0).
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

const openSysmon = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') window.openWindowByDataLink('system_monitor');
  });
  await page.waitForSelector('.windowElement[data-link="system_monitor"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => document.getElementById('systemMonitorApp')?.dataset.gsmInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioSm1 = async (page, errors) => {
  await openSysmon(page);
  const tab = await page.evaluate(() => document.getElementById('systemMonitorApp')?.dataset.gsmActiveTab);
  if (tab !== 'processes') errors.push(`Sm1 : gsmActiveTab=processes attendu, obtenu « ${tab} »`);
  const rows = await page.$$('#gsm-process-body tr');
  if (!rows.length) errors.push('Sm1 : lignes processus attendues');
};

const scenarioSm2 = async (page, errors) => {
  await openSysmon(page);
  await page.click('[data-gsm-gnome-tab="resources"]');
  await page.waitForTimeout(200);
  const tab = await page.evaluate(() => document.getElementById('systemMonitorApp')?.dataset.gsmActiveTab);
  if (tab !== 'resources') errors.push(`Sm2 : gsmActiveTab=resources attendu, obtenu « ${tab} »`);
  const chart = await page.$('#gsm-cpu-chart .gsm-app__cpu-bars');
  if (!chart) errors.push('Sm2 : graphique CPU attendu');
};

const scenarioSm3 = async (page, errors) => {
  await openSysmon(page);
  await page.click('[data-gsm-gnome-action="search"]');
  await page.fill('#gsm-search', 'firefox');
  await page.waitForTimeout(150);
  const text = await page.textContent('#gsm-process-body');
  if (!String(text).toLowerCase().includes('firefox')) errors.push('Sm3 : processus firefox attendu');
};

const scenarioSm4 = async (page, errors) => {
  await openSysmon(page);
  await page.click('[data-gsm-gnome-tab="filesystems"]');
  await page.waitForTimeout(150);
  const tab = await page.evaluate(() => document.getElementById('systemMonitorApp')?.dataset.gsmActiveTab);
  if (tab !== 'filesystems') errors.push(`Sm4 : gsmActiveTab=filesystems attendu, obtenu « ${tab} »`);
  const rows = await page.$$('#gsm-fs-body tr');
  if (!rows.length) errors.push('Sm4 : montages FS attendus');
};

const SCENARIOS = { Sm1: scenarioSm1, Sm2: scenarioSm2, Sm3: scenarioSm3, Sm4: scenarioSm4 };

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
    console.error(`smoke-gnome-system-monitor-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-system-monitor-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => { console.error(err); process.exit(1); });
