#!/usr/bin/env node
/**
 * Captures PNG du skin KDE Neon CapsuleOS (Playwright) pour parité VM.
 * Usage : node root/tools/lab/capture-capsule-kde-neon.mjs [dest-dir]
 * Prérequis : serveur HTTP sur 5500, npm install playwright (local node_modules).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KDE_NEON_PARITY_GEOMETRY } from '../../../usr/lib/capsuleos/tools/lab/apps-parity-geometry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const panelG8 = process.argv.includes('--panel-g8');
const appsP0 = process.argv.includes('--apps-p0');
const DEST = args[0] || path.join(ROOT, 'home/public/Images/screen_KDE-Neon');
const httpBase = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = process.env.CAPSULE_KDE_NEON_URL || `${httpBase}/home/Debian/KDE-Neon/index.html`;
const VIEWPORT = { width: 1211, height: 756 };
const defaultChrome = [
  process.env.PLAYWRIGHT_CHROME,
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].find((p) => p && fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const PARITY_GEOMETRY = KDE_NEON_PARITY_GEOMETRY;

const resizeSlotForParity = async (page, slot) => {
  const geo = PARITY_GEOMETRY[slot];
  if (!geo) return;
  await page.evaluate(({ s, width, height }) => {
    const el = document.querySelector(`.windowElement[data-link="${s}"]`);
    if (!el) return;
    delete el.dataset.maximized;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.minWidth = `${width}px`;
    el.style.maxWidth = `${width}px`;
    el.style.minHeight = `${height}px`;
    el.style.maxHeight = `${height}px`;
    el.style.boxSizing = 'border-box';
    el.style.left = '48px';
    el.style.top = '32px';
    el.style.transform = '';
    window.dispatchEvent(new Event('resize'));
  }, { s: slot, ...geo });
  await sleep(page, 450);
};

const alignDiscoverHomeForParityCapture = async (page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.windowElement[data-link="update_manager"]');
    if (!root) return;
    const badge = root.querySelector('[data-discover-updates-badge]');
    if (badge) badge.hidden = true;
    root.querySelectorAll('[data-discover-store-section]').forEach((el) => {
      el.hidden = true;
    });
    root.querySelectorAll('.kde-discover-panel--home, .kde-updates__cats, .kde-discover-home').forEach((el) => {
      el.scrollTop = 0;
    });
    const wine = root.querySelector('[data-discover-home-mount] [data-discover-app="wine"]');
    if (wine) wine.classList.add('kde-discover-card--vm-hover');
    root.style.borderRadius = '5px';
    root.style.boxShadow = 'none';
    root.style.background = '#dee0e2';
    root.style.overflow = 'hidden';
    const main = root.querySelector('main#updateManagerApp');
    if (main) main.style.background = '#ffffff';
    document.body.style.background = '#ffffff';
  });
  await sleep(page, 200);
};

const alignThemesForParityCapture = async (page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.windowElement[data-link="themes"]');
    if (!root) return;
    root.style.borderRadius = '5px';
    root.style.boxShadow = 'none';
    root.style.overflow = 'hidden';
    root.style.background = '#eff0f1';
    const iframe = root.querySelector('#windowIframe, .windowIframe');
    if (iframe) iframe.style.background = '#eff0f1';
    const kcm = root.querySelector('.kde-systemsettings--kcm');
    if (kcm) kcm.style.background = '#eff0f1';
    document.body.style.background = '#ffffff';
  });
  await sleep(page, 200);
};

const alignFirefoxForParityCapture = async (page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.windowElement[data-link="firefox"]');
    if (!root) return;
    const panel = document.getElementById('tableau');
    if (panel) panel.style.display = 'none';
    const app = root.querySelector('[data-firefox-app]');
    if (app) {
      const home = app.querySelector('[data-browser-home]');
      const homeBtn = app.querySelector('[data-browser-action="home"]');
      if (homeBtn) homeBtn.click();
      if (home) home.hidden = false;
      app.setAttribute('data-browser-current-view', 'home');
    }
    root.style.borderRadius = '5px';
    root.style.boxShadow = 'none';
    root.style.overflow = 'hidden';
    document.body.style.background = '#ffffff';
  });
  await sleep(page, 250);
};

const alignTerminalForParityCapture = async (page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.windowElement[data-link="terminal"]');
    if (!root) return;
    const panel = document.getElementById('tableau');
    if (panel) panel.style.display = 'none';
    const app = root.querySelector('[data-terminal-app], .capsule-terminal');
    const session = app && app.__capsuleTerminalSession;
    if (session && session.state) {
      const home = window.CAPSULE_TERMINAL_HOME || window.CAPSULE_USER_HOME || '/home/public';
      session.state.cwd = window.CapsuleTerminal
        ? window.CapsuleTerminal.normalizePath(home)
        : home;
      const prompt = root.querySelector('[data-terminal-prompt], #prompt');
      if (prompt && window.CapsuleTerminal) {
        const text = window.CapsuleTerminal.formatPrompt(session.state);
        prompt.textContent = text;
        prompt.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    const output = root.querySelector('[data-terminal-output], #output');
    if (output) output.innerHTML = '';
    root.style.borderRadius = '5px';
    root.style.boxShadow = 'none';
    root.style.overflow = 'hidden';
    document.body.style.background = '#000000';
  });
  await sleep(page, 250);
};

const alignVlcForParityCapture = async (page) => {
  await page.evaluate(() => {
    const root = document.querySelector('.windowElement[data-link="lecteur_multimedia"]');
    if (!root) return;
    const panel = document.getElementById('tableau');
    if (panel) panel.style.display = 'none';
    const title = root.querySelector('#windowTitle');
    if (title) title.textContent = 'Lecteur multimédia VLC';
    const menubar = root.querySelector('.celluloid-app__menubar');
    if (menubar && !menubar.querySelector('[data-vlc-menu-extra]')) {
      const aide = menubar.querySelector('.celluloid-app__menu:last-child');
      const outils = document.createElement('div');
      outils.className = 'celluloid-app__menu';
      outils.setAttribute('data-vlc-menu-extra', 'outils');
      outils.innerHTML = '<button type="button" class="celluloid-app__menu-btn" aria-haspopup="true">Outils</button>';
      const vue = document.createElement('div');
      vue.className = 'celluloid-app__menu';
      vue.setAttribute('data-vlc-menu-extra', 'vue');
      vue.innerHTML = '<button type="button" class="celluloid-app__menu-btn" aria-haspopup="true">Vue</button>';
      if (aide) {
        menubar.insertBefore(outils, aide);
        menubar.insertBefore(vue, aide);
      } else {
        menubar.appendChild(outils);
        menubar.appendChild(vue);
      }
    }
    root.style.borderRadius = '5px';
    root.style.boxShadow = 'none';
    root.style.overflow = 'hidden';
    document.body.style.background = '#000000';
  });
  await sleep(page, 250);
};

const screenshotScene = async (page, scene, out) => {
  if (appsP0 && scene.slots?.length === 1) {
    const slot = scene.slots[0];
    const handle = await page.$(`.windowElement[data-link="${slot}"]`);
    if (handle) {
      await handle.screenshot({ path: out });
      return;
    }
  }
  await page.screenshot({ path: out, fullPage: false });
};

const ensureDolphinSplit = async (page) => {
  const isReady = () => page.evaluate(() => {
    const state = window.fileExplorerState;
    const root = document.querySelector('.windowElement[data-link="nemo"]');
    const domSplit = root && (
      root.querySelector('.dolphin-content-wrap--split')
      || root.querySelector('.dolphin-content-panes--split')
      || root.querySelector('.dolphin-content-pane--secondary:not([hidden])')
    );
    return !!(state && state.splitView && domSplit);
  });
  if (await isReady()) {
    return;
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.evaluate(() => {
      const btn = document.querySelector('.windowElement[data-link="nemo"] #dolphin-split-toggle');
      if (btn) {
        btn.click();
      }
    });
    try {
      await page.waitForFunction(() => {
        const state = window.fileExplorerState;
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        const domSplit = root && (
          root.querySelector('.dolphin-content-wrap--split')
          || root.querySelector('.dolphin-content-panes--split')
          || root.querySelector('.dolphin-content-pane--secondary:not([hidden])')
        );
        return !!(state && state.splitView && domSplit);
      }, null, { timeout: 12000 });
      await sleep(page, 800);
      return;
    } catch {
      await sleep(page, 600);
    }
  }
  throw new Error('Impossible d\'activer la vue scindée Dolphin');
};

const resetShell = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset ? win.dataset.link : '';
      if (!slot || slot === 'mainMenu') return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
      link.classList.remove('running-link', 'active-link');
    });
    const menu = document.querySelector('.windowElement[data-link="mainMenu"]');
    if (menu) {
      menu.style.display = 'none';
      menu.classList.remove('windowElementActive', 'active');
    }
    const dolphinRoot = document.querySelector('.windowElement[data-link="nemo"]');
    if (dolphinRoot) {
      const hamburger = dolphinRoot.querySelector('#dolphin-hamburger-menu');
      if (hamburger) hamburger.hidden = true;
      const filterMenu = dolphinRoot.querySelector('#dolphin-search-filter-menu');
      if (filterMenu) filterMenu.hidden = true;
      const searchBar = dolphinRoot.querySelector('#dolphin-search-bar');
      if (searchBar) searchBar.hidden = true;
      const app = dolphinRoot.querySelector('.dolphin-app');
      if (app) app.classList.remove('dolphin-app--search-open');
    }
  });
};

const openSlot = async (page, slot, scene = {}) => {
  let opened = { ok: false, display: 'missing' };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    opened = await page.evaluate((s) => {
      const ok = typeof window.openWindowByDataLink === 'function'
        ? window.openWindowByDataLink(s)
        : false;
      const el = document.querySelector('.windowElement[data-link="' + s + '"]');
      const display = el ? getComputedStyle(el).display : 'missing';
      return { ok, display, style: el?.style?.display || '' };
    }, slot);
    if (opened.ok && opened.display !== 'none' && opened.display !== 'missing') {
      break;
    }
    await sleep(page, 500);
  }
  if (!opened.ok || opened.display === 'none' || opened.display === 'missing') {
    throw new Error(`Impossible d'ouvrir ${slot} (display=${opened.display})`);
  }
  if (slot === 'text_editor') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="text_editor"]');
        return root && root.style.display !== 'none'
          && root.querySelector('.kde-kate__welcome, .kde-kate--welcome');
      },
      null,
      { timeout: 15000 },
    );
    await sleep(page, 500);
  }
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        const grid = root.querySelector('.nemoElement[data-pane="primary"], #voletContainer > .nemoElement');
        return !!grid;
      },
      null,
      { timeout: 30000 },
    );
    if (scene.dolphinViewMode) {
      await page.evaluate((mode) => {
        if (typeof window.setFileExplorerViewMode === 'function') {
          window.setFileExplorerViewMode(mode);
        }
      }, scene.dolphinViewMode);
      await page.waitForFunction(
        (mode) => {
          const root = document.querySelector('.windowElement[data-link="nemo"]');
          if (!root) return false;
          if (mode === 'list') {
            return !!root.querySelector('.nemo-app__content-grid--list:not([hidden])');
          }
          if (mode === 'compact') {
            return !!root.querySelector('.nemo-app__content-grid--compact:not([hidden])');
          }
          return !!root.querySelector('.nemo-app__content-grid--icons:not([hidden])');
        },
        scene.dolphinViewMode,
        { timeout: 10000 },
      );
      await sleep(page, 600);
    }
    if (scene.dolphinSplit) {
      await ensureDolphinSplit(page);
    }
    if (scene.dolphinSplitSelection) {
      await page.waitForFunction(
        () => {
          const secondaryGrid = document.querySelector('.dolphin-content-pane[data-pane="secondary"] .nemo-app__content-grid');
          return secondaryGrid && secondaryGrid.querySelectorAll('a[data-item-name]').length >= 1;
        },
        null,
        { timeout: 10000 },
      );
      await page.evaluate(() => {
        const primaryGrid = document.querySelector('.dolphin-content-pane[data-pane="primary"] .nemo-app__content-grid');
        const secondaryGrid = document.querySelector('.dolphin-content-pane[data-pane="secondary"] .nemo-app__content-grid');
        const primaryLink = primaryGrid && primaryGrid.querySelector('a[data-item-name]');
        const secondaryLinks = secondaryGrid && secondaryGrid.querySelectorAll('a[data-item-name]');
        const secondaryLink = secondaryLinks && secondaryLinks.length > 1
          ? secondaryLinks[1]
          : (secondaryLinks && secondaryLinks[0]);
        if (primaryLink) {
          primaryLink.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
          primaryLink.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0 }));
        }
        if (secondaryLink) {
          secondaryLink.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
          secondaryLink.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0 }));
        }
      });
      await sleep(page, 500);
    }
    if (scene.dolphinHamburger) {
      await page.click('#dolphin-main-menu');
      await page.waitForFunction(
        () => {
          const menu = document.querySelector('#dolphin-hamburger-menu');
          return menu && !menu.hidden;
        },
        null,
        { timeout: 5000 },
      );
      await sleep(page, 500);
    }
    if (scene.dolphinSearch) {
      await page.click('.dolphin-toolbar__search, .dolphin-toolbar__btn--search');
      await page.waitForFunction(
        () => {
          const bar = document.querySelector('#dolphin-search-bar');
          return bar && !bar.hidden;
        },
        null,
        { timeout: 5000 },
      );
      await sleep(page, 400);
    }
    if (scene.dolphinSearchFilter) {
      if (!scene.dolphinSearch) {
        await page.click('.dolphin-toolbar__search, .dolphin-toolbar__btn--search');
        await page.waitForFunction(
          () => {
            const bar = document.querySelector('#dolphin-search-bar');
            return bar && !bar.hidden;
          },
          null,
          { timeout: 5000 },
        );
        await sleep(page, 300);
      }
      await page.click('#dolphin-search-filter-btn', { force: true });
      await page.waitForFunction(
        () => {
          const menu = document.querySelector('#dolphin-search-filter-menu');
          return menu && !menu.hidden;
        },
        null,
        { timeout: 5000 },
      );
      await sleep(page, 400);
    }
  }
  if (slot === 'update_manager') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="update_manager"]');
        if (!root || root.style.display === 'none') return false;
        return !!root.querySelector('[data-discover-home-mount] .kde-discover-card');
      },
      null,
      { timeout: 60000 },
    );
    const shouldMaximize = scene.maximize !== false;
    const isMaximized = await page.evaluate(() => {
      const root = document.querySelector('.windowElement[data-link="update_manager"]');
      return root && root.dataset.maximized === 'true';
    });
    if (shouldMaximize !== isMaximized) {
      await page.click('.windowElement[data-link="update_manager"] #resizeBtn');
      await page.waitForFunction(
        (wantMax) => {
          const root = document.querySelector('.windowElement[data-link="update_manager"]');
          const max = root && root.dataset.maximized === 'true';
          return wantMax ? max : !max;
        },
        shouldMaximize,
        { timeout: 5000 },
      );
    }
    if (scene.discoverView) {
      await page.click(`[data-discover-nav="${scene.discoverView}"]`);
      await page.waitForFunction(
        (viewId) => {
          const panel = document.querySelector(`[data-discover-panel="${viewId}"]`);
          return panel && !panel.hidden;
        },
        scene.discoverView,
        { timeout: 5000 },
      );
      if (scene.discoverView === 'installed') {
        await page.waitForFunction(
          () => document.querySelectorAll('[data-discover-installed-mount] .kde-discover-card--installed').length >= 6,
          null,
          { timeout: 10000 },
        );
      }
      if (scene.discoverView === 'updates') {
        await page.waitForFunction(
          () => document.querySelectorAll('[data-discover-updates-mount] .kde-updates__row').length >= 1,
          null,
          { timeout: 10000 },
        );
      }
      if (scene.discoverView === 'about') {
        await page.waitForFunction(
          () => document.querySelectorAll('[data-discover-about-mount] .kde-form-card').length >= 2,
          null,
          { timeout: 10000 },
        );
      }
      if (scene.discoverView === 'config') {
        await page.waitForFunction(
          () => document.querySelectorAll('[data-discover-config-mount] .kde-discover-config__section').length >= 2,
          null,
          { timeout: 10000 },
        );
      }
      await sleep(page, 400);
    } else if (scene.discoverAppDetail) {
      await page.evaluate((appId) => {
        const nav = document.querySelector('[data-discover-nav="home"]');
        if (nav && !nav.classList.contains('is-active')) nav.click();
        const card = document.querySelector(
          `[data-discover-home-mount] .kde-discover-card[data-discover-app="${appId}"]`,
        );
        if (card) {
          card.scrollIntoView({ block: 'center', inline: 'nearest' });
          card.click();
        }
      }, scene.discoverAppDetail);
      await sleep(page, scene.discoverAppDetailScroll ? 300 : 500);
      await page.waitForFunction(
        () => {
          const panel = document.querySelector('[data-discover-app-detail]');
          return panel && !panel.hidden && panel.querySelector('.kde-discover-app-detail__shot-img, [data-discover-carousel]');
        },
        null,
        { timeout: 10000 },
      );
      if (scene.discoverAppDetailScroll) {
        await page.evaluate(() => {
          const panel = document.querySelector('[data-discover-app-detail]');
          if (panel) {
            panel.scrollTop = panel.scrollHeight;
          }
        });
        await sleep(page, 400);
      } else {
        await sleep(page, 500);
      }
    } else {
      await page.evaluate(() => {
        const nav = document.querySelector('[data-discover-nav="home"]');
        if (nav && !nav.classList.contains('is-active')) nav.click();
      });
      await alignDiscoverHomeForParityCapture(page);
    }
  }
  if (slot === 'themes') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="themes"]');
        return root && root.style.display !== 'none'
          && root.querySelector('.kde-kscreen__monitors');
      },
      null,
      { timeout: 20000 },
    );
    await alignThemesForParityCapture(page);
    await sleep(page, 400);
  }
  if (slot === 'firefox') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="firefox"]');
        return root && root.style.display !== 'none'
          && root.querySelector('[data-firefox-app][data-initialized="true"], [data-firefox-app][data-browser-current-view]');
      },
      null,
      { timeout: 20000 },
    );
    await alignFirefoxForParityCapture(page);
    await sleep(page, 400);
  }
  if (slot === 'terminal') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="terminal"]');
        return root && root.style.display !== 'none'
          && root.querySelector('[data-terminal-app][data-terminal-ready="true"], [data-terminal-app][data-terminal-ready=true]');
      },
      null,
      { timeout: 20000 },
    );
    await alignTerminalForParityCapture(page);
    await sleep(page, 400);
  }
  if (slot === 'lecteur_multimedia') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="lecteur_multimedia"]');
        return root && root.style.display !== 'none'
          && root.querySelector('main#lecteurMultimedia.celluloid-app, #lecteurMultimedia');
      },
      null,
      { timeout: 15000 },
    );
    await alignVlcForParityCapture(page);
    await sleep(page, 400);
  }
  if (appsP0) {
    await resizeSlotForParity(page, slot);
  }
  await sleep(page, 800);
};

const TRAY_POPOVERS = {
  calendar: {
    btn: '#taskbar-clock-trigger',
    pop: '#taskbar-calendar-popover:not([hidden])',
  },
  clipboard: {
    btn: '#tray-btn-clipboard',
    pop: '#kde-tray-popover-clipboard:not([hidden])',
  },
  network: {
    btn: '#tray-btn-network',
    pop: '#kde-tray-popover-network:not([hidden])',
  },
  volume: {
    btn: '#tray-sound-btn',
    pop: '#volume-popover:not([hidden])',
  },
};

const openTrayPopover = async (page, kind) => {
  const spec = TRAY_POPOVERS[kind];
  if (!spec) {
    throw new Error(`trayPopover inconnu: ${kind}`);
  }
  await page.click(spec.btn);
  await page.waitForSelector(spec.pop, { timeout: 8000 });
  await sleep(page, 400);
};

const prepareScene = async (page, scene) => {
  await resetShell(page);
  await sleep(page, 300);
  if (scene.trayPopover) {
    await openTrayPopover(page, scene.trayPopover);
    return;
  }
  if (scene.slots) {
    for (const slot of scene.slots) {
      await openSlot(page, slot, scene);
    }
  }
};

const main = async () => {
  if (!defaultChrome) {
    throw new Error('Chrome/Playwright introuvable — définir PLAYWRIGHT_CHROME ou installer playwright');
  }
  fs.mkdirSync(DEST, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: defaultChrome });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
    timeout: 60000,
  });

  const panelShots = [
    { file: 'capsule-desktop.png' },
    { file: 'capsule-kickoff.png', slots: ['mainMenu'] },
    { file: 'capsule-tray-calendar.png', trayPopover: 'calendar' },
    { file: 'capsule-tray-clipboard.png', trayPopover: 'clipboard' },
    { file: 'capsule-tray-network.png', trayPopover: 'network' },
    { file: 'capsule-tray-volume.png', trayPopover: 'volume' },
  ];

  const appP0Shots = [
    { file: 'capsule-systemsettings.png', slots: ['themes'] },
    { file: 'capsule-dolphin.png', slots: ['nemo'] },
    { file: 'capsule-firefox.png', slots: ['firefox'] },
    { file: 'capsule-terminal.png', slots: ['terminal'] },
    { file: 'capsule-kate.png', slots: ['text_editor'] },
    { file: 'capsule-discover.png', slots: ['update_manager'] },
    { file: 'capsule-vlc.png', slots: ['lecteur_multimedia'] },
    { file: 'capsule-gwenview.png', slots: ['visionneur_images'] },
    { file: 'capsule-okular.png', slots: ['visionneur_pdf'] },
  ];

  const slotAliasMap = {
    'capsule-systemsettings.png': 'themes.png',
    'capsule-dolphin.png': 'nemo.png',
    'capsule-firefox.png': 'firefox.png',
    'capsule-terminal.png': 'terminal.png',
    'capsule-kate.png': 'text_editor.png',
    'capsule-discover.png': 'update_manager.png',
    'capsule-vlc.png': 'lecteur_multimedia.png',
    'capsule-gwenview.png': 'visionneur_images.png',
    'capsule-okular.png': 'visionneur_pdf.png',
  };

  const shots = appsP0 ? appP0Shots : panelG8 ? panelShots : [
    ...panelShots,
    { file: 'capsule-dolphin.png', slots: ['nemo'] },
    { file: 'capsule-dolphin-compact.png', slots: ['nemo'], dolphinViewMode: 'compact' },
    { file: 'capsule-dolphin-list.png', slots: ['nemo'], dolphinViewMode: 'list' },
    { file: 'capsule-dolphin-split.png', slots: ['nemo'], dolphinSplit: true },
    {
      file: 'capsule-dolphin-split-selection.png',
      slots: ['nemo'],
      dolphinSplit: true,
      dolphinSplitSelection: true,
    },
    { file: 'capsule-dolphin-hamburger.png', slots: ['nemo'], dolphinHamburger: true },
    { file: 'capsule-dolphin-search-open.png', slots: ['nemo'], dolphinSearch: true },
    { file: 'capsule-dolphin-search-filter-open.png', slots: ['nemo'], dolphinSearch: true, dolphinSearchFilter: true },
    { file: 'capsule-discover.png', slots: ['update_manager'] },
    {
      file: 'capsule-discover-detail-vlc.png',
      slots: ['update_manager'],
      discoverAppDetail: 'vlc',
    },
    {
      file: 'capsule-discover-detail-vlc-scrolled.png',
      slots: ['update_manager'],
      discoverAppDetail: 'vlc',
      discoverAppDetailScroll: true,
    },
    {
      file: 'capsule-discover-installed.png',
      slots: ['update_manager'],
      discoverView: 'installed',
    },
    {
      file: 'capsule-discover-installed-windowed.png',
      slots: ['update_manager'],
      discoverView: 'installed',
      maximize: false,
    },
    {
      file: 'capsule-discover-updates.png',
      slots: ['update_manager'],
      discoverView: 'updates',
    },
    {
      file: 'capsule-discover-updates-windowed.png',
      slots: ['update_manager'],
      discoverView: 'updates',
      maximize: false,
    },
    {
      file: 'capsule-discover-about.png',
      slots: ['update_manager'],
      discoverView: 'about',
    },
    {
      file: 'capsule-discover-about-windowed.png',
      slots: ['update_manager'],
      discoverView: 'about',
      maximize: false,
    },
    {
      file: 'capsule-discover-config.png',
      slots: ['update_manager'],
      discoverView: 'config',
    },
    {
      file: 'capsule-discover-config-windowed.png',
      slots: ['update_manager'],
      discoverView: 'config',
      maximize: false,
    },
    { file: 'capsule-spectacle.png', slots: ['spectacle'] },
    { file: 'capsule-kinfocenter.png', slots: ['kinfocenter'] },
    { file: 'capsule-system-monitor.png', slots: ['system_monitor'] },
  ].filter((scene) => !panelShots.some((p) => p.file === scene.file));

  for (const scene of shots) {
    await prepareScene(page, scene);
    const out = path.join(DEST, scene.file);
    await screenshotScene(page, scene, out);
    process.stdout.write(`  → ${out} (${fs.statSync(out).size} octets)\n`);
    const alias = slotAliasMap[scene.file];
    if (alias) {
      const aliasPath = path.join(DEST, alias);
      fs.copyFileSync(out, aliasPath);
      process.stdout.write(`  → ${aliasPath} (alias)\n`);
    }
  }

  await browser.close();
  process.stdout.write(`OK ${DEST} (${shots.length} fichiers)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
