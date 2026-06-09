#!/usr/bin/env node
/**
 * Smoke Playwright — menus contextuels Cinnamon Mint (tous contextes P0/P1).
 *
 * Usage :
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html \
 *     node usr/lib/capsuleos/tools/lab/smoke-mint-context-menus.mjs
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
const MATRIX_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/context-menus.json',
);

const readMatrix = () => JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));

const matchExpected = (labels, expected) => {
  const missing = expected.filter((label) => labels.indexOf(label) < 0);
  return { ok: missing.length === 0, missing, labels };
};

const readVisibleLabels = (menu, itemSelector) => {
  if (!menu || menu.hidden) {
    return [];
  }
  return [...menu.querySelectorAll(itemSelector)]
    .filter((node) => !node.hidden)
    .map((node) => String(node.textContent || '').trim())
    .filter(Boolean);
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

const matrix = readMatrix();
const results = {};

await page.keyboard.press('Escape');
await page.evaluate(() => {
  const menu = document.getElementById('desktop-context-menu');
  if (menu) {
    menu.hidden = true;
  }
});

await page.mouse.click(640, 400, { button: 'right' });
await page.waitForTimeout(120);
results['desktop.background'] = await page.evaluate(() => {
  const menu = document.getElementById('desktop-context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.desktop-context-menu__item')].map((b) => b.textContent.trim())
    : [];
  return {
    visible: !!(menu && !menu.hidden),
    labels,
    hitId: document.elementFromPoint(640, 400)?.id || '',
  };
});

const desktopCtx = matrix.contexts.find((c) => c.id === 'desktop.background');
const desktopCheck = matchExpected(results['desktop.background'].labels, desktopCtx.expectedLabels);
results['desktop.background'].ok = results['desktop.background'].visible && desktopCheck.ok;
results['desktop.background'].missing = desktopCheck.missing;

await page.keyboard.press('Escape');
await openMintSlot(page, 'nemo');
await page.waitForSelector('div[data-link="nemo"]', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(220);

results['nemo.list.background'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const content = win?.querySelector('.nemoElement');
  content?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 420,
    clientY: 300,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-item')].filter((n) => !n.hidden).map((n) => n.textContent.trim())
    : [];
  return {
    bound: win?.dataset?.nemoContextMenuInit === 'true',
    visible: !!(menu && !menu.hidden),
    labels,
  };
});

const nemoBgCtx = matrix.contexts.find((c) => c.id === 'nemo.list.background');
const nemoBgCheck = matchExpected(results['nemo.list.background'].labels, nemoBgCtx.expectedLabels);
results['nemo.list.background'].ok = results['nemo.list.background'].visible
  && results['nemo.list.background'].bound
  && nemoBgCheck.ok;
results['nemo.list.background'].missing = nemoBgCheck.missing;

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(160);

results['nemo.list.file'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('.nemoElement a[data-item-name]');
  if (!link) {
    return { visible: false, labels: [], noItem: true };
  }
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 300,
    clientY: 250,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-item')].filter((n) => !n.hidden).map((n) => n.textContent.trim())
    : [];
  return {
    item: link.dataset.itemName,
    visible: !!(menu && !menu.hidden),
    labels,
  };
});

const nemoFileCtx = matrix.contexts.find((c) => c.id === 'nemo.list.file');
if (!results['nemo.list.file'].noItem) {
  const nemoFileCheck = matchExpected(results['nemo.list.file'].labels, nemoFileCtx.expectedLabels);
  results['nemo.list.file'].ok = results['nemo.list.file'].visible && nemoFileCheck.ok;
  results['nemo.list.file'].missing = nemoFileCheck.missing;
} else {
  results['nemo.list.file'].ok = false;
  results['nemo.list.file'].missing = ['no file item in Documents'];
}

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

results['nemo.sidebar.trash'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('#voletnemo a[data-link="Corbeille"]');
  link?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 60,
    clientY: 210,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-item')].filter((n) => !n.hidden).map((n) => n.textContent.trim())
    : [];
  return {
    visible: !!(menu && !menu.hidden),
    labels,
  };
});

const sidebarTrashCtx = matrix.contexts.find((c) => c.id === 'nemo.sidebar.trash');
const sidebarTrashCheck = matchExpected(
  results['nemo.sidebar.trash'].labels,
  sidebarTrashCtx.expectedLabels,
);
results['nemo.sidebar.trash'].ok = results['nemo.sidebar.trash'].visible && sidebarTrashCheck.ok;
results['nemo.sidebar.trash'].missing = sidebarTrashCheck.missing;

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Corbeille"]');
await page.waitForTimeout(200);

results['nemo.trash.background'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const content = win?.querySelector('.nemoElement');
  content?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 400,
    clientY: 280,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-item')].filter((n) => !n.hidden).map((n) => n.textContent.trim())
    : [];
  return {
    path: typeof window.getExplorerCurrentPath === 'function'
      ? window.getExplorerCurrentPath('nemo')
      : '',
    visible: !!(menu && !menu.hidden),
    labels,
  };
});

const trashBgCtx = matrix.contexts.find((c) => c.id === 'nemo.trash.background');
const trashBgCheck = matchExpected(results['nemo.trash.background'].labels, trashBgCtx.expectedLabels);
results['nemo.trash.background'].ok = results['nemo.trash.background'].visible && trashBgCheck.ok;
results['nemo.trash.background'].missing = trashBgCheck.missing;

results['nemo.trash.item'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('.nemoElement a[data-item-name]');
  if (!link) {
    return { visible: false, labels: [], emptyTrash: true };
  }
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 280,
    clientY: 240,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-item')].filter((n) => !n.hidden).map((n) => n.textContent.trim())
    : [];
  return {
    item: link.dataset.itemName,
    visible: !!(menu && !menu.hidden),
    labels,
    emptyTrash: false,
  };
});

const trashItemCtx = matrix.contexts.find((c) => c.id === 'nemo.trash.item');
if (!results['nemo.trash.item'].emptyTrash) {
  const trashItemCheck = matchExpected(results['nemo.trash.item'].labels, trashItemCtx.expectedLabels);
  results['nemo.trash.item'].ok = results['nemo.trash.item'].visible && trashItemCheck.ok;
  results['nemo.trash.item'].missing = trashItemCheck.missing;
} else {
  results['nemo.trash.item'].ok = true;
  results['nemo.trash.item'].skipped = true;
}

await page.keyboard.press('Escape');

const p1Ids = [
  'desktop.background',
  'nemo.list.background',
  'nemo.list.file',
  'nemo.sidebar.trash',
  'nemo.trash.background',
  'nemo.trash.item',
];
const ok = p1Ids.every((id) => results[id] && results[id].ok !== false);

console.log(JSON.stringify({ matrix: MATRIX_PATH.replace(`${ROOT}/`, ''), results, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
