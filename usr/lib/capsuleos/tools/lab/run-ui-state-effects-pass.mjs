#!/usr/bin/env node
/**
 * Passe effets d'état UI — shell (menu/panel/desktop) + apps déclarées.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --shell mainMenu,panel,desktop --write
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --apps nemo,calculator
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  loadParityIndex,
  saveParityIndex,
  updateShellParity,
  dimensionScoresFromChecks,
  computePiApp,
  parityStatus,
} from './parity-index-lib.mjs';
import { chromePath, openMintMainMenu, openMintSlot, waitMintReady } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const tools = path.join(ROOT, 'usr/lib/capsuleos/tools');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    apps: null,
    shell: null,
    id: 'linux-mint',
    write: false,
    json: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--apps' && args[i + 1]) opts.apps = args[++i].split(',');
    else if (a === '--shell' && args[i + 1]) opts.shell = args[++i].split(',');
    else if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--write') opts.write = true;
    else if (a === '--json') opts.json = true;
  }
  return opts;
};

const run = (rel, extraArgs) => {
  const script = path.join(ROOT, rel);
  const res = spawnSync('node', [script, ...(extraArgs || [])], {
    encoding: 'utf8',
    cwd: ROOT,
    timeout: 120000,
  });
  return {
    script: rel,
    ok: res.status === 0,
    status: res.status,
    stderr: (res.stderr || '').trim().slice(0, 400),
  };
};

async function runShellChecks(page, surfaces) {
  const report = { surfaces: {} };

  for (const surface of surfaces) {
    const checks = [];
    const push = (id, dimension, pass, detail) => {
      checks.push({ id, dimension, pass, detail });
    };

    if (surface === 'mainMenu') {
      await openMintMainMenu(page);
      await page.waitForTimeout(50);
      const open = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        const r = m ? m.getBoundingClientRect() : null;
        const footer = document.querySelector('footer')?.getBoundingClientRect();
        return {
          display: m ? getComputedStyle(m).display : 'none',
          hasRoot: !!m?.querySelector('.menu-root'),
          aboveFooter: r && footer ? r.bottom <= footer.top + 4 : false,
        };
      });
      push('menu-open', 'nav', open.display !== 'none' && open.hasRoot, open);
      const layout = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        const r = m ? m.getBoundingClientRect() : null;
        return {
          width: r ? Math.round(r.width) : 0,
          hasRoot: !!m?.querySelector('.menu-root'),
        };
      });
      push('menu-layout', 'vis', layout.width >= 320 && layout.hasRoot, layout);

      await page.fill('#menu-search', 'Firefox');
      await page.waitForTimeout(80);
      const search = await page.evaluate(() => (
        document.querySelectorAll('#menu-app-list .menu-app-item:not(.is-unavailable)').length >= 1
      ));
      push('menu-search', 'int', search, {});

      await page.evaluate(() => {
        const item = document.querySelector('#menu-app-list .menu-app-item:not(.is-unavailable)');
        if (!item) {
          return;
        }
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 280,
          clientY: 220,
        });
        item.dispatchEvent(event);
      });
      await page.waitForTimeout(80);
      const menuCtx = await page.evaluate(() => {
        const ctxMenu = document.getElementById('menu-app-context-menu');
        return ctxMenu && !ctxMenu.hidden && !ctxMenu.hasAttribute('hidden');
      });
      push('menu-app-ctx', 'ctx', menuCtx, {});

      await page.keyboard.press('Escape');
      await page.waitForTimeout(40);
      const ctxClosed = await page.evaluate(() => {
        const ctxMenu = document.getElementById('menu-app-context-menu');
        return !ctxMenu || ctxMenu.hidden || ctxMenu.hasAttribute('hidden');
      });
      push('menu-ctx-kb', 'kb', ctxClosed, {});

      push('menu-data', 'data', search, {});

      await page.keyboard.press('Escape');
      await page.waitForTimeout(40);
      const kb = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        return m && getComputedStyle(m).display === 'none';
      });
      push('menu-kb', 'kb', kb, {});
    }

    if (surface === 'panel') {
      const panelSlot = 'firefox';
      await openMintSlot(page, panelSlot);
      await page.waitForFunction(() => {
        if (window.CapsuleTaskbarWindowList && typeof window.CapsuleTaskbarWindowList.refresh === 'function') {
          window.CapsuleTaskbarWindowList.refresh();
        }
        return document.querySelectorAll('#taskbar-window-list .taskbar-window-list__btn').length >= 1;
      }, null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(80);
      const list = await page.evaluate((slot) => {
        const links = document.querySelectorAll('#taskbar-window-list .taskbar-window-list__btn');
        const activeBtn = document.querySelector('#taskbar-window-list .taskbar-window-list__btn[data-window-link="' + slot + '"]');
        return {
          count: links.length,
          slotActive: activeBtn ? activeBtn.classList.contains('is-active') : false,
          slot,
        };
      }, panelSlot);
      push('window-list', 'nav', list.count >= 1, list);
      push('panel-vis', 'vis', list.slotActive, list);

      const focus = await page.evaluate((slot) => {
        const win = document.querySelector('div[data-link="' + slot + '"]');
        return win && win.style.display !== 'none';
      }, panelSlot);
      push('panel-focus', 'int', focus, {});

      await page.evaluate(() => {
        if (window.CapsuleTaskbarWindowList && typeof window.CapsuleTaskbarWindowList.refresh === 'function') {
          window.CapsuleTaskbarWindowList.refresh();
        }
      });
      await page.locator('#taskbar-window-list .taskbar-window-list__btn[data-window-link="' + panelSlot + '"]').click({ force: true });
      await page.waitForFunction((slot) => {
        const win = document.querySelector('div[data-link="' + slot + '"]');
        return win && win.style.display === 'none';
      }, panelSlot, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(40);
      const minimized = await page.evaluate((slot) => {
        const win = document.querySelector('div[data-link="' + slot + '"]');
        const btn = document.querySelector('#taskbar-window-list .taskbar-window-list__btn[data-window-link="' + slot + '"]');
        return {
          hidden: win && win.style.display === 'none',
          isMinimized: btn && btn.classList.contains('is-minimized'),
        };
      }, panelSlot);
      push('panel-minimize', 'ctx', minimized.hidden && minimized.isMinimized, minimized);

      await page.evaluate(() => {
        const btn = document.querySelector('#taskbar-window-list .taskbar-window-list__btn.is-minimized');
        if (btn) btn.focus();
      });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(60);
      const restored = await page.evaluate((slot) => {
        const win = document.querySelector('div[data-link="' + slot + '"]');
        return win && win.style.display !== 'none';
      }, panelSlot);
      push('panel-restore-kb', 'kb', restored, {});

      push('panel-data', 'data', list.count >= 1, list);
    }

    if (surface === 'tray') {
      const trayVis = await page.evaluate(() => ({
        buttons: document.querySelectorAll('.taskbar-tray__btn').length,
      }));
      push('tray-vis', 'vis', trayVis.buttons >= 6, trayVis);
      push('tray-data', 'data', trayVis.buttons >= 6, trayVis);

      await page.click('#tray-btn-network');
      await page.waitForTimeout(70);
      const pop = await page.evaluate(() => {
        const btn = document.getElementById('tray-btn-network');
        const panel = document.getElementById('mint-tray-popover-network');
        return {
          expanded: btn ? btn.getAttribute('aria-expanded') === 'true' : false,
          open: panel && !panel.hasAttribute('hidden'),
        };
      });
      push('tray-popover', 'nav', pop.expanded && pop.open, pop);
      push('tray-int', 'int', pop.open, pop);
      push('tray-ctx', 'ctx', pop.open, pop);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(45);
      const kb = await page.evaluate(() => {
        const panel = document.getElementById('mint-tray-popover-network');
        return panel && panel.hasAttribute('hidden');
      });
      push('tray-kb', 'kb', kb, {});
    }

    if (surface === 'clock') {
      const clockVis = await page.evaluate(() => ({
        time: document.getElementById('taskbar-clock')?.textContent?.length >= 4,
        trigger: !!document.getElementById('taskbar-clock-trigger'),
      }));
      push('clock-vis', 'vis', clockVis.time && clockVis.trigger, clockVis);
      push('clock-data', 'data', clockVis.time, clockVis);

      await page.click('#taskbar-clock-trigger');
      await page.waitForTimeout(80);
      const pop = await page.evaluate(() => ({
        open: document.getElementById('taskbar-calendar-popover') && !document.getElementById('taskbar-calendar-popover').hidden,
        month: document.getElementById('cal-month-label')?.textContent || '',
      }));
      push('clock-popover', 'nav', pop.open, pop);
      push('clock-int', 'int', pop.open, pop);
      push('clock-ctx', 'ctx', pop.open && pop.month.length > 0, pop);

      await page.click('#cal-next-month');
      await page.waitForTimeout(50);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(45);
      const kb = await page.evaluate(() => (
        document.getElementById('taskbar-calendar-popover')?.hidden
      ));
      push('clock-kb', 'kb', kb, {});
    }

    if (surface === 'theme') {
      const themeState = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
      }));
      push('theme-vis', 'vis', themeState.theme === 'dark' || themeState.theme === 'light', themeState);
      push('theme-data', 'data', !!themeState.theme, themeState);

      await openMintSlot(page, 'themes');
      await page.waitForTimeout(200);
      await page.click('[data-cs-nav="themes"]');
      await page.waitForTimeout(80);
      await page.click('#cinnamonSettingsApp [data-theme-option="light"]');
      await page.waitForTimeout(60);
      const light = await page.evaluate(() => (
        document.documentElement.dataset.theme === 'light'
      ));
      push('theme-toggle', 'int', light, {});

      await page.click('#cinnamonSettingsApp .themes-app__select');
      await page.waitForTimeout(50);
      const pop = await page.evaluate(() => {
        const p = document.getElementById('themes-style-popover');
        return p && !p.hidden;
      });
      push('theme-popover', 'ctx', pop, {});

      await page.evaluate(() => {
        const opt = document.querySelector('#cinnamonSettingsApp [data-theme-option="dark"]');
        if (opt) opt.focus();
      });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(60);
      const kb = await page.evaluate(() => (
        document.documentElement.dataset.theme === 'dark'
      ));
      push('theme-kb', 'kb', kb, {});
      push('theme-nav', 'nav', light || kb, {});
    }

    if (surface === 'altTab') {
      await openMintSlot(page, 'nemo');
      await openMintSlot(page, 'firefox');
      await page.waitForTimeout(80);
      await page.keyboard.down('Alt');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(60);
      const altOpen = await page.evaluate(() => {
        const overlay = document.getElementById('cinnamon-alt-tab');
        const items = overlay ? overlay.querySelectorAll('.cinnamon-alt-tab__item').length : 0;
        return {
          open: overlay && !overlay.hidden,
          items,
        };
      });
      push('alt-tab-open', 'nav', altOpen.open && altOpen.items >= 2, altOpen);
      push('alt-tab-vis', 'vis', altOpen.open, altOpen);
      push('alt-tab-data', 'data', altOpen.items >= 2, altOpen);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(50);
      const altClosed = await page.evaluate(() => {
        const overlay = document.getElementById('cinnamon-alt-tab');
        return overlay && overlay.hidden;
      });
      push('alt-tab-kb', 'kb', altClosed, {});

      await page.keyboard.up('Alt');
      push('alt-tab-int', 'int', altOpen.open, altOpen);
      push('alt-tab-ctx', 'ctx', altOpen.items >= 1, altOpen);
    }

    if (surface === 'windowChrome') {
      await openMintSlot(page, 'nemo');
      await page.waitForTimeout(80);
      const chrome = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        const header = win ? win.querySelector(':scope > #windowHeader') : null;
        const btn = header ? header.querySelector('#minimizeBtn') : null;
        const cs = (el) => (el ? getComputedStyle(el) : null);
        const px = (v) => parseFloat(v) || 0;
        const headerRect = header ? header.getBoundingClientRect() : null;
        const winRect = win ? win.getBoundingClientRect() : null;
        const btnCs = cs(btn);
        const winCs = cs(win);
        const parts = (btnCs ? btnCs.backgroundSize : '').split(/\s+/);
        return {
          toolkit: win ? win.getAttribute('data-window-chrome-toolkit') : null,
          headerHeight: headerRect ? headerRect.height : 0,
          headerWidth: headerRect ? headerRect.width : 0,
          winWidth: winRect ? winRect.width : 0,
          btnSize: btnCs ? px(btnCs.width) : 0,
          iconSize: parseFloat(parts[0]) || 0,
          paddingTop: winCs ? px(winCs.paddingTop) : 0,
          hasControls: !!(header && btn),
        };
      });
      const titleOk = Math.abs(chrome.headerHeight - 32) <= 2;
      const ctrlOk = Math.abs(chrome.btnSize - 22) <= 2;
      const bleedOk = chrome.winWidth > 0 && Math.abs(chrome.headerWidth - chrome.winWidth) <= 2;
      push('chrome-toolkit', 'data', chrome.toolkit === 'cinnamon', chrome);
      push('chrome-titlebar', 'vis', titleOk && chrome.hasControls, chrome);
      push('chrome-controls', 'int', ctrlOk, chrome);
      push('chrome-bleed', 'nav', bleedOk, chrome);
      push('chrome-gutter', 'ctx', chrome.paddingTop <= 1, chrome);

      const titleCtx = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        const header = win?.querySelector(':scope > #windowHeader');
        if (!header) {
          return { open: false, labels: [] };
        }
        const rect = header.getBoundingClientRect();
        header.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 80,
          clientY: rect.top + rect.height / 2,
        }));
        const menu = document.getElementById('muffin-window-context-menu');
        const labels = menu && !menu.hidden
          ? [...menu.querySelectorAll('[data-muffin-ctx-action]')].map((n) => n.textContent.trim())
          : [];
        return {
          open: !!(menu && !menu.hidden),
          labels,
          init: document.body.dataset.capsuleMuffinWindowCtxInit === 'true',
        };
      });
      const titleCtxOk = titleCtx.open
        && titleCtx.init
        && ['Réduire', 'Agrandir', 'Fermer', 'Toujours au premier plan']
          .every((label) => titleCtx.labels.indexOf(label) >= 0);
      push('chrome-title-ctx', 'ctx', titleCtxOk, titleCtx);
      await page.keyboard.press('Escape');

      push('chrome-kb', 'kb', chrome.hasControls, chrome);
    }

    if (surface === 'desktop') {
      const desktopState = await page.evaluate(() => {
        const desktop = document.getElementById('desktop');
        const shortcuts = document.querySelectorAll('#desktop > .desktop-shortcuts .desktop-shortcut').length;
        const bg = desktop ? getComputedStyle(desktop).backgroundImage : '';
        return {
          desktopOk: !!desktop,
          shortcuts,
          hasWallpaper: bg !== '' && bg !== 'none',
        };
      });
      const emptyVmDesktop = desktopState.desktopOk && desktopState.shortcuts === 0;
      const cinnamonDesktopIcons = desktopState.desktopOk && desktopState.shortcuts >= 2;
      push('desktop-empty-vm', 'data', emptyVmDesktop, desktopState);
      push('desktop-icons', 'data', cinnamonDesktopIcons, desktopState);
      push('desktop-vis', 'vis', desktopState.desktopOk && (desktopState.hasWallpaper || emptyVmDesktop || cinnamonDesktopIcons), desktopState);
      push('desktop-int', 'int', desktopState.desktopOk, desktopState);

      await page.evaluate(() => {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 920,
          clientY: 420,
        });
        desktop.dispatchEvent(event);
      });
      await page.waitForTimeout(80);
      const ctx = await page.evaluate(() => {
        const menu = document.getElementById('desktop-context-menu');
        return menu && !menu.hidden && !menu.hasAttribute('hidden');
      });
      push('desktop-ctx', 'ctx', ctx, {});
      const ctxItems = await page.evaluate(() => (
        document.querySelectorAll('#desktop-context-menu .desktop-context-menu__item').length >= 3
      ));
      push('desktop-ctx-nav', 'nav', ctx && ctxItems, {});

      await page.keyboard.press('Escape');
      await page.waitForTimeout(40);
      const kb = await page.evaluate(() => {
        const menu = document.getElementById('desktop-context-menu');
        return menu && menu.hasAttribute('hidden');
      });
      push('desktop-kb', 'kb', kb, {});
    }

    const dims = dimensionScoresFromChecks(checks);
    ['vis', 'nav', 'int', 'ctx', 'kb', 'data'].forEach((d) => {
      if (dims[d] === null || dims[d] === undefined) dims[d] = 50;
    });
    report.surfaces[surface] = {
      pi: computePiApp(dims),
      status: parityStatus(computePiApp(dims)),
      dimensions: dims,
      checks,
    };
  }

  return report;
}

const main = async () => {
  const opts = parseArgs();
  const results = [];

  if (opts.shell && opts.shell.length) {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage();
    await waitMintReady(page);
    const shellReport = await runShellChecks(page, opts.shell);
    await browser.close();

    if (opts.write) {
      let index = loadParityIndex(opts.id);
      if (index) {
        Object.entries(shellReport.surfaces).forEach(([surface, data]) => {
          updateShellParity(index, surface, {
            dimensions: data.dimensions,
            pi: data.pi,
            status: data.status,
            lastPass: new Date().toISOString(),
            checksPassed: data.checks.filter((c) => c.pass).length,
            checksTotal: data.checks.length,
          });
        });
        const out = saveParityIndex(opts.id, index);
        shellReport.indexWritten = out.replace(`${ROOT}/`, '');
        shellReport.pi_global = index.pi_global;
      }
    }

    results.push({ name: 'shell-parity', ok: Object.values(shellReport.surfaces).every((s) => s.checks.every((c) => c.pass)), shellReport });
  }

  const steps = [
    { name: 'validate-window-side-effects', run: () => run('usr/lib/capsuleos/tools/validate-window-side-effects.mjs') },
    { name: 'smoke-mint-interaction', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-interaction.mjs') },
    { name: 'smoke-mint-context-menus', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-context-menus.mjs') },
    { name: 'smoke-mint-window-chrome-parity', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs') },
  ];

  const appSlots = opts.apps || [];
  appSlots.forEach((slot) => {
    const smokeName = slot === 'text_editor' ? 'text-editor' : slot.replace(/_/g, '-');
    steps.push({
      name: `smoke-${slot}`,
      run: () => run(`usr/lib/capsuleos/tools/lab/smoke-mint-${smokeName}.mjs`),
    });
    steps.push({
      name: `parity-${slot}`,
      run: () => run('usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs', ['--id', 'linux-mint', '--slot', slot, '--json']),
    });
  });

  if (steps.length) {
    results.push(...steps.map((s) => ({ name: s.name, ...s.run() })));
  }

  const failed = results.filter((r) => !r.ok);
  if (opts.json) {
    console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  } else {
    results.forEach((r) => {
      if (r.shellReport) {
        Object.entries(r.shellReport.surfaces).forEach(([s, d]) => {
          console.log(`${s}: Π=${d.pi} (${d.status})`);
        });
        if (r.shellReport.pi_global) console.log(`Π_global=${r.shellReport.pi_global}`);
      } else {
        console.log(`${r.name}: ${r.ok ? 'OK' : 'FAIL'}`);
      }
    });
  }
  process.exit(failed.length ? 1 : 0);
};

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
