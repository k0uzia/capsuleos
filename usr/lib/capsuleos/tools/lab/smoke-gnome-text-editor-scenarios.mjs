#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Text Editor (T1–T4 P0).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-text-editor-scenarios.mjs --id linux-alma
 *   ... --scenario T1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_TE_SESSION_KEY = 'capsule-gnome-text-editor-session';

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

const clickTeAction = async (page, action) => {
  await page.evaluate((actionId) => {
    const el = document.querySelector('[data-te-gnome-action="' + actionId + '"]');
    if (el) el.click();
  }, action);
};
const sleep = (page, ms) => page.waitForTimeout(ms);

const resetEditorState = async (page) => {
  await page.evaluate((key) => {
    window.sessionStorage.removeItem(key);
  }, GNOME_TE_SESSION_KEY);
};

const openTextEditor = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('text_editor');
    }
  });
  await page.waitForSelector('.windowElement[data-link="text_editor"]', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#xedApp.text-editor--gnome', { timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('xedApp')?.dataset.xedInit === 'true',
    null,
    { timeout: 8000 },
  );
};

const scenarioT1 = async (page, errors) => {
  await openTextEditor(page);
  await page.fill('[data-te-gnome-area]', 'Bonjour CapsuleOS');
  await sleep(page, 200);
  const title = await page.textContent('div[data-link="text_editor"] #windowTitle');
  if (!String(title).includes('Document sans titre')) {
    errors.push('T1 : titre « Document sans titre » attendu');
  }
  if (!String(title).startsWith('*')) {
    errors.push('T1 : marqueur modification (*) attendu dans le titre');
  }
  const dirty = await page.evaluate(() => document.getElementById('xedApp')?.dataset.teGnomeDirty);
  if (dirty !== 'true') {
    errors.push('T1 : dataset.teGnomeDirty=true attendu');
  }
};

const scenarioT2 = async (page, errors) => {
  await openTextEditor(page);
  await clickTeAction(page, 'open-vfs');
  await page.waitForFunction(
    () => {
      const area = document.querySelector('[data-te-gnome-area]');
      return area && area.value.includes('Introduction à Bash');
    },
    null,
    { timeout: 8000 },
  );
  const title = await page.textContent('div[data-link="text_editor"] #windowTitle');
  if (!String(title).includes('introduction-bash.txt')) {
    errors.push('T2 : titre introduction-bash.txt attendu');
  }
};

const scenarioT3 = async (page, errors) => {
  await openTextEditor(page);
  await page.fill('[data-te-gnome-area]', 'Contenu pédagogique');
  await clickTeAction(page, 'save-as');
  await page.waitForSelector('[data-te-gnome-save-dialog]:not([hidden])', { timeout: 5000 });
  await page.fill('#xed-save-path', '~/Documents/lecon-capsule.txt');
  await clickTeAction(page, 'save-apply');
  await page.waitForSelector('[data-te-gnome-toast]:not([hidden])', { timeout: 5000 });
  const dirty = await page.evaluate(() => document.getElementById('xedApp')?.dataset.teGnomeDirty);
  if (dirty !== 'false') {
    errors.push('T3 : document propre après enregistrement');
  }
  const title = await page.textContent('div[data-link="text_editor"] #windowTitle');
  if (!String(title).includes('lecon-capsule.txt')) {
    errors.push('T3 : titre lecon-capsule.txt attendu');
  }
};

const scenarioT4 = async (page, errors) => {
  await openTextEditor(page);
  await page.fill('[data-te-gnome-area]', 'Onglet un');
  await clickTeAction(page, 'new-tab');
  await sleep(page, 250);
  await page.fill('[data-te-gnome-area]', 'Onglet deux');
  const tabCount = await page.evaluate(() => document.getElementById('xedApp')?.dataset.teGnomeTabCount);
  if (tabCount !== '2') {
    errors.push('T4 : deux onglets attendus');
  }
  await clickTeAction(page, 'close-tab');
  await sleep(page, 250);
  const value = await page.inputValue('[data-te-gnome-area]');
  if (!String(value).includes('Onglet un')) {
    errors.push('T4 : contenu du premier onglet attendu après fermeture');
  }
  const tabCountAfter = await page.evaluate(() => document.getElementById('xedApp')?.dataset.teGnomeTabCount);
  if (tabCountAfter !== '1') {
    errors.push('T4 : un seul onglet après fermeture');
  }
};

const SCENARIOS = {
  T1: scenarioT1,
  T2: scenarioT2,
  T3: scenarioT3,
  T4: scenarioT4,
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
      await resetEditorState(page);
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
    console.error(`smoke-gnome-text-editor-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-text-editor-scenarios ${opts.id} OK — ${runList.length} scénario(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
