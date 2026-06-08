#!/usr/bin/env node
/**
 * Passe parité interactionnelle Playwright — met à jour Π_app dans l'indice.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --slot nemo
 *   node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --priority
 *   node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --slot nemo --write
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { SLOT_TEMPLATES } from './app-interaction-templates.mjs';
import {
  ROOT,
  loadParityIndex,
  saveParityIndex,
  updateAppParity,
  dimensionScoresFromChecks,
  computePiApp,
  parityStatus,
  inventoryPath,
  defaultIndexPath,
} from './parity-index-lib.mjs';
import { chromePath, openMintSlot, waitMintReady } from './mint-smoke-open.mjs';

const PRIORITY_SLOTS = ['nemo', 'firefox', 'text_editor', 'calculator', 'file_roller', 'update_manager', 'mintinstall', 'themes'];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    id: 'linux-mint',
    slot: null,
    priority: false,
    write: false,
    json: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--slot' && args[i + 1]) opts.slot = args[++i];
    else if (a === '--priority') opts.priority = true;
    else if (a === '--write') opts.write = true;
    else if (a === '--json') opts.json = true;
  }
  return opts;
};

const slotSelector = (slot) => `div[data-link="${slot}"]`;

async function runSlotChecks(page, slot) {
  const results = [];
  const winSel = slotSelector(slot);

  const push = (id, dimension, pass, detail) => {
    results.push({ id, dimension, pass, detail });
  };

  if (slot === 'update_manager') {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('capsule-mintupdate-welcome-dismissed');
        localStorage.removeItem('capsule-mintupdate-mirror-dismissed');
      } catch (e) { /* ignore */ }
    });
  }

  await openMintSlot(page, slot);
  await page.waitForSelector(winSel, { state: 'visible', timeout: 15000 }).catch(() => {});

  if (slot === 'nemo') {
    const home = await page.evaluate(() => {
      const win = document.querySelector('div[data-link="nemo"]');
      return {
        nav: win?.dataset.nemoNavDelegationInit === 'true',
        sidebar: win?.dataset.nemoSidebarDelegation === 'true',
        chrome: win?.getAttribute('data-window-chrome-provider') === 'nemo',
      };
    });
    push('win-open', 'int', home.nav && home.sidebar, home);

    await page.click(`${winSel} #voletnemo a[data-link="Documents"]`);
    await page.waitForTimeout(40);
    const docs = await page.evaluate(() => window.getExplorerCurrentPath('nemo') || '');
    push('sidebar-places', 'nav', docs.indexOf('Documents') >= 0, { path: docs });

    await page.click(`${winSel} #nemo-search`);
    await page.waitForTimeout(50);
    const search = await page.evaluate(() => {
      const wrap = document.querySelector('div[data-link="nemo"] #nemo-search-wrap');
      return wrap && !wrap.hidden;
    });
    push('search-toggle', 'int', search, {});

    await page.click(`${winSel} .nemo-app__toolbar-group--view a img[src*="view-list"]`);
    await page.waitForTimeout(60);
    const listView = await page.evaluate(() => {
      const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
      return grid?.classList.contains('nemo-app__content-grid--list');
    });
    push('view-list', 'int', !!listView, {});

    const pathMode = await page.evaluate(() => {
      const toggleBtn = document.getElementById('nemo-toggle-path-mode');
      const pathLabel = document.getElementById('nemo-path-label');
      if (!toggleBtn || !pathLabel) return false;
      toggleBtn.click();
      const on = pathLabel.classList.contains('nemo-app__path-breadcrumb');
      toggleBtn.click();
      return on;
    });
    push('path-breadcrumb', 'nav', pathMode, {});

    const footer = await page.evaluate(() => {
      const treeBtn = document.querySelector('[data-nemo-sidebar-mode="tree"]');
      const sidebar = document.getElementById('voletnemo');
      if (!treeBtn || !sidebar) return false;
      treeBtn.click();
      return sidebar.getAttribute('data-sidebar-view') === 'tree';
    });
    push('footer-sidebar-modes', 'nav', footer, {});

    const ctx = await page.evaluate(() => {
      const content = document.querySelector('div[data-link="nemo"] .nemoElement');
      if (!content) return false;
      content.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 260 }));
      const menu = document.querySelector('.nemo-app__context-menu');
      return menu && !menu.hidden;
    });
    push('context-menu', 'ctx', ctx, {});

    return results;
  }

  if (slot === 'firefox') {
    const chrome = await page.evaluate(() => {
      const app = document.querySelector('#firefox [data-firefox-app]');
      const header = document.querySelector('#firefox #windowHeader');
      const childLinks = Array.from(document.querySelector('#firefox')?.children || []);
      const headerIdx = header ? childLinks.indexOf(header) : -1;
      const appHostIdx = childLinks.findIndex((el) => el.contains(app));
      return app?.dataset.initialized === 'true' && headerIdx >= 0 && appHostIdx > headerIdx;
    });
    push('chrome-layout', 'vis', chrome, {});

    await page.click(`${winSel} [data-browser-action="new-tab"]`);
    await page.waitForTimeout(70);
    const tabs = await page.evaluate(() => (
      document.querySelectorAll('#firefox [data-browser-tab-id]').length
    ));
    push('new-tab', 'int', tabs >= 2, { tabs });

    await page.click(`${winSel} [data-browser-action="toggle-bookmarks"]`);
    await page.waitForTimeout(60);
    const bm = await page.evaluate(() => {
      const bar = document.querySelector('#firefox [data-browser-bookmarks]');
      return bar && !bar.hidden;
    });
    push('bookmarks-bar', 'nav', bm, {});
    return results;
  }

  if (slot === 'text_editor') {
    const ready = await page.evaluate(() => (
      document.getElementById('xedApp')?.dataset.xedInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const menus = await page.evaluate(() => {
      const triggers = [...document.querySelectorAll('.xed-menu__trigger')];
      const openMenu = (idx) => {
        document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
        const t = triggers[idx];
        if (!t) return false;
        t.click();
        const dd = t.parentElement?.querySelector('.xed-menu__dropdown');
        return !!(dd && !dd.hidden);
      };
      const fichier = openMenu(0);
      document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
      const edition = openMenu(1);
      document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
      const affichage = openMenu(3);
      document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
      return { fichier, edition, affichage };
    });
    push('menu-fichier', 'nav', menus.fichier, {});
    push('menu-edition', 'nav', menus.edition, {});
    push('menu-affichage', 'nav', menus.affichage, {});

    await page.fill('#xed-area', 'alpha beta gamma');
    await page.evaluate(() => {
      const triggers = document.querySelectorAll('.xed-menu__trigger');
      const searchTrigger = triggers[2];
      if (searchTrigger) searchTrigger.click();
      const findItem = document.querySelector('[data-xed-action="find"]');
      if (findItem) findItem.click();
    });
    await page.waitForTimeout(50);
    await page.fill('#xed-find-input', 'beta');
    await page.click('[data-xed-dialog="find-next"]');
    await page.waitForTimeout(40);
    const findSel = await page.evaluate(() => {
      const area = document.getElementById('xed-area');
      if (!area) return '';
      return area.value.substring(area.selectionStart, area.selectionEnd);
    });
    push('find-dialog', 'ctx', findSel === 'beta', { findSel });

    await page.evaluate(() => {
      const close = document.querySelector('#xed-find-dialog [data-xed-dialog="close"]');
      if (close) close.click();
    });

    await page.fill('#xed-area', 'parity');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');
    await page.fill('#xed-area', '');
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(50);
    const paste = await page.evaluate(() => document.getElementById('xed-area')?.value);
    push('kb-paste', 'kb', paste === 'parity', { paste });
    push('toolbar-paste', 'int', paste === 'parity', { paste });

    const toggleToolbar = await page.evaluate(() => {
      const item = document.querySelector('[data-xed-action="toggle-toolbar"]');
      const root = document.getElementById('xedApp');
      if (!item || !root) return false;
      item.click();
      const hidden = root.classList.contains('is-toolbar-hidden');
      item.click();
      return hidden && !root.classList.contains('is-toolbar-hidden');
    });
    push('toggle-toolbar', 'int', toggleToolbar, {});
    push('statusbar', 'vis', await page.evaluate(() => {
      const pos = document.getElementById('xed-status-pos')?.textContent || '';
      return pos.indexOf('Ligne') >= 0;
    }), {});
    return results;
  }

  if (slot === 'calculator') {
    const ready = await page.evaluate(() => (
      document.getElementById('gnomeCalculatorApp')?.dataset.calcInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="calculator"] #windowTitle')?.textContent,
      initial: document.getElementById('gnome-calc-value')?.textContent,
    }));
    push('calc-chrome', 'vis', chrome.title === 'Calculatrice', chrome);
    push('calc-initial', 'data', chrome.initial === '0', chrome);

    await page.click('[data-calc="digit"][data-digit="2"]');
    await page.click('[data-calc="op"][data-op="+"]');
    await page.click('[data-calc="digit"][data-digit="3"]');
    await page.click('[data-calc="equals"]');
    await page.waitForTimeout(50);
    const val = await page.evaluate(() => document.getElementById('gnome-calc-value')?.textContent);
    push('basic-arithmetic', 'int', val === '5', { val });

    await page.click('#gnome-calc-mode');
    await page.waitForTimeout(50);
    const mode = await page.evaluate(() => {
      const pop = document.getElementById('gnome-calc-mode-popover');
      return pop && !pop.hidden;
    });
    push('mode-switch', 'nav', mode, {});
    push('mode-popover', 'ctx', mode, {});

    if (mode) {
      await page.click('[data-calc-mode="advanced"]');
      await page.waitForTimeout(40);
    }
    const advanced = await page.evaluate(() => (
      document.getElementById('gnomeCalculatorApp')?.classList.contains('gnome-calc--advanced')
    ));
    push('mode-advanced', 'nav', advanced, {});

    await page.click('[data-calc="clear"]');
    await page.click('[data-calc="digit"][data-digit="9"]');
    await page.click('[data-calc="backspace"]');
    await page.waitForTimeout(40);
    const bs = await page.evaluate(() => document.getElementById('gnome-calc-value')?.textContent);
    push('backspace', 'int', bs === '0', { bs });

    await page.click('#gnomeCalculatorApp');
    await page.focus('#gnomeCalculatorApp');
    await page.keyboard.press('4');
    await page.keyboard.press('+');
    await page.keyboard.press('5');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    const kbVal = await page.evaluate(() => document.getElementById('gnome-calc-value')?.textContent);
    push('kb-arithmetic', 'kb', kbVal === '9', { kbVal });
    return results;
  }

  if (slot === 'file_roller') {
    const empty = await page.evaluate(() => {
      const app = document.getElementById('fileRollerApp');
      const win = document.querySelector('div[data-link="file_roller"]');
      return {
        ready: app?.dataset.fileRollerInit === 'true',
        emptyVisible: !document.getElementById('fr-empty')?.hidden,
        title: win?.querySelector('#windowTitle')?.textContent,
      };
    });
    push('empty-state', 'data', empty.ready && empty.emptyVisible, empty);
    push('fr-chrome', 'vis', empty.title === 'Gestionnaire d\'archives', empty);

    await page.click('[data-fr-action="menu"]');
    await page.waitForTimeout(50);
    const menu = await page.evaluate(() => {
      const m = document.getElementById('fr-menu');
      return m && !m.hidden;
    });
    push('hamburger-menu', 'nav', menu, {});

    await page.click('[data-fr-menu="open-demo"]');
    await page.waitForTimeout(60);
    const open = await page.evaluate(() => (
      document.querySelector('div[data-link="file_roller"] #windowTitle')?.textContent === 'demo.zip'
    ));
    push('open-demo', 'int', open, {});

    await page.click('[data-fr-action="search"]');
    await page.waitForTimeout(40);
    const search = await page.evaluate(() => !document.getElementById('fr-search-row')?.hidden);
    push('search-toggle', 'int', search, {});

    await page.keyboard.press('Control+f');
    await page.waitForTimeout(40);
    const kbSearch = await page.evaluate(() => {
      const row = document.getElementById('fr-search-row');
      const input = document.getElementById('fr-search-input');
      return row && !row.hidden && document.activeElement === input;
    });
    push('fr-kb-search', 'kb', kbSearch, {});

    const headerBox = await page.locator('div[data-link="file_roller"] #windowHeader').boundingBox();
    if (headerBox) {
      const dragBefore = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="file_roller"]');
        return win ? win.getBoundingClientRect().left : null;
      });
      await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(headerBox.x + headerBox.width / 2 + 60, headerBox.y + headerBox.height / 2, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(40);
      const dragAfter = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="file_roller"]');
        return win ? win.getBoundingClientRect().left : null;
      });
      push('window-drag', 'vis', dragBefore !== null && dragAfter !== null
        && Math.abs(dragAfter - dragBefore) > 12, { dragBefore, dragAfter });
    } else {
      push('window-drag', 'vis', false, {});
    }
    return results;
  }

  if (slot === 'update_manager') {
    const welcome = await page.evaluate(() => !document.getElementById('um-welcome')?.hidden);
    push('welcome-screen', 'data', welcome, {});

    await page.click('[data-um-welcome="finish"]');
    await page.waitForTimeout(50);
    const main = await page.evaluate(() => !document.getElementById('um-main')?.hidden);
    push('welcome-dismiss', 'int', main, {});

    await page.click('[data-um-menu="file"]');
    await page.waitForTimeout(40);
    const fileMenu = await page.evaluate(() => {
      const dd = document.querySelector('[data-um-menu="file"]')
        ?.parentElement?.querySelector('.update-manager__menu-dropdown');
      return dd && !dd.hidden;
    });
    push('menubar-file', 'nav', fileMenu, {});
    await page.keyboard.press('Escape');

    await page.click('[data-um-mirror="no"]');
    await page.waitForTimeout(40);
    await page.click('[data-um-action="refresh"]');
    await page.waitForFunction(() => {
      const table = document.getElementById('um-tablewrap');
      return table && !table.hidden;
    }, null, { timeout: 8000 }).catch(() => {});
    const refresh = await page.evaluate(() => {
      const rows = document.querySelectorAll('#um-tablewrap tbody tr').length;
      return rows >= 1;
    });
    push('refresh-list', 'int', refresh, { rows: refresh });
    return results;
  }

  if (slot === 'mintinstall') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintInstallApp')?.dataset.mintInstallInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    await page.fill('#mi-search', 'Firefox');
    await page.waitForTimeout(80);
    const search = await page.evaluate(() => {
      const pageEl = document.querySelector('[data-mi-page="search"]');
      const items = document.querySelectorAll('#mi-search-list .mi-app__list-item').length;
      return !pageEl?.hidden && items >= 1;
    });
    push('search', 'int', search, {});

    await page.fill('#mi-search', '');
    await page.waitForTimeout(40);
    await page.click('[data-mi-cat="internet"]');
    await page.waitForTimeout(60);
    const cat = await page.evaluate(() => {
      const list = document.querySelector('[data-mi-page="list"]');
      const active = document.querySelector('[data-mi-cat="internet"]')?.classList.contains('is-active');
      const rows = document.querySelectorAll('#mi-app-list .mi-app__list-item').length;
      return active && list && !list.hidden && rows >= 2;
    });
    push('categories', 'nav', cat, {});

    await page.click('[data-mi-action="menu"]');
    await page.waitForTimeout(40);
    const menu = await page.evaluate(() => {
      const m = document.getElementById('mi-menu');
      return m && !m.hidden;
    });
    push('hamburger-menu', 'ctx', menu, {});
    return results;
  }

  if (slot === 'themes') {
    const ready = await page.evaluate(() => (
      document.getElementById('cinnamonSettingsApp')?.dataset.cinnamonSettingsInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const sidebar = await page.evaluate(() => (
      document.querySelectorAll('#cs-sidebar .cs-app__nav').length >= 20
    ));
    push('sidebar-panels', 'nav', sidebar, {});

    await page.fill('#cs-search', 'thème');
    await page.waitForTimeout(60);
    const search = await page.evaluate(() => {
      const themesBtn = document.querySelector('[data-cs-nav="themes"]');
      return themesBtn && !themesBtn.hidden
        && document.getElementById('cs-panel-title')?.textContent === 'Thèmes';
    });
    push('panel-search', 'nav', search, {});

    await page.fill('#cs-search', '');
    await page.click('[data-cs-nav="themes"]');
    await page.waitForTimeout(80);
    const themesPanel = await page.evaluate(() => {
      const panel = document.querySelector('[data-cs-panel="themes"]');
      const app = document.getElementById('themesApp');
      const styleLabel = app?.querySelector('.themes-app__select span')?.textContent;
      return {
        active: panel && panel.classList.contains('is-active') && !panel.hidden,
        appVisible: app && !app.hidden,
        mintY: styleLabel === 'Mint-Y-Dark-Aqua',
        gtk: app?.querySelector('[data-themes-gtk]')?.textContent,
      };
    });
    push('themes-app-panel', 'vis', themesPanel.active && themesPanel.appVisible, themesPanel);
    push('mint-y-default', 'data', themesPanel.mintY && themesPanel.gtk === 'Mint-Y-Aqua', themesPanel);

    await page.click('#cinnamonSettingsApp .themes-app__select');
    await page.waitForTimeout(50);
    const popover = await page.evaluate(() => {
      const pop = document.getElementById('themes-style-popover');
      return pop && !pop.hidden;
    });
    push('style-popover', 'ctx', popover, {});

    if (popover) {
      await page.click('[data-mint-style="Mint-Y-Aqua"]');
      await page.waitForTimeout(40);
    }
    const styleChanged = await page.evaluate(() => (
      document.querySelector('#cinnamonSettingsApp .themes-app__select span')?.textContent === 'Mint-Y-Aqua'
    ));
    push('style-select', 'int', styleChanged, {});

    await page.click('#cinnamonSettingsApp [data-theme-option="light"]');
    await page.waitForTimeout(50);
    const lightTheme = await page.evaluate(() => (
      document.documentElement.dataset.theme === 'light'
    ));
    push('theme-light', 'int', lightTheme, {});

    await page.click('[data-cs-nav="panel"]');
    await page.waitForTimeout(40);
    const panelSwitch = await page.evaluate(() => (
      document.getElementById('cs-panel-title')?.textContent === 'Barre des tâches'
    ));
    push('panel-switch', 'int', panelSwitch, {});

    const switchToggle = await page.evaluate(() => {
      const sw = document.querySelector('[data-cs-panel="panel"] .cs-switch');
      if (!sw) return false;
      const before = sw.classList.contains('is-on');
      sw.click();
      const after = sw.getAttribute('aria-checked') === 'true';
      return before !== after;
    });
    push('panel-toggle', 'int', switchToggle, {});

    await page.evaluate(() => {
      const search = document.getElementById('cs-search');
      if (search) {
        search.focus();
        search.value = '';
      }
    });
    await page.keyboard.type('Bluetooth');
    await page.waitForTimeout(60);
    const kbSearch = await page.evaluate(() => (
      document.getElementById('cs-panel-title')?.textContent === 'Bluetooth'
    ));
    push('cs-kb-search', 'kb', kbSearch, {});
    return results;
  }

  if (slot === 'baobab') {
    const ready = await page.evaluate(() => (
      document.getElementById('gnomeBaobabApp')?.dataset.baobabInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="baobab"] #windowTitle')?.textContent,
      ring: document.querySelector('.gnome-baobab__ring-center')?.textContent,
    }));
    push('baobab-chrome', 'vis', chrome.title === 'Analyseur d\'espace disque', chrome);
    push('ring-data', 'data', chrome.ring === '62 %', chrome);

    await page.click('.gnome-baobab__place:nth-child(2)');
    await page.waitForTimeout(40);
    const place = await page.evaluate(() => ({
      active: document.querySelector('.gnome-baobab__place--active .gnome-baobab__place-label')?.textContent,
      ring: document.querySelector('.gnome-baobab__ring-center')?.textContent,
      scanEnabled: !document.querySelector('.gnome-baobab__scan-btn')?.disabled,
    }));
    push('place-switch', 'nav', place.active === 'Dossier personnel' && place.ring === '34 %', place);
    push('scan-enable', 'int', place.scanEnabled, place);
    return results;
  }

  if (slot === 'bulky') {
    const ready = await page.evaluate(() => (
      document.getElementById('bulkyApp')?.dataset.bulkyInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="bulky"] #windowTitle')?.textContent,
      preview: document.querySelector('#blk-body .blk-app__preview')?.textContent,
    }));
    push('bulky-chrome', 'vis', chrome.title === 'Renommer fichiers', chrome);
    push('preview-data', 'data', chrome.preview === 'IMG_001.jpg', chrome);

    await page.fill('#blk-prefix', 'VAC_');
    await page.waitForTimeout(40);
    const prefix = await page.evaluate(() => (
      document.querySelector('#blk-body .blk-app__preview')?.textContent === 'VAC_001.jpg'
    ));
    push('prefix-update', 'int', prefix, {});

    await page.click('[data-blk-action="rename"]');
    await page.waitForTimeout(50);
    const renamed = await page.evaluate(() => ({
      first: document.querySelector('#blk-body tr td:first-child')?.textContent,
      btn: document.querySelector('[data-blk-action="rename"]')?.textContent,
    }));
    push('rename-action', 'int', renamed.first === 'VAC_001.jpg' && renamed.btn === 'Renommé', renamed);
    return results;
  }

  const visible = await page.evaluate((sel) => {
    const win = document.querySelector(sel);
    return win && win.style.display !== 'none';
  }, winSel);
  push('win-open', 'int', visible, {});
  return results;
}

