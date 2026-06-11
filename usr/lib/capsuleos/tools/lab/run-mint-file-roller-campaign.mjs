#!/usr/bin/env node
/**
 * Campagne fidélité File Roller (App P1) — flux linéaire :5501.
 *
 * Usage :
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html \
 *     node usr/lib/capsuleos/tools/lab/run-mint-file-roller-campaign.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  chromePath,
  MINT_VIEWPORT,
  openMintSlot,
  waitMintReady,
} from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const SCENARIOS_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/file-roller-scenarios.json',
);
const OUT_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/file-roller-campaign-capsule.json',
);

const writeOut = process.argv.includes('--write');

const readState = async (page) => page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  const wmHeader = win?.querySelector('#windowHeader');
  const wmStyle = wmHeader && window.getComputedStyle(wmHeader);
  const rows = document.querySelectorAll('#fr-list-body tr');
  const headerbar = document.querySelector('.fr-app__headerbar');
  const nav = document.getElementById('fr-nav-row');
  const colName = document.querySelector('.fr-app__col--name');
  const tableWrap = document.getElementById('fr-list-wrap');
  const box = win ? win.getBoundingClientRect() : null;
  const hb = headerbar ? headerbar.getBoundingClientRect() : null;
  const tableBox = tableWrap && !tableWrap.hidden ? tableWrap.getBoundingClientRect() : null;
  const colBox = colName ? colName.getBoundingClientRect() : null;
  return {
    winVisible: win && win.style.display !== 'none',
    appReady: !!(document.getElementById('fileRollerApp')?.dataset.fileRollerInit === 'true'),
    wmTitle: wmHeader?.querySelector('#windowTitle')?.textContent,
    chromeToolkit: win?.getAttribute('data-window-chrome-toolkit'),
    chromeProvider: win?.getAttribute('data-window-chrome-provider'),
    csdClass: win?.classList.contains('file-roller--csd'),
    headerVisible: !!(wmHeader && wmStyle && wmStyle.display !== 'none'),
    headerDrag: wmHeader?.hasAttribute('data-window-drag-handle') === true,
    emptyVisible: !document.getElementById('fr-empty')?.hidden,
    navHidden: document.getElementById('fr-nav-row')?.hidden,
    navVisible: !document.getElementById('fr-nav-row')?.hidden,
    extractDisabled: document.querySelector('[data-fr-action="extract"]')?.disabled,
    extractEnabled: document.querySelector('[data-fr-action="extract"]')?.disabled === false,
    rowCount: rows.length,
    firstName: rows[0]?.querySelector('.fr-app__file-cell span:last-child')?.textContent,
    firstSize: rows[0]?.cells?.[1]?.textContent,
    path: document.getElementById('fr-path-text')?.textContent,
    status: document.getElementById('fr-status')?.textContent || '',
    winW: box ? Math.round(box.width) : null,
    winH: box ? Math.round(box.height) : null,
    headerbarH: hb ? Math.round(hb.height) : null,
    colNamePct: tableBox && colBox ? Math.round((colBox.width / tableBox.width) * 100) : null,
    winLeft: box ? box.left : null,
  };
});

const record = (results, id, priority, failures, state) => {
  results[id] = {
    priority,
    ok: failures.length === 0,
    failures,
    state: state ? {
      wmTitle: state.wmTitle,
      rowCount: state.rowCount,
      emptyVisible: state.emptyVisible,
      winW: state.winW,
      winH: state.winH,
    } : undefined,
  };
  return failures.length === 0 ? 0 : (priority === 'P0' ? 1 : 0.5);
};

const check = (state, expect) => {
  const failures = [];
  Object.keys(expect || {}).forEach((key) => {
    const want = expect[key];
    if (key === 'statusContains') {
      if (!state.status || state.status.indexOf(want) < 0) failures.push(`statusContains:${want}`);
      return;
    }
    if (key.endsWith('Min')) {
      const field = key.replace('Min', '');
      const map = { winWidth: 'winW', winHeight: 'winH', headerbarH: 'headerbarH', colNamePct: 'colNamePct' };
      const f = map[field] || field;
      if (state[f] === null || state[f] < want) failures.push(`${key}>=${want}`);
      return;
    }
    if (key.endsWith('Max')) {
      const field = key.replace('Max', '');
      const map = { winWidth: 'winW', winHeight: 'winH', headerbarH: 'headerbarH', colNamePct: 'colNamePct' };
      const f = map[field] || field;
      if (state[f] === null || state[f] > want) failures.push(`${key}<=${want}`);
      return;
    }
    if (state[key] !== want) failures.push(`${key}:${state[key]}!==${want}`);
  });
  return failures;
};

const scenarios = JSON.parse(fs.readFileSync(SCENARIOS_PATH, 'utf8'));
const byId = {};
scenarios.scenarios.forEach((s) => { byId[s.id] = s; });

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

const results = {};
let p0fail = 0;
let p1fail = 0;

const failCount = (id, failures, state) => {
  const sc = byId[id];
  const pr = sc ? sc.priority : 'P1';
  record(results, id, pr, failures, state);
  if (failures.length) {
    if (pr === 'P0') p0fail += 1;
    else p1fail += 1;
  }
};

// --- menu.open (recherche unique — « Gestionnaire » matche 4 apps) ---
await openMintSlot(page, 'file_roller');
let state = await readState(page);
failCount('menu.open', check(state, byId['menu.open'].expect), state);

// --- chrome.csd + empty.state ---
state = await readState(page);
failCount('chrome.csd', check(state, byId['chrome.csd'].expect), state);
failCount('empty.state', check(state, byId['empty.state'].expect), state);

// --- menu.open-demo (Rv₁) ---
await page.evaluate(() => {
  document.querySelector('[data-fr-action="menu"]')?.click();
});
await page.waitForTimeout(60);
await page.evaluate(() => {
  document.querySelector('[data-fr-menu="open-demo"]')?.click();
});
await page.waitForTimeout(100);
state = await readState(page);
failCount('menu.open-demo', check(state, byId['menu.open-demo'].expect), state);

// --- rv.close-archive ---
await page.evaluate(() => {
  document.querySelector('[data-fr-action="menu"]')?.click();
});
await page.waitForTimeout(60);
await page.evaluate(() => {
  document.querySelector('[data-fr-menu="close"]')?.click();
});
await page.waitForTimeout(100);
state = await readState(page);
failCount('rv.close-archive', check(state, byId['rv.close-archive'].expect), state);

// --- rv.search-filter ---
await page.evaluate(() => {
  if (typeof window.openFileRollerDemoArchive === 'function') window.openFileRollerDemoArchive();
});
await page.waitForTimeout(100);
await page.evaluate(() => {
  document.querySelector('[data-fr-action="search"]')?.click();
});
await page.waitForTimeout(60);
await page.evaluate(() => {
  const input = document.getElementById('fr-search-input');
  if (input) {
    input.value = 'nomatch-zzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await page.waitForTimeout(80);
state = await readState(page);
let failures = check(state, byId['rv.search-filter'].expect);
await page.evaluate(() => {
  const input = document.getElementById('fr-search-input');
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
});
await page.waitForTimeout(80);
state = await readState(page);
failures = failures.concat(check(state, byId['rv.search-filter'].expectAfter3));
failCount('rv.search-filter', failures, state);

// --- action.extract ---
await page.evaluate(() => {
  document.querySelector('[data-fr-action="extract"]')?.click();
});
await page.waitForTimeout(80);
state = await readState(page);
failCount('action.extract', check(state, byId['action.extract'].expect), state);

// --- geometry.window (avant drag — le drag peut maximiser la fenêtre) ---
state = await readState(page);
failCount('geometry.window', check(state, byId['geometry.window'].expect), state);

// --- window.drag (après géométrie — évite maximize avant mesure VM) ---
const dragBefore = await readState(page);
const headerBox = await page.evaluate(() => {
  const el = document.querySelector('div[data-link="file_roller"] #windowHeader');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
if (headerBox) {
  await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(headerBox.x + headerBox.width / 2 + 70, headerBox.y + headerBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(80);
  const dragAfter = await readState(page);
  const dragMoved = dragBefore.winLeft !== null && dragAfter.winLeft !== null
    && Math.abs(dragAfter.winLeft - dragBefore.winLeft) > 15;
  failCount('window.drag', dragMoved ? [] : ['dragMoved:false'], dragAfter);
} else {
  failCount('window.drag', ['header-missing'], dragBefore);
}

await browser.close();

const summary = {
  slot: 'file_roller',
  scenarios: scenarios.scenarios.length,
  p0Fail: p0fail,
  p1Fail: p1fail,
  ok: p0fail === 0 && p1fail === 0,
  at: new Date().toISOString(),
  url: process.env.CAPSULE_MINT_URL || 'default',
};

const payload = { summary, results, matrix: SCENARIOS_PATH };

if (writeOut) {
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

console.log(JSON.stringify(payload, null, 2));
process.exit(summary.ok ? 0 : 1);
