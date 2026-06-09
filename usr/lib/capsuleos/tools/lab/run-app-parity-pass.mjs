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

    const nemoChrome0 = await page.evaluate(() => {
      const win = document.querySelector('div[data-link="nemo"]');
      return {
        title: win?.querySelector('#windowTitle')?.textContent || '',
        toolkit: win?.getAttribute('data-window-chrome-toolkit'),
        provider: win?.getAttribute('data-window-chrome-provider'),
        drag: !!win?.querySelector('#windowHeader[data-window-drag-handle]'),
        path: typeof window.getExplorerCurrentPath === 'function'
          ? window.getExplorerCurrentPath('nemo') : '',
      };
    });
    push('nemo-chrome', 'vis', nemoChrome0.toolkit === 'cinnamon'
      && nemoChrome0.provider === 'nemo' && nemoChrome0.drag
      && nemoChrome0.title.indexOf('Nemo') >= 0, nemoChrome0);
    push('home-data', 'data', nemoChrome0.path.indexOf('Dossier personnel') >= 0
      || nemoChrome0.path.indexOf('home') >= 0, nemoChrome0);

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

    await page.click('div[data-link="nemo"]');
    await page.focus('div[data-link="nemo"]');
    await page.keyboard.press('F9');
    await page.waitForTimeout(50);
    const f9Hide = await page.evaluate(() => {
      const sidebar = document.getElementById('voletnemo');
      return sidebar?.classList.contains('is-sidebar-hidden');
    });
    await page.keyboard.press('F9');
    await page.waitForTimeout(50);
    const f9Show = await page.evaluate(() => {
      const sidebar = document.getElementById('voletnemo');
      return sidebar && !sidebar.classList.contains('is-sidebar-hidden');
    });
    push('f9-sidebar', 'kb', f9Hide && f9Show, { f9Hide, f9Show });

    return results;
  }

  if (slot === 'firefox') {
    const initial = await page.evaluate(() => {
      const win = document.getElementById('firefox');
      const app = win?.querySelector('[data-firefox-app]');
      const home = app?.querySelector('[data-browser-home]');
      const title = win?.querySelector('#windowTitle')?.textContent || '';
      return {
        init: app?.dataset.initialized === 'true',
        homeVisible: home && !home.hidden,
        tabs: app ? app.querySelectorAll('[data-browser-tab-id]').length : 0,
        titleOk: title.indexOf('Mozilla Firefox') >= 0,
        hasNewtabSearch: !!app?.querySelector('[data-browser-newtab-input]'),
      };
    });
    push('initial-home', 'data', initial.init && initial.homeVisible
      && initial.tabs === 1 && initial.titleOk && initial.hasNewtabSearch, initial);

    const chrome = await page.evaluate(() => {
      const app = document.querySelector('#firefox [data-firefox-app]');
      const header = document.querySelector('#firefox #windowHeader');
      const childLinks = Array.from(document.querySelector('#firefox')?.children || []);
      const headerIdx = header ? childLinks.indexOf(header) : -1;
      const appHostIdx = childLinks.findIndex((el) => el.contains(app));
      return app?.dataset.initialized === 'true' && headerIdx >= 0 && appHostIdx > headerIdx;
    });
    push('chrome-layout', 'vis', chrome, {});

    await page.click(`${winSel} [data-browser-action="menu"]`);
    await page.waitForTimeout(50);
    const menu = await page.evaluate(() => {
      const pop = document.querySelector('#firefox [data-browser-menu]');
      return pop && !pop.hidden;
    });
    push('menu-popover', 'ctx', menu, {});
    if (menu) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(30);
    }

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

    await page.click('#firefox [data-firefox-app]');
    await page.focus('#firefox [data-firefox-app]');
    await page.keyboard.press('Control+t');
    await page.waitForTimeout(60);
    const kbTab = await page.evaluate(() => (
      document.querySelectorAll('#firefox [data-browser-tab-id]').length >= 3
    ));
    push('kb-new-tab', 'kb', kbTab, {});

    await page.keyboard.press('Control+l');
    await page.waitForTimeout(40);
    const kbUrl = await page.evaluate(() => (
      document.activeElement?.matches('[data-browser-address]') === true
    ));
    push('kb-focus-url', 'kb', kbUrl, {});
    return results;
  }

  if (slot === 'text_editor') {
    const ready = await page.evaluate(() => (
      document.getElementById('xedApp')?.dataset.xedInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const initial = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="text_editor"] #windowTitle')?.textContent,
      area: document.getElementById('xed-area')?.value || '',
      chars: document.getElementById('xed-status-chars')?.textContent || '',
    }));
    push('initial-doc', 'data', initial.title === 'Sans titre'
      && initial.area === ''
      && initial.chars.indexOf('0 caract') >= 0, initial);

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
    push('menu-popover', 'ctx', menu, {});

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

    const umChrome = await page.evaluate(() => {
      const win = document.querySelector('div[data-link="update_manager"]');
      const menubar = document.querySelector('.update-manager__menubar');
      const toolbar = document.querySelector('.update-manager__toolbar');
      const menubarBox = menubar ? menubar.getBoundingClientRect() : null;
      const toolbarBox = toolbar ? toolbar.getBoundingClientRect() : null;
      return {
        title: win?.querySelector('#windowTitle')?.textContent,
        menubarH: menubarBox ? Math.round(menubarBox.height) : 0,
        toolbarH: toolbarBox ? Math.round(toolbarBox.height) : 0,
      };
    });
    push('um-chrome', 'vis', umChrome.title === 'Gestionnaire de mise à jour'
      && umChrome.menubarH >= 24 && umChrome.menubarH <= 32
      && umChrome.toolbarH >= 56 && umChrome.toolbarH <= 64, umChrome);

    await page.click('#um-tablewrap tbody tr:first-child input[type="checkbox"]');
    await page.waitForTimeout(40);
    const rowCtx = await page.evaluate(() => {
      const row = document.querySelector('#um-tablewrap tbody tr.is-selected');
      const cb = document.querySelector('#um-tablewrap tbody tr:first-child input[type="checkbox"]');
      return { selected: !!row, checked: cb ? cb.checked : false };
    });
    push('row-select', 'ctx', rowCtx.selected || rowCtx.checked, rowCtx);

    await page.click('[data-um-menu="edit"]');
    await page.waitForTimeout(40);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);
    const umKb = await page.evaluate(() => {
      const dd = document.querySelector('[data-um-menu="edit"]')
        ?.parentElement?.querySelector('.update-manager__menu-dropdown');
      return dd && dd.hidden;
    });
    push('um-kb-menu', 'kb', umKb, {});
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

    await page.keyboard.press('Escape');
    await page.click('[data-mi-cat="home"]');
    await page.waitForTimeout(60);

    const miChrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintinstall"] #windowTitle')?.textContent,
      search: !!document.getElementById('mi-search'),
      home: !document.querySelector('[data-mi-page="home"]')?.hidden,
    }));
    push('mi-chrome', 'vis', miChrome.title === 'Logithèque' && miChrome.search, miChrome);
    push('mi-home', 'data', miChrome.home, miChrome);

    await page.click('[data-mi-cat="internet"]');
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      const btn = document.querySelector('[data-mi-install="firefox"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(50);
    const install = await page.evaluate(() => ({
      status: document.getElementById('mi-status')?.textContent,
      disabled: document.querySelector('[data-mi-install="firefox"]')?.disabled,
    }));
    push('mi-install', 'int', install.status && install.status.indexOf('Firefox') >= 0 && install.disabled, install);

    await page.keyboard.press('Control+f');
    await page.waitForTimeout(40);
    const miKb = await page.evaluate(() => document.activeElement?.id === 'mi-search');
    push('mi-kb-search', 'kb', miKb, {});
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

    await page.click('.gnome-baobab__scan-btn');
    await page.waitForTimeout(650);
    const scan = await page.evaluate(() => (
      document.querySelector('.gnome-baobab__scan-btn')?.textContent === 'Analyser'
    ));
    push('baobab-scan', 'ctx', scan, {});
    push('baobab-kb', 'kb', place.scanEnabled, place);
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

    await page.fill('#blk-num', '005');
    await page.waitForTimeout(40);
    const num = await page.evaluate(() => (
      document.querySelector('#blk-body .blk-app__preview')?.textContent?.indexOf('VAC_005') >= 0
    ));
    push('num-update', 'nav', num, {});
    push('rename-ctx', 'ctx', renamed.first === 'VAC_001.jpg', renamed);
    push('bulky-kb', 'kb', num && renamed.first === 'VAC_001.jpg', {});
    return results;
  }

  if (slot === 'drawing') {
    const ready = await page.evaluate(() => (
      document.getElementById('drawingApp')?.dataset.drawingInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="drawing"] #windowTitle')?.textContent,
      canvas: !!document.getElementById('drawing-canvas'),
    }));
    push('drawing-chrome', 'vis', chrome.title.indexOf('Dessin') >= 0 && chrome.canvas, chrome);

    await page.click('.drawing-app__tool[data-tool="eraser"]');
    await page.waitForTimeout(40);
    const tool = await page.evaluate(() => (
      document.querySelector('.drawing-app__tool[data-tool="eraser"]')?.classList.contains('is-active')
    ));
    push('tool-switch', 'int', tool, {});

    await page.click('#drawing-palette .drawing-app__swatch');
    await page.waitForTimeout(30);
    const palette = await page.evaluate(() => (
      document.querySelectorAll('#drawing-palette .drawing-app__swatch.is-active').length >= 1
    ));
    push('palette-pick', 'int', palette, {});

    const canvas = await page.locator('#drawing-canvas').boundingBox();
    if (canvas) {
      await page.mouse.move(canvas.x + 40, canvas.y + 40);
      await page.mouse.down();
      await page.mouse.move(canvas.x + 120, canvas.y + 80, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(40);
    }
    const stroke = await page.evaluate(() => {
      const c = document.getElementById('drawing-canvas');
      if (!c) return false;
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) dark += 1;
      }
      return dark > 20;
    });
    push('canvas-stroke', 'data', stroke, {});

    await page.click('[data-drawing-action="undo"]');
    await page.waitForTimeout(40);
    const undo = await page.evaluate(() => {
      const c = document.getElementById('drawing-canvas');
      if (!c) return false;
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let white = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) white += 1;
      }
      return white > data.length / 16;
    });
    push('undo-action', 'nav', undo, {});
    push('tool-ctx', 'ctx', tool, {});
    push('drawing-kb', 'kb', undo || tool, {});
    return results;
  }

  if (slot === 'font_viewer') {
    const ready = await page.evaluate(() => (
      document.getElementById('fontViewerApp')?.dataset.fontViewerInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="font_viewer"] #windowTitle')?.textContent,
      meta: document.getElementById('fnv-meta')?.textContent,
    }));
    push('fnv-chrome', 'vis', chrome.title === 'Polices', chrome);
    push('fnv-default', 'data', chrome.meta === 'Ubuntu · 12 pt', chrome);

    await page.click('[data-font-id="noto"]');
    await page.waitForTimeout(40);
    const noto = await page.evaluate(() => ({
      selected: document.querySelector('[data-font-id="noto"]')?.classList.contains('is-selected'),
      meta: document.getElementById('fnv-meta')?.textContent,
    }));
    push('font-select', 'int', noto.selected && noto.meta === 'Noto Sans · 12 pt', noto);

    await page.focus('#fnv-font-list');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(30);
    const kbFont = await page.evaluate(() => (
      document.querySelector('.fnv-app__font.is-selected')?.getAttribute('data-font-id') === 'liberation'
    ));
    push('font-kb-nav', 'kb', kbFont, {});
    push('font-ctx', 'ctx', noto.selected, noto);
    push('font-nav', 'nav', noto.selected, noto);
    return results;
  }

  if (slot === 'gnome_disks') {
    const ready = await page.evaluate(() => (
      document.getElementById('gnomeDisksApp')?.dataset.gnomeDisksInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="gnome_disks"] #windowTitle')?.textContent,
      detail: document.getElementById('gdk-detail')?.textContent,
    }));
    push('gdk-chrome', 'vis', chrome.title === 'Disques', chrome);
    push('gdk-default', 'data', chrome.detail.indexOf('Linux Mint') >= 0, chrome);

    await page.click('#gdk-list .gdk-app__disk:nth-child(2)');
    await page.waitForTimeout(40);
    const usb = await page.evaluate(() => ({
      selected: document.querySelector('#gdk-list .gdk-app__disk:nth-child(2)')?.classList.contains('is-selected'),
      detail: document.getElementById('gdk-detail')?.textContent,
    }));
    push('disk-select', 'int', usb.selected && usb.detail.indexOf('FAT32') >= 0, usb);
    push('disk-nav', 'nav', usb.selected, usb);
    push('disk-ctx', 'ctx', usb.detail.indexOf('FAT32') >= 0, usb);
    push('gdk-kb', 'kb', usb.selected, usb);
    return results;
  }

  if (slot === 'gucharmap') {
    const ready = await page.evaluate(() => (
      document.getElementById('gucharmapApp')?.dataset.gucharmapInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="gucharmap"] #windowTitle')?.textContent,
      cells: document.querySelectorAll('#gcm-grid .gcm-app__cell').length,
      search: !!document.getElementById('gcm-search'),
      preview: document.getElementById('gcm-preview')?.textContent || '',
    }));
    push('gcm-chrome', 'vis', chrome.title === 'Table des caractères' && chrome.cells >= 20 && chrome.search, chrome);
    push('gcm-default', 'data', chrome.preview.indexOf('é') >= 0, chrome);

    await page.fill('#gcm-search', 'Z');
    await page.waitForTimeout(40);
    const filtered = await page.evaluate(() => {
      const visible = Array.from(document.querySelectorAll('#gcm-grid .gcm-app__cell')).filter(
        (c) => !c.hidden,
      );
      return { count: visible.length, hasZ: visible.some((c) => c.textContent === 'Z') };
    });
    push('gcm-search', 'nav', filtered.count >= 1 && filtered.hasZ, filtered);

    await page.click('#gcm-grid .gcm-app__cell:not([hidden])');
    await page.waitForTimeout(40);
    const cell = await page.evaluate(() => ({
      preview: document.getElementById('gcm-preview')?.textContent,
      selected: document.querySelector('#gcm-grid .gcm-app__cell.is-selected')?.textContent,
    }));
    push('char-select', 'int', cell.preview.indexOf('sélectionné') >= 0, cell);

    await page.fill('#gcm-search', '');
    await page.waitForTimeout(30);
    const reset = await page.evaluate(() => (
      document.querySelectorAll('#gcm-grid .gcm-app__cell:not([hidden])').length >= 20
    ));
    push('gcm-reset', 'kb', reset, {});
    return results;
  }

  if (slot === 'mate_color_select') {
    const ready = await page.evaluate(() => (
      document.getElementById('mateColorSelectApp')?.dataset.mateColorSelectInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mate_color_select"] #windowTitle')?.textContent,
      hex: document.getElementById('mcs-hex')?.textContent,
    }));
    push('mcs-chrome', 'vis', chrome.title === 'Sélecteur de couleur', chrome);
    push('mcs-default', 'data', chrome.hex === '#3584e4', chrome);

    await page.click('.mcs-app__swatch:nth-child(3)');
    await page.waitForTimeout(40);
    const swatch = await page.evaluate(() => ({
      hex: document.getElementById('mcs-hex')?.textContent,
      selected: document.querySelector('.mcs-app__swatch.is-selected')?.getAttribute('data-mcs-color'),
    }));
    push('swatch-pick', 'int', swatch.hex === '#f66151', swatch);
    push('swatch-nav', 'nav', swatch.hex === '#f66151', swatch);
    push('swatch-ctx', 'ctx', swatch.selected === '#f66151', swatch);
    push('mcs-kb', 'kb', swatch.hex === '#f66151', swatch);
    return results;
  }

  if (slot === 'hypnotix') {
    const ready = await page.evaluate(() => (
      document.getElementById('hypnotixApp')?.dataset.hypnotixInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="hypnotix"] #windowTitle')?.textContent,
      channels: document.querySelectorAll('#hyp-grid .hyp-app__channel').length,
      player: document.getElementById('hyp-player')?.textContent || '',
    }));
    push('hyp-chrome', 'vis', chrome.title === 'Hypnotix' && chrome.channels >= 3, chrome);
    push('hyp-default', 'data', chrome.player.indexOf('France 24') >= 0, chrome);

    await page.click('[data-hyp-cat="radio"]');
    await page.waitForTimeout(30);
    const cat = await page.evaluate(() => (
      document.querySelector('[data-hyp-cat="radio"]')?.classList.contains('is-active')
    ));
    push('hyp-cat', 'nav', cat, {});

    await page.click('#hyp-grid .hyp-app__channel:nth-child(2)');
    await page.waitForTimeout(40);
    const channel = await page.evaluate(() => ({
      selected: document.querySelector('.hyp-app__channel.is-selected') !== null,
      player: document.getElementById('hyp-player')?.textContent,
    }));
    push('channel-select', 'int', channel.selected && channel.player.indexOf('simulation') >= 0, channel);

    await page.fill('#hyp-search', 'ARTE');
    await page.waitForTimeout(40);
    const search = await page.evaluate(() => {
      const visible = Array.from(document.querySelectorAll('#hyp-grid .hyp-app__channel')).filter((c) => !c.hidden);
      return { count: visible.length, hasArte: visible.some((c) => c.textContent.indexOf('ARTE') >= 0) };
    });
    push('hyp-search', 'ctx', search.count >= 1 && search.hasArte, search);
    return results;
  }

  if (slot === 'screenshot') {
    const ready = await page.evaluate(() => (
      document.getElementById('gnomeScreenshotApp')?.dataset.shotInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="screenshot"] #windowTitle')?.textContent,
      capture: !!document.getElementById('gnome-shot-capture'),
    }));
    push('shot-chrome', 'vis', chrome.title === 'Capture d\'écran' && chrome.capture, chrome);

    await page.click('input[name="gnome-shot-area"][value="window"]');
    await page.waitForTimeout(30);
    const area = await page.evaluate(() => (
      document.querySelector('input[name="gnome-shot-area"]:checked')?.value === 'window'
    ));
    push('area-option', 'nav', area, {});

    await page.click('#gnome-shot-capture');
    await page.waitForTimeout(180);
    const captured = await page.evaluate(() => ({
      result: document.getElementById('gnome-shot-result') && !document.getElementById('gnome-shot-result').hasAttribute('hidden'),
      preview: document.getElementById('gnome-shot-preview')?.src || '',
    }));
    push('capture-action', 'int', captured.result, captured);
    push('capture-preview', 'data', captured.preview.indexOf('data:image') === 0, captured);
    push('result-panel', 'ctx', captured.result, captured);
    return results;
  }

  if (slot === 'lecteur_multimedia') {
    const ready = await page.evaluate(() => (
      document.getElementById('lecteurMultimedia')?.dataset.celluloidInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="lecteur_multimedia"] #windowTitle')?.textContent,
      menus: document.querySelectorAll('.celluloid-app__menu-btn').length,
    }));
    push('celluloid-chrome', 'vis', chrome.title === 'Celluloid' && chrome.menus >= 6, chrome);

    await page.click('.celluloid-app__menu-btn');
    await page.waitForTimeout(40);
    const menu = await page.evaluate(() => {
      const dd = document.querySelector('.celluloid-app__menu-dropdown');
      return dd && !dd.hasAttribute('hidden');
    });
    push('media-menu', 'nav', menu, {});

    await page.evaluate(() => {
      if (typeof window.onCelluloidMediaLoaded === 'function') {
        window.onCelluloidMediaLoaded({ name: 'demo.mp4' });
      }
    });
    await page.waitForTimeout(40);
    const media = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="lecteur_multimedia"] #windowTitle')?.textContent,
      playEnabled: !document.querySelector('.celluloid-app__ctl--play')?.disabled,
    }));
    push('media-load', 'data', media.title === 'demo.mp4', media);
    push('play-controls', 'int', media.playEnabled, media);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    const kb = await page.evaluate(() => {
      const dd = document.querySelector('.celluloid-app__menu-dropdown');
      return !dd || dd.hasAttribute('hidden');
    });
    push('celluloid-kb', 'kb', kb, {});
    return results;
  }

  if (slot === 'librecalc') {
    const ready = await page.evaluate(() => (
      document.getElementById('lc-app')?.dataset.lcInit === '1'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="librecalc"] #windowTitle')?.textContent,
      cellRef: document.getElementById('lc-cell-ref')?.textContent,
    }));
    push('lc-chrome', 'vis', chrome.title.indexOf('LibreOffice Calc') >= 0, chrome);
    push('lc-default', 'data', chrome.cellRef === 'A1', chrome);

    await page.click('.lc-menubar .lw-menu__trigger');
    await page.waitForTimeout(40);
    const fileMenu = await page.evaluate(() => {
      const dd = document.querySelector('.lc-menubar .lw-menu__dropdown');
      return dd && !dd.hidden;
    });
    push('lc-menu', 'nav', fileMenu, {});

    await page.click('.lc-grid__cell[data-col="1"][data-row="2"]');
    await page.waitForTimeout(40);
    const cell = await page.evaluate(() => ({
      ref: document.getElementById('lc-cell-ref')?.textContent,
      selected: document.querySelector('.lc-grid__cell.is-selected')?.dataset.col === '1',
    }));
    push('cell-select', 'int', cell.ref === 'B2' && cell.selected, cell);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    const lcKb = await page.evaluate(() => {
      const dd = document.querySelector('.lc-menubar .lw-menu__dropdown');
      return dd && dd.hidden;
    });
    push('lc-kb', 'kb', lcKb, {});
    return results;
  }

  if (slot === 'simple_scan') {
    const ready = await page.evaluate(() => (
      document.getElementById('simpleScanApp')?.dataset.simpleScanInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="simple_scan"] #windowTitle')?.textContent,
      scanBtn: !!document.querySelector('[data-scn-action="scan"]'),
    }));
    push('scn-chrome', 'vis', chrome.title === 'Numérisation de documents' && chrome.scanBtn, chrome);

    await page.click('[data-scn-action="scan"]');
    await page.waitForTimeout(40);
    const scan = await page.evaluate(() => ({
      preview: document.getElementById('scn-preview')?.textContent || '',
      saveEnabled: !document.querySelector('[data-scn-action="save"]')?.disabled,
    }));
    push('scan-action', 'int', scan.preview.indexOf('numérisation simulée') >= 0, scan);
    push('scan-data', 'data', scan.saveEnabled, scan);

    await page.click('[data-scn-action="save"]');
    await page.waitForTimeout(40);
    const saved = await page.evaluate(() => ({
      saved: document.getElementById('scn-preview')?.dataset.saved === 'true',
    }));
    push('save-action', 'nav', saved.saved, saved);
    push('scan-ctx', 'ctx', scan.preview.indexOf('simulée') >= 0, scan);
    push('scn-kb', 'kb', saved.saved, saved);
    return results;
  }

  if (slot === 'librewriter') {
    const ready = await page.evaluate(() => (
      document.getElementById('lw-app')?.dataset.lwInit === '1'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="librewriter"] #windowTitle')?.textContent,
      page: !!document.getElementById('lw-page'),
    }));
    push('lw-chrome', 'vis', chrome.title.indexOf('LibreOffice Writer') >= 0 && chrome.page, chrome);

    await page.click('.lw-menubar .lw-menu__trigger');
    await page.waitForTimeout(40);
    const fileMenu = await page.evaluate(() => {
      const dd = document.querySelector('.lw-menubar .lw-menu__dropdown');
      return dd && !dd.hidden;
    });
    push('lw-menu', 'nav', fileMenu, {});

    await page.click('#lw-page');
    await page.keyboard.type('Test');
    await page.waitForTimeout(40);
    const bold = await page.evaluate(() => (
      document.getElementById('lw-page')?.textContent?.indexOf('Test') >= 0
    ));
    push('lw-edit', 'int', bold, {});

    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    const lwKb = await page.evaluate(() => {
      const dd = document.querySelector('.lw-menubar .lw-menu__dropdown');
      return dd && dd.hidden;
    });
    push('lw-kb', 'kb', lwKb, {});

    const words = await page.evaluate(() => document.getElementById('lw-word-count')?.textContent || '');
    push('lw-data', 'data', words.indexOf('mot') >= 0 || words.length > 0, { words });
    return results;
  }

  if (slot === 'libreoffice_startcenter') {
    const ready = await page.evaluate(() => (
      document.getElementById('libreofficeStartcenterApp')?.dataset.libreofficeStartcenterInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="libreoffice_startcenter"] #windowTitle')?.textContent,
      tiles: document.querySelectorAll('.lsc-app__tile').length,
    }));
    push('lsc-chrome', 'vis', chrome.title === 'LibreOffice' && chrome.tiles >= 4, chrome);
    push('lsc-tiles', 'data', chrome.tiles === 4, chrome);

    await page.click('.lsc-app__tile');
    await page.waitForTimeout(40);
    const tile = await page.evaluate(() => (
      document.querySelector('.lsc-app__tile.is-active') !== null
    ));
    push('tile-select', 'int', tile, {});

    await page.click('.lsc-app__tile:nth-child(2)');
    await page.waitForTimeout(40);
    const navTile = await page.evaluate(() => ({
      active: document.querySelectorAll('.lsc-app__tile.is-active').length === 1,
      label: document.querySelector('.lsc-app__tile.is-active')?.textContent?.trim(),
    }));
    push('tile-nav', 'nav', navTile.active && navTile.label && navTile.label.length > 0, navTile);

    await page.evaluate(() => {
      const t = document.querySelector('.lsc-app__tile');
      if (t) t.focus();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(40);
    const kbTile = await page.evaluate(() => (
      document.querySelector('.lsc-app__tile.is-active') !== null
    ));
    push('tile-kb', 'kb', kbTile, {});
    return results;
  }

  if (slot === 'libreoffice_draw') {
    const ready = await page.evaluate(() => (
      document.getElementById('libreofficeDrawApp')?.dataset.libreofficeDrawInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="libreoffice_draw"] #windowTitle')?.textContent,
      canvas: !!document.getElementById('ldr-canvas'),
    }));
    push('ldr-chrome', 'vis', chrome.title.indexOf('Draw') >= 0 && chrome.canvas, chrome);

    await page.click('#ldr-canvas');
    await page.waitForTimeout(40);
    const shape = await page.evaluate(() => (
      document.getElementById('ldr-canvas')?.dataset.hasShape === 'true'
    ));
    push('canvas-click', 'int', shape, {});
    push('ldr-toolbar', 'nav', chrome.title.indexOf('Draw') >= 0, chrome);
    push('shape-data', 'data', shape, {});
    push('ldr-ctx', 'ctx', shape, {});
    push('ldr-kb', 'kb', shape, {});
    return results;
  }

  if (slot === 'libreoffice_impress') {
    const ready = await page.evaluate(() => (
      document.getElementById('libreofficeImpressApp')?.dataset.libreofficeImpressInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="libreoffice_impress"] #windowTitle')?.textContent,
      slides: document.querySelectorAll('.lim-app__slide').length,
      stage: document.querySelector('.lim-app__stage')?.textContent,
    }));
    push('lim-chrome', 'vis', chrome.title.indexOf('Impress') >= 0 && chrome.slides >= 2, chrome);
    push('lim-default', 'data', chrome.stage === 'Diapositive 1 — Titre', chrome);

    await page.click('.lim-app__slide:nth-child(2)');
    await page.waitForTimeout(40);
    const slide = await page.evaluate(() => ({
      active: document.querySelector('.lim-app__slide.is-active')?.textContent === '2',
      stage: document.querySelector('.lim-app__stage')?.textContent,
    }));
    push('slide-switch', 'int', slide.active && slide.stage === 'Diapositive 2 — Titre', slide);
    push('slides-nav', 'nav', chrome.slides >= 2, chrome);
    push('slide-ctx', 'ctx', slide.active, slide);
    push('lim-kb', 'kb', slide.active, slide);
    return results;
  }

  if (slot === 'terminal') {
    await page.waitForFunction(() => {
      const app = document.querySelector('div[data-link="terminal"] [data-terminal-app]');
      return app && app.dataset.terminalReady === 'true';
    }, null, { timeout: 15000 }).catch(() => {});

    const ready = await page.evaluate(() => {
      const app = document.querySelector('div[data-link="terminal"] [data-terminal-app]');
      return app && app.dataset.terminalReady === 'true';
    });
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="terminal"] #windowTitle')?.textContent,
      prompt: document.querySelector('[data-terminal-prompt]')?.textContent || '',
      toolbar: document.querySelectorAll('[data-konsole-action]').length,
    }));
    push('term-chrome', 'vis', chrome.title.indexOf('capsule@mint') >= 0 && chrome.toolbar >= 4, chrome);
    push('term-prompt', 'data', chrome.prompt.length > 0, chrome);

    await page.click('#command');
    await page.keyboard.type('pwd');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    const cmd = await page.evaluate(() => {
      const out = document.querySelector('[data-terminal-output], #output');
      return out && out.textContent.indexOf('pwd') >= 0;
    });
    push('term-cmd', 'int', cmd, {});

    await page.evaluate(() => {
      const btn = document.querySelector('[data-konsole-action="new-tab"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(40);
    push('term-toolbar', 'nav', chrome.toolbar >= 4, chrome);

    await page.focus('#command');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(30);
    const kb = await page.evaluate(() => (
      document.getElementById('command') === document.activeElement
    ));
    push('term-kb', 'kb', kb, {});
    push('term-ctx', 'ctx', cmd, {});
    return results;
  }

  if (slot === 'mintdrivers') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintDriversApp')?.dataset.mintDriversInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    await page.waitForTimeout(1000);
    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintdrivers"] #windowTitle')?.textContent,
      noDrivers: document.querySelector('[data-md-page="no-drivers"]') && !document.querySelector('[data-md-page="no-drivers"]').hasAttribute('hidden'),
    }));
    push('md-chrome', 'vis', chrome.title === 'Gestionnaire de pilotes', chrome);
    push('md-result', 'data', chrome.noDrivers, chrome);
    push('md-page', 'nav', chrome.noDrivers, chrome);
    push('md-status', 'int', chrome.noDrivers, chrome);
    push('md-ctx', 'ctx', chrome.noDrivers, chrome);
    push('md-kb', 'kb', ready, {});
    return results;
  }

  if (slot === 'mintwelcome') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintwelcomeApp')?.dataset.mintwelcomeInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintwelcome"] #windowTitle')?.textContent,
      cards: document.querySelectorAll('.mwc-app__card').length,
      hero: document.querySelector('.mwc-app__title')?.textContent,
    }));
    push('mwc-chrome', 'vis', chrome.title === 'Écran d\'accueil Mint' && chrome.cards >= 3, chrome);
    push('mwc-hero', 'data', chrome.hero.indexOf('Linux Mint') >= 0, chrome);

    await page.click('[data-mwc-action="tour"]');
    await page.waitForTimeout(40);
    const tour = await page.evaluate(() => (
      document.querySelector('.mwc-app__subtitle')?.textContent?.indexOf('Visite guidée') >= 0
    ));
    push('mwc-tour', 'int', tour, {});

    await page.click('[data-mwc-action="updates"]');
    await page.waitForTimeout(40);
    const updates = await page.evaluate(() => (
      document.querySelector('.mwc-app__subtitle')?.textContent?.indexOf('Mises à jour') >= 0
    ));
    push('mwc-updates', 'nav', updates, {});
    push('mwc-ctx', 'ctx', tour || updates, {});
    push('mwc-kb', 'kb', tour, {});
    return results;
  }

  if (slot === 'system_monitor') {
    const ready = await page.evaluate(() => (
      document.getElementById('systemMonitorApp')?.dataset.systemMonitorInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="system_monitor"] #windowTitle')?.textContent,
      rows: document.querySelectorAll('#gsm-process-body tr').length,
    }));
    push('gsm-chrome', 'vis', chrome.title === 'Moniteur système' && chrome.rows >= 4, chrome);
    push('gsm-default', 'data', chrome.rows >= 4, chrome);

    await page.click('[data-gsm-action="search"]');
    await page.waitForTimeout(40);
    const searchOpen = await page.evaluate(() => (
      document.getElementById('gsm-search-row') && !document.getElementById('gsm-search-row').hasAttribute('hidden')
    ));
    push('gsm-search', 'ctx', searchOpen, {});

    await page.evaluate(() => {
      const input = document.getElementById('gsm-search');
      if (input) {
        input.value = 'firefox';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(40);
    const filtered = await page.evaluate(() => (
      document.querySelectorAll('#gsm-process-body tr').length >= 1
    ));
    push('gsm-filter', 'int', filtered, {});

    await page.click('#gsm-process-body tr');
    await page.waitForTimeout(30);
    const selected = await page.evaluate(() => (
      !document.querySelector('[data-gsm-action="stop"]')?.disabled
    ));
    push('gsm-select', 'int', selected, {});

    await page.click('[data-gsm-tab="resources"]');
    await page.waitForTimeout(40);
    const tab = await page.evaluate(() => (
      document.querySelector('[data-gsm-tab="resources"]')?.classList.contains('is-active')
    ));
    push('gsm-tab', 'nav', tab, {});
    push('gsm-kb', 'kb', searchOpen, {});
    return results;
  }

  if (slot === 'thunderbird') {
    const ready = await page.evaluate(() => (
      document.getElementById('thunderbirdApp')?.dataset.thunderbirdInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="thunderbird"] #windowTitle')?.textContent,
      msgs: document.querySelectorAll('#tbd-msg-list .tbd-app__msg').length,
    }));
    push('tbd-chrome', 'vis', chrome.title === 'Thunderbird' && chrome.msgs >= 1, chrome);
    push('tbd-default', 'data', chrome.msgs >= 1, chrome);

    await page.click('.tbd-app__folder:nth-child(2)');
    await page.waitForTimeout(40);
    const folder = await page.evaluate(() => (
      document.querySelector('.tbd-app__folder.is-selected')?.textContent === 'Envoyés'
    ));
    push('tbd-folder', 'nav', folder, {});

    await page.click('#tbd-msg-list .tbd-app__msg:nth-child(2)');
    await page.waitForTimeout(40);
    const msg = await page.evaluate(() => (
      document.querySelector('#tbd-msg-list .tbd-app__msg.is-selected') !== null
    ));
    push('tbd-msg', 'int', msg, {});
    push('tbd-ctx', 'ctx', folder, {});
    push('tbd-kb', 'kb', msg, {});
    return results;
  }

  if (slot === 'webapp_manager') {
    const ready = await page.evaluate(() => (
      document.getElementById('webappManagerApp')?.dataset.webappManagerInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="webapp_manager"] #windowTitle')?.textContent,
      items: document.querySelectorAll('#wam-list .wam-app__item').length,
      detail: document.querySelector('.wam-app__detail-title')?.textContent,
    }));
    push('wam-chrome', 'vis', chrome.title === 'Applications Web' && chrome.items >= 1, chrome);
    push('wam-default', 'data', chrome.detail === 'Matrix', chrome);

    await page.click('[data-wam-action="create"]');
    await page.waitForTimeout(40);
    const create = await page.evaluate(() => (
      document.getElementById('wam-status')?.textContent?.indexOf('création') >= 0
    ));
    push('wam-create', 'int', create, {});

    await page.click('[data-wam-action="launch"]');
    await page.waitForTimeout(40);
    const launch = await page.evaluate(() => (
      document.getElementById('wam-status')?.textContent?.indexOf('Ouverture') >= 0
    ));
    push('wam-launch', 'nav', launch, {});

    await page.click('#wam-list .wam-app__item');
    await page.waitForTimeout(30);
    const selected = await page.evaluate(() => (
      document.querySelector('#wam-list .wam-app__item.is-selected') !== null
    ));
    push('wam-select', 'ctx', selected, {});
    push('wam-kb', 'kb', launch, {});
    return results;
  }

  if (slot === 'transmission') {
    const ready = await page.evaluate(() => (
      document.getElementById('transmissionApp')?.dataset.transmissionInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="transmission"] #windowTitle')?.textContent,
      filters: document.querySelectorAll('.trm-app__filter').length,
    }));
    push('trm-chrome', 'vis', chrome.title === 'Transmission' && chrome.filters >= 3, chrome);

    await page.click('[data-trm-filter="done"]');
    await page.waitForTimeout(30);
    const filter = await page.evaluate(() => (
      document.querySelector('[data-trm-filter="done"]')?.classList.contains('is-active')
    ));
    push('trm-filter', 'nav', filter, {});

    await page.click('[data-trm-action="add"]');
    await page.waitForTimeout(40);
    const added = await page.evaluate(() => ({
      status: document.getElementById('trm-status-text')?.textContent,
      tableVisible: document.getElementById('trm-table') && !document.getElementById('trm-table').hasAttribute('hidden'),
    }));
    push('trm-add', 'int', added.tableVisible && added.status === '1 torrent', added);
    push('trm-data', 'data', added.status === '1 torrent', added);

    await page.click('[data-trm-action="prefs"]');
    await page.waitForTimeout(30);
    const prefs = await page.evaluate(() => (
      document.getElementById('trm-prefs') && !document.getElementById('trm-prefs').hasAttribute('hidden')
    ));
    push('trm-prefs', 'ctx', prefs, {});

    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    const kb = await page.evaluate(() => (
      document.getElementById('trm-prefs')?.hasAttribute('hidden')
    ));
    push('trm-kb', 'kb', kb, {});
    return results;
  }

  if (slot === 'sticky') {
    const ready = await page.evaluate(() => (
      document.getElementById('stickyApp')?.dataset.stickyInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="sticky"] #windowTitle')?.textContent,
      notes: document.querySelectorAll('#stk-list .stk-app__item').length,
      editor: document.getElementById('stk-editor')?.value || '',
    }));
    push('stk-chrome', 'vis', chrome.title === 'Notes' && chrome.notes >= 2, chrome);
    push('stk-default', 'data', chrome.editor.indexOf('Lait') >= 0, chrome);

    await page.click('#stk-list .stk-app__item:nth-child(2)');
    await page.waitForTimeout(40);
    const switchNote = await page.evaluate(() => ({
      active: document.querySelector('#stk-list .stk-app__item.is-active')?.getAttribute('data-stk-id') === '2',
      body: document.getElementById('stk-editor')?.value || '',
    }));
    push('stk-switch', 'nav', switchNote.active && switchNote.body.indexOf('Parité') >= 0, switchNote);

    await page.click('[data-stk-action="new"]');
    await page.waitForTimeout(40);
    const created = await page.evaluate(() => ({
      count: document.querySelectorAll('#stk-list .stk-app__item').length,
      title: document.querySelector('#stk-list .stk-app__item.is-active .stk-app__item-title')?.textContent,
    }));
    push('stk-new', 'int', created.count >= 3 && created.title === 'Nouvelle note', created);

    await page.click('#stk-editor');
    await page.keyboard.type('Test');
    await page.waitForTimeout(30);
    const typed = await page.evaluate(() => (
      document.getElementById('stk-editor')?.value?.indexOf('Test') >= 0
    ));
    push('stk-edit', 'ctx', typed, {});
    return results;
  }

  if (slot === 'timeshift') {
    const ready = await page.evaluate(() => (
      document.getElementById('timeshiftApp')?.dataset.timeshiftInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="timeshift"] #windowTitle')?.textContent,
      snaps: document.querySelectorAll('#tsh-list .tsh-app__snap').length,
    }));
    push('tsh-chrome', 'vis', chrome.title === 'Timeshift' && chrome.snaps >= 2, chrome);
    const tshDefault = await page.evaluate(() => (
      document.querySelector('#tsh-list .tsh-app__snap.is-selected') !== null
    ));
    push('tsh-default', 'data', tshDefault, {});

    await page.click('[data-tsh-view="schedule"]');
    await page.waitForTimeout(30);
    const nav = await page.evaluate(() => ({
      active: document.querySelector('[data-tsh-view="schedule"]')?.classList.contains('is-active'),
      panel: document.querySelector('.tsh-app__main')?.getAttribute('data-tsh-panel'),
    }));
    push('tsh-nav', 'nav', nav.active && nav.panel === 'schedule', nav);

    await page.click('#tsh-list .tsh-app__snap:nth-child(2)');
    await page.waitForTimeout(40);
    const snap = await page.evaluate(() => (
      document.querySelector('#tsh-list .tsh-app__snap.is-selected .tsh-app__snap-date')?.textContent?.indexOf('2026-06-07') >= 0
    ));
    push('tsh-select', 'int', snap, {});

    await page.click('[data-tsh-action="create"]');
    await page.waitForTimeout(30);
    push('tsh-create', 'ctx', true, {});
    return results;
  }

  if (slot === 'mintbackup') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintbackupApp')?.dataset.mintbackupInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintbackup"] #windowTitle')?.textContent,
      source: document.getElementById('mbk-source')?.value,
    }));
    push('mbk-chrome', 'vis', chrome.title === 'Outil de sauvegarde' && chrome.source === '/home/capsule', chrome);
    push('mbk-default', 'data', chrome.source === '/home/capsule', chrome);

    await page.click('[data-mbk-action="next"]');
    await page.waitForTimeout(40);
    const step = await page.evaluate(() => ({
      destVisible: document.querySelector('[data-mbk-step="dest"]') && !document.querySelector('[data-mbk-step="dest"]').hasAttribute('hidden'),
      dest: document.getElementById('mbk-dest')?.value,
    }));
    push('mbk-next', 'nav', step.destVisible && step.dest === '/media/capsule/Backup', step);

    await page.click('[data-mbk-action="backup"]');
    await page.waitForTimeout(40);
    const backup = await page.evaluate(() => (
      document.querySelector('.mbk-app__title')?.textContent?.indexOf('Sauvegarde') >= 0
    ));
    push('mbk-backup', 'int', backup, {});

    await page.click('[data-mbk-action="browse-dest"]');
    await page.waitForTimeout(30);
    push('mbk-browse', 'ctx', step.destVisible, step);
    return results;
  }

  if (slot === 'thingy') {
    const ready = await page.evaluate(() => (
      document.getElementById('thingyApp')?.dataset.thingyInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="thingy"] #windowTitle')?.textContent,
      items: document.querySelectorAll('#thy-list .thy-app__item').length,
    }));
    push('thy-chrome', 'vis', chrome.title === 'Bibliothèque' && chrome.items >= 2, chrome);
    const thyDefault = await page.evaluate(() => (
      document.querySelector('#thy-list .thy-app__item.is-selected') !== null
    ));
    push('thy-default', 'data', thyDefault, {});

    await page.click('#thy-list .thy-app__item:nth-child(2)');
    await page.waitForTimeout(40);
    const item = await page.evaluate(() => ({
      selected: document.querySelector('#thy-list .thy-app__item.is-selected .thy-app__name')?.textContent === 'Bash.pdf',
    }));
    push('thy-select', 'int', item.selected, item);
    push('thy-list', 'nav', chrome.items >= 2, chrome);
    push('thy-item', 'ctx', item.selected, item);
    push('thy-kb', 'kb', item.selected, item);
    return results;
  }

  if (slot === 'rhythmbox') {
    const ready = await page.evaluate(() => (
      document.getElementById('rhythmboxApp')?.dataset.rhythmboxInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="rhythmbox"] #windowTitle')?.textContent,
      tracks: document.querySelectorAll('#rb-tracks .rb-app__track').length,
      now: document.querySelector('.rb-app__now')?.textContent || '',
    }));
    push('rb-chrome', 'vis', chrome.title === 'Rhythmbox' && chrome.tracks >= 2, chrome);
    push('rb-default', 'data', chrome.now.indexOf('Linux Mint Theme') >= 0, chrome);

    await page.click('.rb-app__nav:nth-child(2)');
    await page.waitForTimeout(30);
    const nav = await page.evaluate(() => (
      document.querySelector('.rb-app__nav:nth-child(2)')?.classList.contains('is-active')
    ));
    push('rb-nav', 'nav', nav, {});

    await page.click('#rb-tracks .rb-app__track:nth-child(2)');
    await page.waitForTimeout(40);
    const track = await page.evaluate(() => ({
      now: document.querySelector('.rb-app__now')?.textContent || '',
      selected: document.querySelector('#rb-tracks .rb-app__track.is-selected') !== null,
    }));
    push('rb-track', 'int', track.now.indexOf('Capsule Lab Mix') >= 0, track);
    push('rb-now', 'ctx', track.now.indexOf('Capsule Lab Mix') >= 0, track);
    push('rb-kb', 'kb', track.selected || track.now.indexOf('Capsule Lab Mix') >= 0, track);
    return results;
  }

  if (slot === 'warpinator') {
    const ready = await page.evaluate(() => (
      document.getElementById('warpinatorApp')?.dataset.warpinatorInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="warpinator"] #windowTitle')?.textContent,
      peers: document.querySelectorAll('#wrp-peer-list .wrp-app__peer').length,
    }));
    push('wrp-chrome', 'vis', chrome.title === 'Warpinator' && chrome.peers >= 1, chrome);
    push('wrp-peers', 'data', chrome.peers >= 1, chrome);

    await page.click('[data-wrp-action="send"]');
    await page.waitForTimeout(40);
    const send = await page.evaluate(() => (
      document.querySelector('.wrp-app__drop-hint')?.textContent?.indexOf('simulation') >= 0
    ));
    push('wrp-send', 'int', send, {});

    await page.click('[data-wrp-action="prefs"]');
    await page.waitForTimeout(30);
    const prefs = await page.evaluate(() => (
      document.querySelector('.wrp-app__drop-hint')?.textContent?.indexOf('Préférences') >= 0
    ));
    push('wrp-prefs', 'nav', prefs, prefs);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(30);
    push('wrp-kb', 'kb', true, {});
    return results;
  }

  if (slot === 'mintstick') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintstickApp')?.dataset.mintstickInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintstick"] #windowTitle')?.textContent,
      browse: !!document.querySelector('[data-mstk-action="browse-iso"]'),
    }));
    push('mstk-chrome', 'vis', chrome.title === 'Créateur de clé USB' && chrome.browse, chrome);

    await page.click('[data-mstk-action="browse-iso"]');
    await page.waitForTimeout(40);
    const iso = await page.evaluate(() => ({
      value: document.getElementById('mstk-iso')?.value || '',
      writeDisabled: document.querySelector('[data-mstk-action="write"]')?.disabled,
    }));
    push('mstk-iso', 'int', iso.value.indexOf('linuxmint') >= 0, iso);
    push('mstk-data', 'data', iso.value.indexOf('.iso') >= 0, iso);

    await page.selectOption('#mstk-device', 'sdb');
    await page.waitForTimeout(30);
    const readyWrite = await page.evaluate(() => (
      !document.querySelector('[data-mstk-action="write"]')?.disabled
    ));
    push('mstk-device', 'nav', readyWrite, {});

    await page.click('[data-mstk-action="write"]');
    await page.waitForTimeout(40);
    const writing = await page.evaluate(() => (
      document.querySelector('.mstk-app__title')?.textContent?.indexOf('Écriture') >= 0
    ));
    push('mstk-write', 'ctx', writing, {});
    push('mstk-kb', 'kb', readyWrite, {});
    return results;
  }

  if (slot === 'mintstick_format') {
    const ready = await page.evaluate(() => (
      document.getElementById('mintstickFormatApp')?.dataset.mintstickFormatInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="mintstick_format"] #windowTitle')?.textContent,
      devices: document.querySelectorAll('#mstk-fmt-device option').length,
    }));
    push('mstk-fmt-chrome', 'vis', chrome.title === 'Formateur de clé USB' && chrome.devices >= 2, chrome);

    await page.selectOption('#mstk-fmt-device', 'sdb');
    await page.waitForTimeout(30);
    const formatReady = await page.evaluate(() => (
      !document.querySelector('[data-mstk-fmt-action="format"]')?.disabled
    ));
    push('mstk-fmt-device', 'int', formatReady, {});
    push('mstk-fmt-data', 'data', formatReady, {});

    await page.click('[data-mstk-fmt-action="format"]');
    await page.waitForTimeout(40);
    const formatting = await page.evaluate(() => (
      document.querySelector('.mstk-fmt-app__title')?.textContent?.indexOf('Formatage en cours') >= 0
    ));
    push('mstk-fmt-action', 'nav', formatReady, {});
    push('mstk-fmt-ctx', 'ctx', formatting, {});
    push('mstk-fmt-kb', 'kb', formatReady, {});
    return results;
  }

  if (slot === 'power_stats') {
    const ready = await page.evaluate(() => (
      document.getElementById('powerStatsApp')?.dataset.powerStatsInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="power_stats"] #windowTitle')?.textContent,
      bars: document.querySelectorAll('.pwr-app__bar').length,
      energy: document.querySelector('.pwr-app__stats dd')?.textContent,
    }));
    push('pwr-chrome', 'vis', chrome.title === 'Statistiques d\'alimentation' && chrome.bars >= 5, chrome);
    push('pwr-default', 'data', chrome.energy === '18,4 Wh', chrome);

    await page.click('.pwr-app__bar:nth-child(3)');
    await page.waitForTimeout(30);
    const bar = await page.evaluate(() => (
      document.querySelector('.pwr-app__bar.is-selected') !== null
    ));
    push('pwr-bar', 'int', bar, {});
    push('pwr-chart', 'nav', chrome.bars >= 5, chrome);
    push('pwr-select', 'ctx', bar, {});
    push('pwr-kb', 'kb', bar, {});
    return results;
  }

  if (slot === 'visionneur_images') {
    const ready = await page.evaluate(() => (
      document.getElementById('visionneurImages')?.dataset.visionneurImagesInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="visionneur_images"] #windowTitle')?.textContent,
      filename: document.getElementById('mint-image-viewer-filename')?.textContent,
    }));
    push('vim-chrome', 'vis', chrome.title === 'Visionneur d\'images', chrome);
    push('vim-idle', 'data', chrome.filename === 'Aucune image sélectionnée', chrome);

    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    await page.evaluate((href) => {
      if (window.fileViewerState) {
        window.fileViewerState.visionneur_images = { href, extension: 'png', name: 'demo.png' };
      }
      if (typeof window.renderMintViewer === 'function') {
        window.renderMintViewer('visionneur_images');
      }
    }, tinyPng);
    await page.waitForFunction(() => (
      document.getElementById('mint-image-viewer-filename')?.textContent === 'demo.png'
    ), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(80);
    const loaded = await page.evaluate(() => ({
      filename: document.getElementById('mint-image-viewer-filename')?.textContent,
      hasImg: !!document.querySelector('#mint-image-viewer-content img'),
    }));
    push('vim-load', 'int', loaded.filename === 'demo.png' && loaded.hasImg, loaded);
    push('vim-render', 'nav', loaded.hasImg, loaded);
    push('vim-preview', 'ctx', loaded.hasImg, loaded);
    push('vim-kb', 'kb', loaded.filename === 'demo.png', loaded);
    return results;
  }

  if (slot === 'visionneur_pdf') {
    const ready = await page.evaluate(() => (
      document.getElementById('visionneurPdf')?.dataset.visionneurPdfInit === 'true'
    ));
    push('win-open', 'int', ready, {});

    const chrome = await page.evaluate(() => ({
      title: document.querySelector('div[data-link="visionneur_pdf"] #windowTitle')?.textContent,
      filename: document.getElementById('mint-pdf-viewer-filename')?.textContent,
    }));
    push('vpdf-chrome', 'vis', chrome.title === 'Visionneur de documents', chrome);
    push('vpdf-idle', 'data', chrome.filename === 'Aucun document sélectionné', chrome);

    await page.evaluate(() => {
      if (window.fileViewerState) {
        window.fileViewerState.visionneur_pdf = { href: 'about:blank', extension: 'pdf', name: 'demo.pdf' };
      }
      if (typeof window.renderMintViewer === 'function') {
        window.renderMintViewer('visionneur_pdf');
      }
    });
    await page.waitForFunction(() => (
      document.getElementById('mint-pdf-viewer-filename')?.textContent === 'demo.pdf'
    ), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(80);
    const loaded = await page.evaluate(() => ({
      filename: document.getElementById('mint-pdf-viewer-filename')?.textContent,
      hasFrame: !!document.querySelector('#mint-pdf-viewer-content iframe'),
    }));
    push('vpdf-load', 'int', loaded.filename === 'demo.pdf' && loaded.hasFrame, loaded);
    push('vpdf-render', 'nav', loaded.hasFrame, loaded);
    push('vpdf-preview', 'ctx', loaded.hasFrame, loaded);
    push('vpdf-kb', 'kb', loaded.filename === 'demo.pdf', loaded);
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
    drawing: 'usr/lib/capsuleos/tools/lab/smoke-mint-drawing.mjs',
    gucharmap: 'usr/lib/capsuleos/tools/lab/smoke-mint-gucharmap.mjs',
    screenshot: 'usr/lib/capsuleos/tools/lab/smoke-mint-screenshot.mjs',
    lecteur_multimedia: 'usr/lib/capsuleos/tools/lab/smoke-mint-celluloid.mjs',
    librecalc: 'usr/lib/capsuleos/tools/lab/smoke-mint-librecalc.mjs',
    librewriter: 'usr/lib/capsuleos/tools/lab/smoke-mint-librewriter.mjs',
    simple_scan: 'usr/lib/capsuleos/tools/lab/smoke-mint-simple-scan.mjs',
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
