#!/usr/bin/env node
/**
 * Smoke calendrier tray KDE Neon — popover, navigation mois, grille 6×7, Escape.
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-neon-calendar.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const URL = process.env.CAPSULE_KDE_NEON_URL
  || `${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500'}/home/Debian/KDE-Neon/index.html`;
const CLOCK_ISO = '2026-06-08T14:30:00+02:00';

const errors = [];

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));

if (!chromePath) {
  console.error('Chrome/Playwright introuvable — définir PLAYWRIGHT_CHROME');
  process.exit(1);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.clock.install({ time: new Date(CLOCK_ISO) });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#taskbar-clock-trigger', { timeout: 15000 });

  await page.click('#taskbar-clock-trigger');
  await page.waitForSelector('#taskbar-calendar-popover:not([hidden])', { timeout: 8000 });

  const weekCells = await page.locator('#cal-weekday-row .calendar-popover__week-cell').count();
  if (weekCells !== 7) {
    errors.push(`jours semaine : ${weekCells} (attendu 7)`);
  }

  const dayCount = await page.locator('#cal-days-grid .calendar-popover__day').count();
  if (dayCount !== 42) {
    errors.push(`grille calendrier : ${dayCount} cellules (attendu 42)`);
  }

  const monthBefore = await page.locator('#cal-month-title').textContent();
  await page.click('#cal-prev-month');
  await page.waitForFunction(
    (prev) => document.getElementById('cal-month-title')?.textContent !== prev,
    monthBefore,
    { timeout: 5000 },
  ).catch(() => {
    errors.push('navigation mois précédent : titre inchangé');
  });

  await page.click('#cal-next-month');
  await page.click('#cal-today-btn');
  const monthAfterToday = await page.locator('#cal-month-title').textContent();
  if (!monthAfterToday || !/juin/i.test(monthAfterToday)) {
    errors.push(`bouton Aujourd'hui : titre=${monthAfterToday} (attendu juin)`);
  }

  const today = await page.locator('#cal-days-grid .calendar-popover__day--today').count();
  if (today < 1) {
    errors.push('jour courant (--today) absent');
  }

  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => document.getElementById('taskbar-calendar-popover')?.hidden === true,
    null,
    { timeout: 5000 },
  ).catch(() => {
    errors.push('Escape : popover toujours visible');
  });

  const expanded = await page.locator('#taskbar-clock-trigger').getAttribute('aria-expanded');
  if (expanded !== 'false') {
    errors.push(`aria-expanded après fermeture : ${expanded}`);
  }
} catch (err) {
  errors.push(err.message || String(err));
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('✗ smoke-kde-neon-calendar');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('✓ smoke-kde-neon-calendar OK');
