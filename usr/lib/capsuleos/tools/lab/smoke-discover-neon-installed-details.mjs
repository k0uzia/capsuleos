#!/usr/bin/env node
/**
 * Smoke Discover KDE Neon — fiches détail onglet Installé(s).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const CATALOG = path.join(ROOT, 'home/Debian/KDE-Neon/content/discover-catalog.json');
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
const errors = [];

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const installed = catalog.installed || [];

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
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
  await page.evaluate(() => window.openWindowByDataLink('update_manager'));
  await page.click('[data-discover-nav="installed"]');
  await page.waitForFunction(
    () => document.querySelectorAll('[data-discover-installed-mount] .kde-discover-card--installed').length >= 6,
    null,
    { timeout: 15000 },
  );

  const results = [];
  for (const app of installed) {
    await page.evaluate((appId) => {
      const card = document.querySelector(
        `[data-discover-installed-mount] .kde-discover-card[data-discover-app="${appId}"]`,
      );
      if (card) {
        card.scrollIntoView({ block: 'center' });
        card.click();
      }
    }, app.id);
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-discover-app-detail]');
        return panel && !panel.hidden && panel.querySelector('.kde-discover-app-detail__name');
      },
      null,
      { timeout: 8000 },
    );
    const detail = await page.evaluate(() => {
      const facts = {};
      document.querySelectorAll('.kde-discover-app-detail__facts div').forEach((row) => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (dt && dd) {
          facts[dt.textContent.trim()] = dd.textContent.trim();
        }
      });
      return {
        name: document.querySelector('.kde-discover-app-detail__name')?.textContent?.trim(),
        primary: document.querySelector('.kde-discover-app-detail__header-action--primary')?.textContent?.trim(),
        version: facts.Version || '',
        factsCount: Object.keys(facts).length,
        description: document.querySelector('.kde-discover-app-detail__description-text')?.textContent?.trim(),
        origin: document.querySelector('.kde-discover-app-detail__header-action--origin span:first-child')?.textContent?.trim()
            || document.querySelector('.kde-discover-app-detail__header-action--origin')?.textContent?.trim(),
      };
    });
    const meta = (catalog.appDetails || {})[app.id] || {};
    results.push({ id: app.id, ...detail });

    if (!detail.name) {
      errors.push(`${app.id}: titre absent`);
    }
    if (detail.primary !== 'Lancer') {
      errors.push(`${app.id}: bouton primaire=${detail.primary || '(vide)'} (attendu Lancer)`);
    }
    if (!meta.version && !detail.version) {
      errors.push(`${app.id}: version absente`);
    }
    if (!detail.description || detail.description.length < 12) {
      errors.push(`${app.id}: description absente ou trop courte`);
    }
    if (!detail.origin) {
      errors.push(`${app.id}: origine absente`);
    }

    await page.evaluate(() => {
      const back = document.querySelector('[data-discover-app-back]');
      if (back) {
        back.click();
      }
    });
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('[data-discover-panel="installed"]');
        return panel && !panel.hidden;
      },
      null,
      { timeout: 5000 },
    );
  }

  const out = {
    ok: errors.length === 0,
    tested: installed.length,
    errors,
    sample: results.slice(0, 3),
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 1);
} finally {
  await browser.close();
}
