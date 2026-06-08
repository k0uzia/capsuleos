#!/usr/bin/env node
/**
 * Smoke kickoff KDE Neon — 30/30 apps avec dataLink ouvrant un slot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
const errors = [];

const menuDataPath = path.join(ROOT, 'home/Debian/KDE-Neon/content/mainMenu-data.js');
const menuDataSrc = fs.readFileSync(menuDataPath, 'utf8');
const appsMatch = menuDataSrc.match(/const MENU_APPS = (\[[\s\S]*?\]);/);
if (!appsMatch) {
  console.log(JSON.stringify({ ok: false, errors: ['mainMenu-data.js : MENU_APPS introuvable'] }, null, 2));
  process.exit(1);
}

// eslint-disable-next-line no-new-func
const MENU_APPS = Function(`return ${appsMatch[1]};`)();
const missing = MENU_APPS.filter((app) => !app.dataLink);
const slots = [...new Set(MENU_APPS.map((app) => app.dataLink).filter(Boolean))];

if (MENU_APPS.length !== 30) {
  errors.push(`catalogue : ${MENU_APPS.length} apps (attendu 30)`);
}
if (missing.length) {
  errors.push(`sans dataLink : ${missing.map((app) => app.name).join(', ')}`);
}

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (!chromePath) {
  errors.push('Chrome introuvable');
  console.log(JSON.stringify({ ok: false, errors, appCount: MENU_APPS.length, slots: slots.length }, null, 2));
  process.exit(1);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  const slotResults = [];
  for (const slot of slots) {
    const result = await page.evaluate(async (dataLink) => {
      const container = document.querySelector(`div.windowElement[data-link="${dataLink}"]`);
      if (!container) {
        return { dataLink, ok: false, reason: 'container-absent' };
      }
      window.openWindowByDataLink(dataLink);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });
      const visible = container.style.display !== 'none';
      return { dataLink, ok: visible, reason: visible ? 'ok' : 'hidden' };
    }, slot);
    slotResults.push(result);
    if (!result.ok) {
      errors.push(`slot ${slot} : ${result.reason}`);
    }
  }

  const failedIcons = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('#mainMenu .menu-app-item__icon img')];
    return icons.filter((img) => !img.naturalWidth || !img.naturalHeight).length;
  });
  if (failedIcons > 0) {
    errors.push(`kickoff icônes : ${failedIcons} naturalWidth=0`);
  }

  console.log(JSON.stringify({
    ok: errors.length === 0,
    errors,
    appCount: MENU_APPS.length,
    linkedApps: MENU_APPS.length - missing.length,
    slots: slots.length,
    slotResults,
  }, null, 2));
} catch (err) {
  errors.push(err.message || String(err));
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
} finally {
  await browser.close();
}

process.exit(errors.length ? 1 : 0);