async function runPass(opts, slots) {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const needsClipboard = slots.includes('text_editor');
  const context = needsClipboard
    ? await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
    : await browser.newContext();
  const page = await context.newPage();
  await waitMintReady(page);

  const report = {
    registryId: opts.id,
    ranAt: new Date().toISOString(),
    slots: {},
  };

  for (const slot of slots) {
    const checks = await runSlotChecks(page, slot);
    const dims = dimensionScoresFromChecks(checks);
    DIMENSIONS_FILL(dims);
    const pi = computePiApp(dims);
    report.slots[slot] = {
      pi,
      status: parityStatus(pi),
      dimensions: dims,
      checks,
      smokeScript: fs.existsSync(pathToSmoke(slot)) ? pathToSmoke(slot).replace(`${ROOT}/`, '') : null,
    };
  }

  await context.close();
  await browser.close();
  return report;
}

const DIMENSIONS_FILL = (dims) => {
  ['vis', 'nav', 'int', 'ctx', 'kb', 'data'].forEach((d) => {
    if (dims[d] === null || dims[d] === undefined) dims[d] = 50;
  });
};

const pathToSmoke = (slot) => {
  const map = {
    nemo: 'usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs',
    firefox: 'usr/lib/capsuleos/tools/lab/smoke-mint-firefox.mjs',
    text_editor: 'usr/lib/capsuleos/tools/lab/smoke-mint-text-editor.mjs',
    calculator: 'usr/lib/capsuleos/tools/lab/smoke-mint-calculator.mjs',
    file_roller: 'usr/lib/capsuleos/tools/lab/smoke-mint-file-roller.mjs',
    update_manager: 'usr/lib/capsuleos/tools/lab/smoke-mint-update-manager.mjs',
    mintinstall: 'usr/lib/capsuleos/tools/lab/smoke-mint-mintinstall.mjs',
    themes: 'usr/lib/capsuleos/tools/lab/smoke-mint-themes.mjs',
    baobab: 'usr/lib/capsuleos/tools/lab/smoke-mint-baobab.mjs',
    bulky: 'usr/lib/capsuleos/tools/lab/smoke-mint-bulky.mjs',
  };
  const rel = map[slot];
  return rel ? path.join(ROOT, rel) : '';
};

