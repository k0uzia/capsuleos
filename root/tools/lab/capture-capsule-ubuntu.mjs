#!/usr/bin/env node
/**
 * Captures PNG du skin Ubuntu CapsuleOS (Playwright) pour passe visuelle shell GNOME.
 * Usage : CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node root/tools/lab/capture-capsule-ubuntu.mjs [dest-dir]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DEST = process.argv[2] || path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-capsule');
const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = process.env.CAPSULE_UBUNTU_URL || `${BASE}/home/Debian/Ubuntu/index.html`;
const VIEWPORT = { width: 1280, height: 800 };
const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));
const chromePath = process.env.PLAYWRIGHT_CHROME || defaultChrome;

const sleep = (page, ms) => page.waitForTimeout(ms);

const setTheme = async (page, theme) => {
  await page.evaluate((t) => {
    const resolved = t === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('gnome-theme', resolved);
  }, theme);
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
    if (window.CapsuleGnomeOverview?.setOverview) {
      window.CapsuleGnomeOverview.setOverview(false, 'workspace');
    }
    const popover = document.getElementById('volume-popover');
    const btn = document.getElementById('tray-quick-settings-btn');
    if (popover) popover.setAttribute('hidden', '');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    try {
      if (window.CapsuleTaskbarLauncherState?.refresh) {
        window.CapsuleTaskbarLauncherState.refresh();
      }
    } catch (_) {
      /* dock masqué */
    }
  });
};

const openSlot = async (page, slot) => {
  let opened = { ok: false, display: 'missing' };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    opened = await page.evaluate((s) => {
      const el = document.querySelector('.windowElement[data-link="' + s + '"]');
      if (el) {
        el.classList.remove('windowElementActive', 'active');
      }
      const ok = typeof window.openWindowByDataLink === 'function'
        ? window.openWindowByDataLink(s)
        : false;
      const display = el ? getComputedStyle(el).display : 'missing';
      return { ok, display, style: el?.style?.display || '' };
    }, slot);
    if (opened.ok && opened.display !== 'none' && opened.display !== 'missing') {
      break;
    }
    await sleep(page, 500);
  }
  if (!opened.ok || opened.display === 'none' || opened.display === 'missing') {
    throw new Error(`Impossible d'ouvrir ${slot} (display=${opened.display}, style=${opened.style})`);
  }
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        return !!root.querySelector('.nautilus-app__headerbar');
      },
      null,
      { timeout: 60000 },
    );
  }
  await sleep(page, 800);
};

const openSceneSlots = async (page, scene) => {
  if (scene.settingsPanel) {
    await page.evaluate((panel) => {
      if (typeof window.setCapsuleSettingsPanel === 'function') {
        window.setCapsuleSettingsPanel(panel);
      }
    }, scene.settingsPanel);
  }

  const slots = scene.slots || [];
  const focus = scene.focus;
  const order = focus && !slots.includes(focus) ? [...slots, focus] : slots;
  for (const slot of order) {
    await openSlot(page, slot);
  }
  if (focus) {
    await openSlot(page, focus);
  }

  if (scene.settingsPanel) {
    await page.waitForFunction(
      (panel) => {
        const active = document.querySelector(
          '#themes .gnome-settings__panel.is-active[data-gnome-settings-panel="' + panel + '"]',
        );
        return active && !active.hidden;
      },
      scene.settingsPanel,
      { timeout: 20000 },
    );
    await sleep(page, 300);
  }
};

const prepareScene = async (page, scene) => {
  await setTheme(page, scene.theme || 'dark');
  await resetShell(page);
  await sleep(page, 300);

  if (scene.quickSettings) {
    await page.click('#tray-quick-settings-btn');
    await sleep(page, 400);
    return;
  }

  if (scene.overview && !scene.beforeOverview) {
    await page.evaluate((mode) => {
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(true, mode);
      }
    }, scene.overview);
    await sleep(page, scene.overview === 'apps' ? 700 : 500);
    return;
  }

  await openSceneSlots(page, scene);

  if (scene.overview) {
    await page.evaluate((mode) => {
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(true, mode);
      }
    }, scene.overview);
    await page.evaluate(() => {
      if (window.CapsuleGnomeWorkspaces?.refreshWorkspacePreviews) {
        window.CapsuleGnomeWorkspaces.refreshWorkspacePreviews();
      }
    });
    await sleep(page, scene.overview === 'apps' ? 700 : 650);
  }
};

const main = async () => {
  if (!chromePath) {
    throw new Error('Chrome/Playwright introuvable — installer playwright ou définir PLAYWRIGHT_CHROME');
  }
  fs.mkdirSync(DEST, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
    timeout: 60000,
  });
  await page.waitForFunction(
    () => document.getElementById('ubuntu') && document.querySelector('.fedora-overview'),
    null,
    { timeout: 60000 },
  );

  const shots = [
    { file: 'ubuntu-capsule-dark-desktop.png', theme: 'dark' },
    { file: 'ubuntu-capsule-dark-overview.png', theme: 'dark', overview: 'workspace' },
    {
      file: 'ubuntu-capsule-dark-overview-busy.png',
      theme: 'dark',
      slots: ['firefox'],
      focus: 'firefox',
      overview: 'workspace',
      beforeOverview: true,
    },
    { file: 'ubuntu-capsule-dark-overview-apps.png', theme: 'dark', overview: 'apps' },
    { file: 'ubuntu-capsule-dark-quick-settings.png', theme: 'dark', quickSettings: true },
    { file: 'ubuntu-capsule-dark-nautilus.png', theme: 'dark', slots: ['nemo'], focus: 'nemo' },
    { file: 'ubuntu-capsule-dark-firefox.png', theme: 'dark', slots: ['firefox'], focus: 'firefox' },
    { file: 'ubuntu-capsule-dark-text-editor.png', theme: 'dark', slots: ['text_editor'], focus: 'text_editor' },
    { file: 'ubuntu-capsule-dark-calculator.png', theme: 'dark', slots: ['calculator'], focus: 'calculator' },
    {
      file: 'ubuntu-capsule-dark-settings-appearance.png',
      theme: 'dark',
      slots: ['themes'],
      focus: 'themes',
      settingsPanel: 'appearance',
    },
    {
      file: 'ubuntu-capsule-dark-settings-background.png',
      theme: 'dark',
      slots: ['themes'],
      focus: 'themes',
      settingsPanel: 'background',
    },
    { file: 'ubuntu-capsule-light-desktop.png', theme: 'light' },
    { file: 'ubuntu-capsule-light-overview.png', theme: 'light', overview: 'workspace' },
    { file: 'ubuntu-capsule-light-firefox.png', theme: 'light', slots: ['firefox'], focus: 'firefox' },
    { file: 'ubuntu-capsule-light-nautilus.png', theme: 'light', slots: ['nemo'], focus: 'nemo' },
  ];

  for (const scene of shots) {
    await prepareScene(page, scene);
    const out = path.join(DEST, scene.file);
    await page.screenshot({ path: out, fullPage: false });
    const size = fs.statSync(out).size;
    process.stdout.write(`  → ${out} (${size} octets)\n`);
  }

  await browser.close();
  process.stdout.write(`OK ${DEST} (${shots.length} fichiers)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
