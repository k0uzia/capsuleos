#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME LibreOffice Writer (Lw1–Lw4 P0) — slot `librewriter`.
 * Anti-régression : slot distinct de `text_editor` ; Mint conserve kernel Writer sans fuite dataset GNOME Alma.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-librewriter-scenarios.mjs --id linux-alma
 *   ... --scenario Lw1
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

const openLibrewriter = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('librewriter');
    }
  });
  await page.waitForFunction(
    () => {
      const app = document.getElementById('lw-app');
      return app?.dataset?.lwInit === '1' && app?.dataset?.librewriterGnomeInit === 'true';
    },
    null,
    { timeout: 15000 },
  );
  await sleep(page, 450);
};

const readWriterDataset = async (page) => page.evaluate(() => {
  const root = document.querySelector('[data-librewriter-gnome-root]');
  return root ? { ...root.dataset } : {};
});

const typeInPage = async (page, text) => {
  await page.click('[data-librewriter-gnome-page]');
  await page.fill('[data-librewriter-gnome-page]', text);
  await sleep(page, 300);
};

const scenarioLw1 = async (page, errors) => {
  await openLibrewriter(page);
  const ds = await readWriterDataset(page);
  if (ds.librewriterGnomeInit !== 'true') {
    errors.push('Lw1 : dataset.librewriterGnomeInit=true attendu');
  }
  if (ds.librewriterGnomeChrome !== 'libreoffice24') {
    errors.push(`Lw1 : chrome libreoffice24 attendu, obtenu « ${ds.librewriterGnomeChrome} »`);
  }
  if (!String(ds.librewriterGnomeTitle || '').includes('Sans nom 1')) {
    errors.push(`Lw1 : titre Sans nom 1 attendu, obtenu « ${ds.librewriterGnomeTitle} »`);
  }
  const menubar = await page.locator('[data-librewriter-gnome-menubar] .lw-menu__trigger').count();
  if (menubar < 8) {
    errors.push(`Lw1 : barre menus ≥ 8 entrées attendue, obtenu ${menubar}`);
  }
  const toolbarStd = await page.locator('[data-librewriter-gnome-toolbar-std]').count();
  const toolbarFmt = await page.locator('[data-librewriter-gnome-toolbar-fmt]').count();
  if (toolbarStd === 0 || toolbarFmt === 0) {
    errors.push('Lw1 : barres Standard et Formatage attendues');
  }
  const pageEditable = await page.evaluate(() => {
    const el = document.querySelector('[data-librewriter-gnome-page]');
    return el && el.getAttribute('contenteditable') === 'true';
  });
  if (!pageEditable) {
    errors.push('Lw1 : zone document contenteditable attendue');
  }
  const winTitle = await page.textContent('div[data-link="librewriter"] #windowTitle');
  if (!String(winTitle).includes('LibreOffice Writer')) {
    errors.push(`Lw1 : titre fenêtre LibreOffice Writer attendu, obtenu « ${winTitle} »`);
  }
};

const scenarioLw2 = async (page, errors) => {
  await openLibrewriter(page);
  await typeInPage(page, 'CapsuleOS AlmaLinux');
  const ds = await readWriterDataset(page);
  if (ds.librewriterGnomeDirty !== 'true') {
    errors.push(`Lw2 : dirty=true attendu, obtenu « ${ds.librewriterGnomeDirty} »`);
  }
  const words = parseInt(ds.librewriterGnomeWordCount || '0', 10);
  if (words < 2) {
    errors.push(`Lw2 : ≥ 2 mots attendus, obtenu ${words}`);
  }
  const chars = parseInt(ds.librewriterGnomeCharCount || '0', 10);
  if (chars < 10) {
    errors.push(`Lw2 : caractères saisis attendus, obtenu ${chars}`);
  }
  const pageText = await page.textContent('[data-librewriter-gnome-page]');
  if (!String(pageText).includes('CapsuleOS')) {
    errors.push(`Lw2 : texte saisi absent, obtenu « ${pageText} »`);
  }
};