const main = async () => {
  const opts = parseArgs();
  const slots = opts.priority
    ? PRIORITY_SLOTS
    : opts.slot
      ? [opts.slot]
      : [];

  if (!slots.length) {
    console.error('Préciser --slot <slot> ou --priority');
    process.exit(1);
  }

  const report = await runPass(opts, slots);

  if (opts.write) {
    let index = loadParityIndex(opts.id) || {
      registryId: opts.id,
      version: 1,
      weights: { shell: 0.25, apps: 0.75 },
      shell: {},
      apps: {},
    };

    Object.entries(report.slots).forEach(([slot, data]) => {
      const invFile = inventoryPath(opts.id, slot);
      const invRef = fs.existsSync(invFile) ? invFile.replace(`${ROOT}/`, '') : null;
      updateAppParity(index, slot, {
        dimensions: data.dimensions,
        pi: data.pi,
        status: data.status,
        inventory: invRef,
        vmDoc: SLOT_TEMPLATES[slot]?.vmDoc || null,
        lastPass: report.ranAt,
        checksPassed: data.checks.filter((c) => c.pass).length,
        checksTotal: data.checks.length,
      });
    });

    const out = saveParityIndex(opts.id, index);
    report.indexWritten = out.replace(`${ROOT}/`, '');
    report.pi_global = index.pi_global;
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const summary = Object.entries(report.slots).map(([s, d]) => `${s}: Π=${d.pi} (${d.status})`);
    console.log(summary.join('\n'));
    if (report.pi_global) console.log(`Π_global=${report.pi_global}`);
  }

  const allOk = Object.values(report.slots).every((s) => s.checks.every((c) => c.pass));
  process.exit(allOk ? 0 : 1);
};

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
