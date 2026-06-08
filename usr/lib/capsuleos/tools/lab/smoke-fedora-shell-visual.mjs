#!/usr/bin/env node
/**
 * Smoke visuel Fedora — Aperçu GNOME 50, chrome CSD, dash favoris, recherche.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fedora-shell-visual.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const URL = `${BASE}/home/RedHat/Fedora/index.html`;
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const overviewCss = read('home/RedHat/Fedora/style/gnome-shell/overview.css');
const tokensCss = read('home/RedHat/Fedora/style/gnome-shell/tokens.css');
const workstationCss = read('home/RedHat/Fedora/style/gnome-workstation.css');
const indexHtml = read('home/RedHat/Fedora/index.html');

if (!tokensCss.includes('--font-ui')) {
  errors.push('tokens.css : --font-ui absent (GNOME 50 Adwaita Sans)');
}
if (!overviewCss.includes('.fedora-overview::before')) {
  errors.push('overview.css : fond Aperçu flouté absent');
}
if (!overviewCss.includes('.fedora-overview__dash-item.is-running::after')) {
  errors.push('overview.css : indicateur dash running absent');
}
if (!workstationCss.includes('--fedora-bg')) {
  errors.push('gnome-workstation.css : fond F44 (--fedora-bg) absent');
}
const dashOrder = ['firefox', 'calendar', 'nemo', 'update_manager', 'text_editor', 'calculator'];
const dashBlock = indexHtml.match(/<nav class="fedora-overview__dash"[\s\S]*?<\/nav>/);
if (!dashBlock) {
  errors.push('index.html : dash Aperçu introuvable');
} else {
  const links = [...dashBlock[0].matchAll(/data-overview-link="([^"]+)"/g)].map((m) => m[1]);
  if (links.join(',') !== dashOrder.join(',')) {
    errors.push(`index.html : ordre dash VM attendu ${dashOrder.join(' → ')}, obtenu ${links.join(' → ')}`);
  }
}

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  errors.push('Playwright indisponible');
}

if (chromium && defaultChrome) {
  const browser = await chromium.launch({ headless: true, executablePath: defaultChrome });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(
      () => typeof window.openWindowByDataLink === 'function' && document.getElementById('fedora'),
      null,
      { timeout: 60000 },
    );

    const overview = await page.evaluate(() => {
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(true, 'workspace');
      }
      const shell = document.getElementById('fedora');
      const section = document.querySelector('.fedora-overview');
      const dash = document.querySelector('.fedora-overview__dash');
      const search = document.querySelector('[data-overview-search-input]');
      return {
        visible: shell?.classList.contains('is-overview') && section?.getAttribute('aria-hidden') === 'false',
        dashCount: dash?.querySelectorAll('.fedora-overview__dash-item[data-overview-link]').length || 0,
        hasSearch: !!search,
        hasOverviewApi: typeof window.CapsuleGnomeOverview?.setOverview === 'function',
        fontUi: getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim(),
      };
    });
    if (!overview.hasOverviewApi) errors.push('Playwright : CapsuleGnomeOverview absent');
    if (!overview.visible) errors.push('Playwright : Aperçu non ouvert (is-overview)');
    if (overview.dashCount !== 6) errors.push(`Playwright : dash ${overview.dashCount}/6 favoris`);
    if (!overview.hasSearch) errors.push('Playwright : champ recherche Aperçu absent');
    if (!overview.fontUi.includes('Adwaita Sans')) {
      errors.push(`Playwright : --font-ui inattendu (${overview.fontUi || 'vide'})`);
    }

    await page.evaluate(() => window.openWindowByDataLink('firefox'));
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      if (window.CapsuleTaskbarLauncherState?.refresh) {
        window.CapsuleTaskbarLauncherState.refresh();
      }
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(true, 'workspace');
      }
    });
    await page.waitForTimeout(400);

    const dashFirefox = await page.$eval(
      '.fedora-overview__dash-item[data-overview-link="firefox"]',
      (el) => ({
        running: el.classList.contains('is-running'),
        focused: el.classList.contains('is-focused'),
      }),
    );
    if (!dashFirefox.running) errors.push('Playwright : dash Firefox non is-running');
    if (!dashFirefox.focused) errors.push('Playwright : dash Firefox non is-focused');

    await page.evaluate(() => {
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(true, 'workspace');
      }
    });
    await page.waitForFunction(
      () => document.getElementById('fedora')?.classList.contains('is-overview'),
      null,
      { timeout: 5000 },
    );
    await page.fill('[data-overview-search-input]', 'fichiers');
    await page.waitForTimeout(300);
    const searchImg = await page.$eval('.fedora-overview__search-result img', (img) => img.src);
    if (searchImg.includes('/Rocky/') || searchImg.endsWith('/assets/images/')) {
      errors.push(`Playwright : icône recherche non résolue (${searchImg})`);
    }

    await page.evaluate(() => {
      if (window.CapsuleGnomeOverview?.setOverview) {
        window.CapsuleGnomeOverview.setOverview(false, 'workspace');
      }
    });
    await page.evaluate(() => window.openWindowByDataLink('profile'));
    await page.waitForSelector('div[data-link="profile"]', { state: 'visible', timeout: 15000 });

    const csd = await page.evaluate(() => {
      const win = document.querySelector('div[data-link="profile"]');
      const closeBtn = win?.querySelector('.gnome-app__window-controls #closeBtn, #closeBtn');
      const header = win?.querySelector('.gnome-app__header-end, .profile-app__header');
      if (!win || !closeBtn || !header) return { ok: false, reason: 'missing-elements' };
      const winRect = win.getBoundingClientRect();
      const closeRect = closeBtn.getBoundingClientRect();
      return {
        ok: closeRect.right <= winRect.right + 1 && closeRect.width > 4,
        headerH: Math.round(header.getBoundingClientRect().height),
      };
    });
    if (!csd.ok) errors.push('Playwright : boutons CSD profile non visibles');
    else process.stdout.write(`  Playwright : CSD profile header ${csd.headerH}px OK\n`);

    const wallpaper = await page.evaluate(() => {
      const shell = document.getElementById('fedora');
      const bg = shell ? getComputedStyle(shell).backgroundImage : '';
      return {
        hasF44: bg.includes('f44-01') || document.documentElement.dataset.gnomeWallpaper === 'f44-01',
        bgSnippet: bg.slice(0, 120),
      };
    });
    if (!wallpaper.hasF44) {
      errors.push(`Playwright : fond F44 non détecté (${wallpaper.bgSnippet})`);
    }
  } catch (err) {
    errors.push(`Playwright : ${err.message}`);
  } finally {
    await browser.close();
  }
}

if (errors.length) {
  console.error('smoke-fedora-shell-visual — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-fedora-shell-visual OK — overview, dash, CSD, fond F44');
