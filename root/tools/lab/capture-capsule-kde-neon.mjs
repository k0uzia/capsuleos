#!/usr/bin/env node
/**
 * Captures PNG du skin KDE Neon CapsuleOS (Playwright) pour parité VM.
 * Usage : node root/tools/lab/capture-capsule-kde-neon.mjs [dest-dir]
 * Prérequis : serveur HTTP sur 5500, npm install playwright (local node_modules).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const panelG8 = process.argv.includes('--panel-g8');
const discoverOnly = process.argv.includes('--discover-only');
const DEST = args[0] || path.join(ROOT, 'home/public/Images/screen_KDE-Neon');
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
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
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        const grid = root.querySelector('.nemoElement[data-pane="primary"], #voletContainer > .nemoElement');
        return grid && grid.querySelectorAll('a[data-item-name]').length >= 3;
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
    await page.evaluate(() => {
      sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');
    });
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="update_manager"]');
        if (!root || root.style.display === 'none') return false;
        return !!root.querySelector('[data-discover-home-mount] .kde-discover-card');
      },
      null,
      { timeout: 60000 },
    );
    const skipStoreSection = scene.discoverView || scene.discoverAppDetail
      || scene.discoverInstalledAppDetail || scene.discoverSearch || scene.discoverCategory;
    if (!skipStoreSection) {
      await page.waitForSelector('[data-discover-store-section]', { timeout: 20000 });
      await page.waitForFunction(
        () => {
          const section = document.querySelector('[data-discover-store-section]');
          return section && section.querySelectorAll('.kde-discover-card').length >= 5;
        },
        null,
        { timeout: 15000 },
      );
      await page.evaluate(() => {
        const section = document.querySelector('[data-discover-store-section]');
        if (section) {
          section.scrollIntoView({ block: 'start' });
        }
      });
      await sleep(page, 400);
    }
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
    } else if (scene.discoverInstalledAppDetail) {
      await page.click('[data-discover-nav="installed"]');
      await page.waitForFunction(
        () => {
          const panel = document.querySelector('[data-discover-panel="installed"]');
          return panel && !panel.hidden;
        },
        null,
        { timeout: 5000 },
      );
      await page.waitForFunction(
        () => document.querySelectorAll('[data-discover-installed-mount] .kde-discover-card--installed').length >= 6,
        null,
        { timeout: 10000 },
      );
      await page.evaluate((appId) => {
        const card = document.querySelector(
          `[data-discover-installed-mount] .kde-discover-card[data-discover-app="${appId}"]`,
        );
        if (card) {
          card.scrollIntoView({ block: 'center', inline: 'nearest' });
          card.click();
        }
      }, scene.discoverInstalledAppDetail);
      await sleep(page, 500);
      await page.waitForFunction(
        () => {
          const panel = document.querySelector('[data-discover-app-detail]');
          return panel && !panel.hidden && panel.querySelector('.kde-discover-app-detail__name');
        },
        null,
        { timeout: 10000 },
      );
      await page.evaluate(() => {
        const carousel = document.querySelector('.kde-discover-app-detail__carousel');
        if (carousel && !carousel.querySelector('.kde-discover-app-detail__shot-img')) {
          carousel.style.display = 'none';
        }
      });
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
          return panel && !panel.hidden && panel.querySelector('.kde-discover-app-detail__name');
        },
        null,
        { timeout: 10000 },
      );
      if (!scene.discoverAppDetailScroll) {
        await page.evaluate(() => {
          const carousel = document.querySelector('.kde-discover-app-detail__carousel');
          if (carousel) {
            carousel.style.display = 'none';
          }
        });
        await sleep(page, 300);
      }
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
    } else if (scene.discoverSearch) {
      await page.evaluate((query) => {
        const nav = document.querySelector('[data-discover-nav="home"]');
        if (nav && !nav.classList.contains('is-active')) nav.click();
        const input = document.querySelector('[data-discover-search]');
        if (input) {
          input.value = query;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, scene.discoverSearch);
      await sleep(page, 500);
    } else if (scene.discoverCategory) {
      await page.evaluate((cat) => {
        const nav = document.querySelector('[data-discover-nav="home"]');
        if (nav && !nav.classList.contains('is-active')) nav.click();
        const btn = document.querySelector(`.kde-updates__cat[data-discover-cat="${cat}"]`);
        if (btn) btn.click();
      }, scene.discoverCategory);
      await sleep(page, 500);
    } else {
      await page.evaluate(() => {
        const nav = document.querySelector('[data-discover-nav="home"]');
        if (nav && !nav.classList.contains('is-active')) nav.click();
      });
    }
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

  const discoverShots = [
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
      file: 'capsule-discover-search-vlc.png',
      slots: ['update_manager'],
      discoverSearch: 'VLC',
    },
    {
      file: 'capsule-discover-category-internet.png',
      slots: ['update_manager'],
      discoverCategory: 'internet',
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
  ];

  const catalogPath = path.join(ROOT, 'home/Debian/KDE-Neon/content/discover-catalog.json');
  if (fs.existsSync(catalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    (catalog.installed || []).forEach((app) => {
      if (!app.id) {
        return;
      }
      discoverShots.push({
        file: `capsule-discover-installed-detail-${app.id}.png`,
        slots: ['update_manager'],
        discoverInstalledAppDetail: app.id,
      });
    });
  }

  const shots = discoverOnly ? discoverShots : panelG8 ? panelShots : [
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
    ...discoverShots,
    { file: 'capsule-spectacle.png', slots: ['spectacle'] },
    { file: 'capsule-kinfocenter.png', slots: ['kinfocenter'] },
    { file: 'capsule-system-monitor.png', slots: ['system_monitor'] },
  ].filter((scene) => !panelShots.some((p) => p.file === scene.file));

  for (const scene of shots) {
    await prepareScene(page, scene);
    const out = path.join(DEST, scene.file);
    await page.screenshot({ path: out, fullPage: false });
    process.stdout.write(`  → ${out} (${fs.statSync(out).size} octets)\n`);
  }

  await browser.close();
  process.stdout.write(`OK ${DEST} (${shots.length} fichiers)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
