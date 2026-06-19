#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Missions CapsuleOS (Ck1–Ck4 P0) — slot `checklist`.
 * Capsule-only : pas d'app GNOME VM équivalente. Anti-régression Mint : dataset GNOME absent sur body#mint.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-checklist-scenarios.mjs --id linux-alma
 *   ... --scenario Ck1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_PROFILES = new Set(['linux-alma', 'linux-rocky', 'linux-fedora', 'linux-ubuntu']);
const CINNAMON_PROFILES = new Set(['linux-mint']);

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

const clearChecklistState = async (page) => {
  await page.evaluate(() => {
    const key = window.CAPSULE_CHECKLIST_STORAGE_KEY || 'mint-checklist';
    localStorage.removeItem(key);
  });
};

const openChecklist = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('checklist');
    }
  });
  await page.waitForSelector('.windowElement[data-link="checklist"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-checklist-gnome-root]');
      return root?.dataset?.checklistGnomeInit === 'true';
    },
    null,
    { timeout: 15000 },
  );
  await sleep(page, 350);
};

const readChecklistDataset = async (page) => page.evaluate(() => {
  const root = document.querySelector('[data-checklist-gnome-root]');
  return root ? { ...root.dataset } : {};
});

const scenarioCk1 = async (page, errors) => {
  await openChecklist(page);
  const ds = await readChecklistDataset(page);
  if (ds.checklistGnomeInit !== 'true') {
    errors.push('Ck1 : dataset.checklistGnomeInit=true attendu');
  }
  if (ds.checklistGnomeTaskCount !== '8') {
    errors.push(`Ck1 : taskCount=8 attendu, obtenu « ${ds.checklistGnomeTaskCount} »`);
  }
  const items = await page.locator('[data-checklist-gnome-item]').count();
  if (items !== 8) {
    errors.push(`Ck1 : 8 missions attendues, obtenu ${items}`);
  }
  const title = await page.textContent('.checklist-app__title');
  if (!String(title).includes('Missions')) {
    errors.push(`Ck1 : titre Missions attendu, obtenu « ${title} »`);
  }
  const desc = await page.textContent('.checklist-app__description');
  if (!String(desc).includes('AlmaLinux') && !String(desc).includes('missions')) {
    errors.push(`Ck1 : description pédagogique attendue, obtenu « ${desc} »`);
  }
  const winVisible = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="checklist"]');
    return win && getComputedStyle(win).display !== 'none';
  });
  if (!winVisible) {
    errors.push('Ck1 : fenêtre checklist visible attendue');
  }
};

const scenarioCk2 = async (page, errors) => {
  await openChecklist(page);
  const name = await page.textContent('[data-checklist-gnome-task-id="open-nemo"] .checklist-item__name');
  if (!String(name).toLowerCase().includes('explorateur')) {
    errors.push(`Ck2 : nom mission explorateur attendu, obtenu « ${name} »`);
  }
  const hint = await page.textContent('[data-checklist-gnome-task-id="open-nemo"] .checklist-item__hint');
  if (!String(hint).trim()) {
    errors.push('Ck2 : indice mission attendu');
  }
  const itemDone = await page.getAttribute('[data-checklist-gnome-task-id="open-nemo"]', 'data-checklist-gnome-item-done');
  if (itemDone !== 'false') {
    errors.push(`Ck2 : mission non cochée attendue, obtenu item-done « ${itemDone} »`);
  }
};

const scenarioCk3 = async (page, errors) => {
  await openChecklist(page);
  await page.click('[data-checklist-gnome-task-id="open-nemo"] [data-checklist-gnome-check]');
  await sleep(page, 200);
  const hasDoneClass = await page.evaluate(() =>
    document.querySelector('[data-checklist-gnome-task-id="open-nemo"]')?.classList.contains('is-done'),
  );
  if (!hasDoneClass) {
    errors.push('Ck3 : classe is-done attendue sur la mission cochée');
  }
  const aria = await page.getAttribute('[data-checklist-gnome-task-id="open-nemo"] [data-checklist-gnome-check]', 'aria-checked');
  if (aria !== 'true') {
    errors.push(`Ck3 : aria-checked=true attendu, obtenu « ${aria} »`);
  }
  const ds = await readChecklistDataset(page);
  if (ds.checklistGnomeDoneCount !== '1') {
    errors.push(`Ck3 : doneCount=1 attendu, obtenu « ${ds.checklistGnomeDoneCount} »`);
  }
  const itemDone = await page.getAttribute('[data-checklist-gnome-task-id="open-nemo"]', 'data-checklist-gnome-item-done');
  if (itemDone !== 'true') {
    errors.push(`Ck3 : dataset item-done=true attendu, obtenu « ${itemDone} »`);
  }
};

