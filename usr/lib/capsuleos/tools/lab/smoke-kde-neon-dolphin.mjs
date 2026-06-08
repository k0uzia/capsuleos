#!/usr/bin/env node
/**
 * Smoke Dolphin KDE Neon — recherche, hamburger icônes, menu contextuel flyouts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
const errors = [];

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (!chromePath) {
  console.log(JSON.stringify({ ok: false, errors: ['Chrome introuvable'] }, null, 2));
  process.exit(1);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => window.openWindowByDataLink('nemo'));
  await page.waitForFunction(
    () => {
      const root = document.querySelector('.windowElement[data-link="nemo"]');
      return root && root.style.display !== 'none'
        && root.querySelectorAll('a[data-item-name]').length >= 3;
    },
    null,
    { timeout: 30000 },
  );

  await page.click('#dolphin-main-menu');
  await page.waitForFunction(
    () => {
      const menu = document.querySelector('#dolphin-hamburger-menu');
      return menu && !menu.hidden;
    },
    null,
    { timeout: 5000 },
  );

  const hamburgerIcons = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('#dolphin-hamburger-menu img')];
    return icons.map((img) => ({
      src: img.getAttribute('src') || '',
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
  });
  const badIcons = hamburgerIcons.filter((icon) => !icon.width || !icon.height);
  if (badIcons.length) {
    errors.push(`hamburger : ${badIcons.length} icône(s) naturalWidth=0`);
  }

  await page.click('.dolphin-toolbar__search, .dolphin-toolbar__btn--search');
  await page.waitForFunction(
    () => {
      const bar = document.querySelector('#dolphin-search-bar');
      return bar && !bar.hidden;
    },
    null,
    { timeout: 5000 },
  );

  await page.click('a[data-item-name]', { button: 'right' });
  await page.waitForFunction(
    () => {
      const menu = document.querySelector('#nemo-context-menu.dolphin-context-menu');
      return menu && !menu.hidden;
    },
    null,
    { timeout: 8000 },
  );

  const submenu = await page.$('#nemo-context-menu.dolphin-context-menu [data-nemo-ctx="assign-tags"]');
  if (submenu) {
    await submenu.hover();
    await page.waitForTimeout(250);
  }

  const flyouts = await page.evaluate(() => {
    const menu = document.querySelector('#nemo-context-menu.dolphin-context-menu');
    const panel = menu ? menu.querySelector('.nautilus-context-menu__flyout:not([hidden])') : null;
    return {
      submenuCount: menu ? menu.querySelectorAll('.nautilus-context-menu__item--submenu').length : 0,
      flyoutVisible: !!panel,
      flyoutItems: panel ? panel.querySelectorAll('.nautilus-context-menu__flyout-item').length : 0,
    };
  });

  if (flyouts.submenuCount < 4) {
    errors.push(`context-menu : sous-menus=${flyouts.submenuCount} (attendu ≥4)`);
  }
  if (!flyouts.flyoutVisible || flyouts.flyoutItems < 1) {
    errors.push('context-menu : flyout étiquettes non visible');
  }

  console.log(JSON.stringify({
    ok: errors.length === 0,
    errors,
    hamburgerIcons: hamburgerIcons.length,
    flyouts,
  }, null, 2));
} catch (err) {
  errors.push(err.message || String(err));
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
} finally {
  await browser.close();
}

process.exit(errors.length ? 1 : 0);
