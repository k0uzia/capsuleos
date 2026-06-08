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

    const menu = await page.evaluate(() => {
      const t = document.querySelector('.xed-menu__trigger');
      if (t) t.click();
      const dd = document.querySelector('.xed-menu__dropdown');
      const open = dd && !dd.hidden;
      if (open) {
        document.querySelectorAll('.xed-menu__dropdown').forEach((d) => { d.hidden = true; });
      }
      return open;
    });
    await page.waitForTimeout(50);
    push('menu-fichier', 'nav', menu, {});

    await page.fill('#xed-area', 'parity');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');
    await page.fill('#xed-area', '');
    await page.click('#xed-toolbar [data-xed-action="paste"]');
    await page.waitForTimeout(50);
    const paste = await page.evaluate(() => document.getElementById('xed-area')?.value);
    push('toolbar-paste', 'int', paste === 'parity', { paste });
    push('kb-shortcuts', 'kb', paste === 'parity', {});
    return results;
  }

  if (slot === 'calculator') {
    const ready = await page.evaluate(() => (
      document.getElementById('gnomeCalculatorApp')?.dataset.calcInit === 'true'
    ));
    push('win-open', 'int', ready, {});

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
    return results;
  }

  if (slot === 'file_roller') {
    const empty = await page.evaluate(() => {
      const app = document.getElementById('fileRollerApp');
      return app?.dataset.fileRollerInit === 'true'
        && !document.getElementById('fr-empty')?.hidden;
    });
    push('empty-state', 'data', empty, {});

    await page.click('[data-fr-action="menu"]');
    await page.waitForTimeout(50);
    await page.click('[data-fr-menu="open-demo"]');
    await page.waitForTimeout(60);
    const open = await page.evaluate(() => (
      document.querySelector('div[data-link="file_roller"] #windowTitle')?.textContent === 'demo.zip'
    ));
    push('open-demo', 'int', open, {});
    return results;
  }

  if (slot === 'update_manager') {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('capsule-mintupdate-welcome-dismissed');
      } catch (e) { /* ignore */ }
    });
    await openMintSlot(page, slot);
    const welcome = await page.evaluate(() => !document.getElementById('um-welcome')?.hidden);
    push('welcome-screen', 'data', welcome, {});
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
  const page = await browser.newPage();
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
