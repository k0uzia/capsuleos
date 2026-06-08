#!/usr/bin/env node
/**
 * Smoke Discover KDE Neon — catégories actives + fiche application.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
const errors = [];

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
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
  await page.waitForFunction(
    () => document.querySelector('[data-discover-home-mount] .kde-discover-card'),
    null,
    { timeout: 60000 },
  );

  const cats = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.kde-updates__cat')];
    return {
      total: buttons.length,
      enabled: buttons.filter((btn) => !btn.disabled).length,
    };
  });
  if (cats.enabled < 5) {
    errors.push(`categories : ${cats.enabled}/${cats.total} actives`);
  }

  await page.click('[data-discover-home-mount] .kde-discover-card[data-discover-app="vlc"]');
  await page.waitForFunction(
    () => {
      const panel = document.querySelector('[data-discover-app-detail]');
      return panel && !panel.hidden;
    },
    null,
    { timeout: 8000 },
  );

  await page.click('[data-discover-app-install="vlc"]');
  await page.waitForFunction(
    () => {
      const status = document.querySelector('[data-discover-app-status]');
      return status && !status.hidden && status.textContent.length > 0;
    },
    null,
    { timeout: 5000 },
  );

  await page.click('[data-discover-app-back]');
  await page.waitForFunction(
    () => document.querySelector('[data-discover-panel="home"]:not([hidden])'),
    null,
    { timeout: 5000 },
  );

  await page.click('.kde-updates__cat[data-discover-cat="internet"]');
  await page.waitForTimeout(400);

  const filtered = await page.evaluate(() => ({
    activeCat: document.querySelector('.kde-updates__cat.is-active')?.dataset.discoverCat,
    cards: document.querySelectorAll('[data-discover-home-mount] .kde-discover-card').length,
  }));
  if (filtered.activeCat !== 'internet') {
    errors.push(`filtre internet : cat active=${filtered.activeCat}`);
  }
  if (filtered.cards < 1) {
    errors.push(`filtre internet : cartes=${filtered.cards}`);
  }

  const detail = await page.evaluate(() => ({
    name: document.querySelector('.kde-discover-app-detail__name')?.textContent?.trim(),
    installDisabled: document.querySelector('[data-discover-app-install="vlc"]')?.disabled,
    status: document.querySelector('[data-discover-app-status]')?.textContent?.trim(),
  }));

  if (!detail.name || detail.name.indexOf('VLC') === -1) {
    errors.push(`fiche app : titre=${detail.name || '(vide)'}`);
  }
  if (!detail.installDisabled) {
    errors.push('fiche app : bouton Installer non désactivé après clic');
  }

  console.log(JSON.stringify({ ok: errors.length === 0, errors, cats, filtered, detail }, null, 2));
} catch (err) {
  errors.push(err.message || String(err));
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
} finally {
  await browser.close();
}

process.exit(errors.length ? 1 : 0);
