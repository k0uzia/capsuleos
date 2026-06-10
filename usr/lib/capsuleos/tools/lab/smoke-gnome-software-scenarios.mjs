#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Software (S1–S4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs --id linux-alma
 *   ... --scenario S1   # un seul scénario
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_INSTALLED_KEY = 'capsule-gnome-software-installed';

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

const resetSoftwareState = async (page) => {
  await page.evaluate((key) => {
    window.sessionStorage.removeItem(key);
  }, GNOME_INSTALLED_KEY);
};

const openSoftware = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('update_manager');
    }
  });
  await page.waitForSelector('.windowElement[data-link="update_manager"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#updateManagerApp.update-manager--gnome', { timeout: 10000 });
};

const waitInstallComplete = async (page) => {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('updateManagerApp');
      return root && root.dataset.umGnomeInstalling === 'false'
        && root.querySelector('.gnome-software__detail-install')?.textContent === 'Ouvrir';
    },
    null,
    { timeout: 15000 },
  );
};

const scenarioS1 = async (page, errors) => {
  await openSoftware(page);
  await page.click('[data-um-gnome-app="libreoffice-writer"]');
  await page.waitForSelector('[data-um-gnome-pane="detail"]:not([hidden])');
  const before = await page.textContent('.gnome-software__detail-install');
  if (!String(before).includes('Installer')) {
    errors.push('S1 : bouton Installer attendu avant installation');
    return;
  }
  await page.click('[data-um-gnome-action="install"]');
  await waitInstallComplete(page);
  const after = await page.textContent('.gnome-software__detail-install');
  if (!String(after).includes('Ouvrir')) {
    errors.push('S1 : bouton Ouvrir attendu après installation');
    return;
  }
  await page.click('[data-um-gnome-action="install"]');
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="librewriter"]');
      return win && getComputedStyle(win).display !== 'none';
    },
    null,
    { timeout: 8000 },
  );
};

const scenarioS2 = async (page, errors) => {
  await openSoftware(page);
  await page.fill('[data-um-gnome-search]', 'writer');
  await page.waitForSelector('[data-um-gnome-pane="search"]:not([hidden])');
  await page.click('[data-um-gnome-search-grid] [data-um-gnome-app="libreoffice-writer"]');
  await page.waitForSelector('[data-um-gnome-pane="detail"]:not([hidden])');
  const btn = await page.textContent('.gnome-software__detail-install');
  if (!String(btn).includes('Installer')) {
    errors.push('S2 : fiche recherche doit proposer Installer');
    return;
  }
  await page.click('[data-um-gnome-action="install"]');
  await waitInstallComplete(page);
};

const scenarioS3 = async (page, errors) => {
  await openSoftware(page);
  await page.click('[data-um-gnome-nav="updates"]');
  await page.waitForSelector('[data-um-gnome-pane="updates"]:not([hidden])');
  const rowsBefore = await page.$$('[data-um-gnome-updates-list] .gnome-software__update-row');
  if (!rowsBefore.length) {
    errors.push('S3 : mises à jour attendues avant « Tout mettre à jour »');
    return;
  }
  await page.click('[data-um-gnome-action="updateAll"]');
  await page.waitForSelector('[data-um-gnome-updates-empty]:not([hidden])', { timeout: 8000 });
  const subtitle = await page.evaluate(() => {
    const el = document.querySelector('[data-um-gnome-pane="updates"] [data-um-gnome-updates-subtitle]')
      || document.querySelector('[data-um-gnome-pane="updates"] .gnome-software__subtitle');
    return el ? el.textContent : '';
  });
  if (!String(subtitle).toLowerCase().includes('à jour')) {
    errors.push('S3 : sous-titre « système à jour » attendu');
  }
};

const scenarioS4 = async (page, errors) => {
  await openSoftware(page);
  await page.click('[data-um-gnome-nav="installed"]');
  await page.waitForSelector('[data-um-gnome-pane="installed"]:not([hidden])');
  const openBtn = await page.$('[data-um-gnome-installed-list] [data-um-gnome-action="open"][data-um-gnome-app="firefox"]');
  if (!openBtn) {
    errors.push('S4 : bouton Ouvrir Firefox absent dans Installées');
    return;
  }
  await openBtn.click();
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="firefox"]');
      return win && getComputedStyle(win).display !== 'none';
    },
    null,
    { timeout: 8000 },
  );
};

const SCENARIOS = {
  S1: scenarioS1,
  S2: scenarioS2,
  S3: scenarioS3,
  S4: scenarioS4,
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
      await resetSoftwareState(page);
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
    console.error(`smoke-gnome-software-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-software-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