const scenarioCk4 = async (page, errors) => {
  await openChecklist(page);
  await page.click('[data-checklist-gnome-task-id="open-nemo"] [data-checklist-gnome-check]');
  await sleep(page, 200);
  const label = await page.textContent('[data-checklist-gnome-progress-label]');
  if (!String(label).includes('1 / 8')) {
    errors.push(`Ck4 : libellé 1 / 8 attendu, obtenu « ${label} »`);
  }
  const ds = await readChecklistDataset(page);
  if (ds.checklistGnomeProgress !== '13') {
    errors.push(`Ck4 : progress=13 attendu, obtenu « ${ds.checklistGnomeProgress} »`);
  }
  const ariaNow = await page.getAttribute('[data-checklist-gnome-progressbar]', 'aria-valuenow');
  if (ariaNow !== '13') {
    errors.push(`Ck4 : aria-valuenow=13 attendu, obtenu « ${ariaNow} »`);
  }
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
  await openChecklist(page);
  const dsAfter = await readChecklistDataset(page);
  if (dsAfter.checklistGnomeDoneCount !== '1') {
    errors.push(`Ck4 : persistance doneCount=1 attendue après reload, obtenu « ${dsAfter.checklistGnomeDoneCount} »`);
  }
  const stillDone = await page.evaluate(() =>
    document.querySelector('[data-checklist-gnome-task-id="open-nemo"]')?.classList.contains('is-done'),
  );
  if (!stillDone) {
    errors.push('Ck4 : mission cochée persistée attendue après reload');
  }
};

const SCENARIOS = {
  Ck1: scenarioCk1,
  Ck2: scenarioCk2,
  Ck3: scenarioCk3,
  Ck4: scenarioCk4,
};

const smokeMintAntiRegression = async (page, errors) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('checklist');
    }
  });
  await sleep(page, 900);
  const state = await page.evaluate(() => {
    const root = document.querySelector('[data-checklist-gnome-root]');
    return {
      bodyId: document.body.id,
      init: root?.dataset?.initialized === 'true' || root?.dataset?.checklistGnomeInit === 'true',
      gnomeDataset: root && root.dataset.checklistGnomeInit === 'true',
      title: document.querySelector('.checklist-app__title')?.textContent || '',
    };
  });
  if (state.bodyId !== 'mint') {
    errors.push(`Mint : body#mint attendu, obtenu « ${state.bodyId} »`);
  }
  if (!state.init) {
    errors.push('Mint : kernel checklist doit s\'initialiser');
  }
  if (state.gnomeDataset) {
    errors.push('Mint : dataset checklistGnomeInit actif (fuite chrome GNOME Alma/Rocky)');
  }
  if (!state.title.includes('Missions')) {
    errors.push(`Mint : titre Missions attendu, obtenu « ${state.title} »`);
  }
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

  if (CINNAMON_PROFILES.has(opts.id)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
      await smokeMintAntiRegression(page, errors);
    } catch (err) {
      errors.push(`Mint anti-régression : ${err.message}`);
    } finally {
      await page.close();
    }
  } else if (!GNOME_PROFILES.has(opts.id)) {
    errors.push(`${opts.id} : profil non supporté (GNOME ou Mint attendu)`);
  } else {
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
        await clearChecklistState(page);
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
  }

  await browser.close();

  if (errors.length) {
    console.error(`smoke-gnome-checklist-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (CINNAMON_PROFILES.has(opts.id)) {
    console.log(`✓ smoke-gnome-checklist-scenarios ${opts.id} OK — anti-régression checklist Mint`);
  } else {
    const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
    console.log(`✓ smoke-gnome-checklist-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