const scenarioLw3 = async (page, errors) => {
  await openLibrewriter(page);
  await typeInPage(page, 'Titre Capsule');
  await page.evaluate(() => {
    const pageEl = document.getElementById('lw-page');
    if (!pageEl) return;
    const range = document.createRange();
    range.selectNodeContents(pageEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.click('#btn-bold');
  await sleep(page, 350);
  const state = await page.evaluate(() => ({
    boldActive: document.querySelector('#btn-bold')?.classList.contains('lw-tb-btn--active'),
    dirty: document.querySelector('[data-librewriter-gnome-root]')?.dataset?.librewriterGnomeDirty,
    html: document.getElementById('lw-page')?.innerHTML || '',
  }));
  if (!state.boldActive) {
    errors.push('Lw3 : bouton gras actif attendu');
  }
  if (state.dirty !== 'true') {
    errors.push(`Lw3 : dirty=true attendu après formatage, obtenu « ${state.dirty} »`);
  }
  if (!/<b>|<strong>/i.test(state.html)) {
    errors.push('Lw3 : balise gras dans le document attendue');
  }
};

const scenarioLw4 = async (page, errors) => {
  await openLibrewriter(page);
  await typeInPage(page, 'Document pédagogique');
  await page.click('[data-librewriter-gnome-toolbar-std] [data-librewriter-gnome-action="save"]');
  await sleep(page, 350);
  let ds = await readWriterDataset(page);
  if (ds.librewriterGnomeSaved !== 'true') {
    errors.push(`Lw4 : saved=true attendu, obtenu « ${ds.librewriterGnomeSaved} »`);
  }
  if (!String(ds.librewriterGnomeFileName || '').includes('.odt')) {
    errors.push(`Lw4 : nom fichier .odt attendu, obtenu « ${ds.librewriterGnomeFileName} »`);
  }
  const titleSaved = await page.textContent('div[data-link="librewriter"] #windowTitle');
  if (!String(titleSaved).includes('.odt')) {
    errors.push(`Lw4 : titre avec .odt attendu, obtenu « ${titleSaved} »`);
  }
  await page.click('[data-librewriter-gnome-toolbar-std] [data-librewriter-gnome-action="new"]');
  await sleep(page, 350);
  ds = await readWriterDataset(page);
  if (ds.librewriterGnomeDocNumber !== '2') {
    errors.push(`Lw4 : docNumber=2 attendu, obtenu « ${ds.librewriterGnomeDocNumber} »`);
  }
  if (ds.librewriterGnomeWordCount !== '0') {
    errors.push(`Lw4 : page vide (0 mot) attendue, obtenu « ${ds.librewriterGnomeWordCount} »`);
  }
  const pageText = await page.textContent('[data-librewriter-gnome-page]');
  if (String(pageText).trim().length > 0) {
    errors.push(`Lw4 : page vide attendue après nouveau document, obtenu « ${pageText} »`);
  }
};

const SCENARIOS = {
  Lw1: scenarioLw1,
  Lw2: scenarioLw2,
  Lw3: scenarioLw3,
  Lw4: scenarioLw4,
};

const smokeMintAntiRegression = async (page, errors) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('librewriter');
    }
  });
  await sleep(page, 900);
  const state = await page.evaluate(() => {
    const app = document.getElementById('lw-app');
    const root = document.querySelector('[data-librewriter-gnome-root]');
    const textEditorWin = document.querySelector('.windowElement[data-link="text_editor"]');
    return {
      bodyId: document.body.id,
      lwInit: app && app.dataset.lwInit === '1',
      gnomeDataset: root && root.dataset.librewriterGnomeInit === 'true',
      title: document.querySelector('div[data-link="librewriter"] #windowTitle')?.textContent || '',
      textEditorDistinct: !textEditorWin || textEditorWin.dataset.link === 'text_editor',
    };
  });
  if (state.bodyId !== 'mint') {
    errors.push(`Mint : body#mint attendu, obtenu « ${state.bodyId} »`);
  }
  if (!state.lwInit) {
    errors.push('Mint : kernel Writer doit s\'initialiser');
  }
  if (state.gnomeDataset) {
    errors.push('Mint : dataset librewriterGnomeInit actif (fuite chrome GNOME Alma/Rocky)');
  }
  if (!state.title.includes('LibreOffice Writer')) {
    errors.push(`Mint : titre Writer attendu, obtenu « ${state.title} »`);
  }
  if (!state.textEditorDistinct) {
    errors.push('Mint : slot text_editor ne doit pas être confondu avec librewriter');
  }
};

const smokeTextEditorDistinct = async (page, errors, registryId) => {
  if (!GNOME_PROFILES.has(registryId)) return;
  const state = await page.evaluate(() => ({
    writerLink: document.querySelector('.windowElement[data-link="librewriter"]')?.dataset?.link,
    editorLink: document.querySelector('.windowElement[data-link="text_editor"]')?.dataset?.link,
  }));
  if (state.writerLink !== 'librewriter') {
    errors.push('Anti-régression : data-link librewriter attendu');
  }
  if (state.editorLink !== 'text_editor') {
    errors.push('Anti-régression : slot text_editor distinct requis');
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
        await smokeTextEditorDistinct(page, errors, opts.id);
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
    console.error(`smoke-gnome-librewriter-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (CINNAMON_PROFILES.has(opts.id)) {
    console.log(`✓ smoke-gnome-librewriter-scenarios ${opts.id} OK — anti-régression Writer Mint`);
  } else {
    const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
    console.log(`✓ smoke-gnome-librewriter-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
