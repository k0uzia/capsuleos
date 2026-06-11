#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  permissions: ['clipboard-read', 'clipboard-write'],
});
const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
await waitMintReady(page);
await openMintSlot(page, 'text_editor');
await page.waitForTimeout(180);

const menus = await page.evaluate(() => {
  const triggers = [...document.querySelectorAll('.xed-menu__trigger')];
  const openAt = (idx) => {
    document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
    const t = triggers[idx];
    if (!t) return false;
    t.click();
    const dd = t.parentElement.querySelector('.xed-menu__dropdown');
    return dd && !dd.hidden;
  };
  const fichier = openAt(0);
  document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
  const edition = openAt(1);
  document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
  const affichage = openAt(3);
  document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
  return { fichier, edition, affichage };
});

await page.fill('#xed-area', 'ligne un\nligne deux beta\nligne trois');
await page.evaluate(() => {
  const triggers = document.querySelectorAll('.xed-menu__trigger');
  if (triggers[2]) triggers[2].click();
  const findBtn = document.querySelector('[data-xed-action="find"]');
  if (findBtn) findBtn.click();
});
await page.waitForTimeout(50);
// xed 46 : recherche via barre inline #xed-searchbar (fallback dialogue si absente).
const usesSearchbar = await page.evaluate(() => {
  const bar = document.getElementById('xed-searchbar');
  return !!bar && !bar.hidden;
});
if (usesSearchbar) {
  await page.fill('#xed-searchbar-input', 'beta');
  await page.click('[data-xed-searchbar="next"]');
} else {
  await page.fill('#xed-find-input', 'beta');
  await page.click('[data-xed-dialog="find-next"]');
}
await page.waitForTimeout(40);
const find = await page.evaluate(() => {
  const area = document.getElementById('xed-area');
  const sel = area ? area.value.substring(area.selectionStart, area.selectionEnd) : '';
  const bar = document.getElementById('xed-searchbar');
  const dlg = document.getElementById('xed-find-dialog');
  return { sel, dlgOpen: (bar && !bar.hidden) || (dlg && !dlg.hidden) };
});
await page.evaluate(() => {
  const closeBar = document.querySelector('[data-xed-searchbar="close"]');
  if (closeBar) closeBar.click();
  const close = document.querySelector('#xed-find-dialog [data-xed-dialog="close"]');
  if (close) close.click();
});

await page.evaluate(() => {
  const triggers = document.querySelectorAll('.xed-menu__trigger');
  if (triggers[2]) triggers[2].click();
  const repBtn = document.querySelector('[data-xed-action="replace"]');
  if (repBtn) repBtn.click();
});
await page.waitForTimeout(40);
const replaceDlg = await page.evaluate(() => {
  const dlg = document.getElementById('xed-replace-dialog');
  return { open: dlg && !dlg.hidden };
});
await page.click('#xed-replace-dialog [data-xed-dialog="close"]');

await page.fill('#xed-area', 'texte initial');
await page.keyboard.press('Control+a');
await page.keyboard.press('Control+c');
await page.fill('#xed-area', '');
await page.keyboard.press('Control+v');
await page.waitForTimeout(60);

const after = await page.evaluate(() => ({
  value: document.getElementById('xed-area')?.value,
  title: document.querySelector('div[data-link="text_editor"] #windowTitle')?.textContent,
  appReady: document.getElementById('xedApp')?.dataset.xedInit === 'true',
  status: document.getElementById('xed-status-pos')?.textContent,
}));

const toggleView = await page.evaluate(() => {
  const root = document.getElementById('xedApp');
  const item = document.querySelector('[data-xed-action="toggle-statusbar"]');
  if (!root || !item) return false;
  item.click();
  const hidden = root.classList.contains('is-status-hidden');
  item.click();
  return hidden;
});

const ok = after.appReady && menus.fichier && menus.edition && menus.affichage
  && find.sel === 'beta' && find.dlgOpen
  && replaceDlg.open
  && after.value === 'texte initial'
  && after.title === '*Sans titre'
  && after.status.indexOf('Ligne') >= 0
  && toggleView;

console.log(JSON.stringify({ menus, find, replaceDlg, after, toggleView, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
