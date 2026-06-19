#!/usr/bin/env node
/**
 * Smoke Playwright — routage menu Préférences → slot themes → csPanel actif.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-mint-menu-cs-routing.mjs
 *   CAPSULE_MINT_URL=... node usr/lib/capsuleos/tools/lab/smoke-mint-menu-cs-routing.mjs --sample 8
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  chromePath,
  MINT_VIEWPORT,
  openMintMainMenu,
  waitMintReady,
} from './mint-smoke-open.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MATRIX_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/menu-cs-routing.json',
);

const sampleArg = process.argv.find((a) => a.startsWith('--sample'));
const sampleSize = sampleArg ? Number(sampleArg.split('=')[1] || process.argv[process.argv.indexOf('--sample') + 1]) : 0;

const readMatrix = () => {
  if (!fs.existsSync(MATRIX_PATH)) {
    throw new Error(`Matrice absente — lancer generate-menu-cs-routing-matrix.mjs --write (${MATRIX_PATH})`);
  }
  return JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
};

const pickEntries = (entries) => {
  if (!sampleSize || sampleSize >= entries.length) return entries;
  const stride = Math.max(1, Math.floor(entries.length / sampleSize));
  const picked = [];
  for (let i = 0; i < entries.length && picked.length < sampleSize; i += stride) {
    picked.push(entries[i]);
  }
  return picked;
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

const matrix = readMatrix();
const targets = pickEntries(matrix.entries.filter((e) => e.priority === 'P1' && e.csPanel));
const results = [];

for (const entry of targets) {
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    document.querySelectorAll('div[data-link="themes"]').forEach((win) => {
      if (win.style) win.style.display = 'none';
    });
  });

  await openMintMainMenu(page);
  await page.fill('#menu-search', '');
  await page.fill('#menu-search', entry.labelFr);
  await page.waitForTimeout(100);

  const clicked = await page.evaluate((label) => {
    const items = [...document.querySelectorAll('#menu-app-list .menu-app-item')];
    const item = items.find((li) => {
      const name = li.querySelector('.menu-app-item__name');
      return name && name.textContent.trim() === label;
    });
    if (!item) return { ok: false, reason: 'menu-item-not-found' };
    item.click();
    return { ok: true };
  }, entry.labelFr);

  await page.waitForTimeout(280);

  const panelCheck = await page.evaluate((expectedPanel) => {
    const app = document.getElementById('cinnamonSettingsApp');
    const win = document.querySelector('div[data-link="themes"]');
    const panel = document.querySelector(`[data-cs-panel="${expectedPanel}"]`);
    const nav = document.querySelector(`[data-cs-nav="${expectedPanel}"]`);
    return {
      winVisible: win && win.style.display !== 'none',
      appReady: app && app.dataset.cinnamonSettingsInit === 'true',
      panelVisible: panel && !panel.hidden,
      panelTitle: document.querySelector('#cs-panel-title')?.textContent || null,
      navActive: nav && nav.classList.contains('is-active'),
      pendingConsumed: typeof window.CAPSULE_CS_PENDING_PANEL === 'undefined',
    };
  }, entry.csPanel);

  const ok = clicked.ok && panelCheck.winVisible && panelCheck.appReady && panelCheck.panelVisible;
  results.push({
    labelFr: entry.labelFr,
    csPanel: entry.csPanel,
    ok,
    clicked,
    panelCheck,
  });
}

await browser.close();

const passed = results.filter((r) => r.ok).length;
const report = {
  ok: passed === results.length,
  tested: results.length,
  passed,
  matrixParity: matrix.summary,
  failures: results.filter((r) => !r.ok),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
