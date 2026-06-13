#!/usr/bin/env node
/**
 * Smoke Discover KDE Neon — catégories actives + fiche application.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const HTTP_BASE = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765';
const URL = process.env.CAPSULE_KDE_NEON_URL || `${HTTP_BASE}/home/Debian/KDE-Neon/index.html`;
const errors = [];

const playwrightCache = path.join(process.env.HOME || '', '.cache/ms-playwright');
const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  ...(fs.existsSync(playwrightCache)
    ? fs.readdirSync(playwrightCache)
      .filter((d) => d.startsWith('chromium-'))
      .map((d) => path.join(playwrightCache, d, 'chrome-linux64/chrome'))
    : []),
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

  const detailBeforeInstall = await page.evaluate(() => ({
    name: document.querySelector('.kde-discover-app-detail__name')?.textContent?.trim(),
    galleryShots: document.querySelectorAll('.kde-discover-app-detail__slide, .kde-discover-app-detail__shot').length,
    galleryImages: document.querySelectorAll('.kde-discover-app-detail__shot-img').length,
    description: document.querySelector('.kde-discover-app-detail__description-text')?.textContent?.trim(),
    developer: document.querySelector('.kde-discover-app-detail__developer')?.textContent?.trim(),
    origin: document.querySelector('.kde-discover-app-detail__origin')?.textContent?.trim(),
  }));

  if (!detailBeforeInstall.name || detailBeforeInstall.name.indexOf('VLC') === -1) {
    errors.push(`fiche app : titre=${detailBeforeInstall.name || '(vide)'}`);
  }
  if (detailBeforeInstall.galleryShots < 2) {
    errors.push(`fiche app : galerie=${detailBeforeInstall.galleryShots} captures`);
  }
  if (detailBeforeInstall.galleryImages < 2) {
    errors.push(`fiche app : assets VM absents (${detailBeforeInstall.galleryImages} images)`);
  }
  if (!detailBeforeInstall.description || detailBeforeInstall.description.length < 20) {
    errors.push('fiche app : description absente ou trop courte');
  }
  await page.click('[data-discover-app-install="vlc"]');
  await page.waitForFunction(
    () => {
      const status = document.querySelector('[data-discover-app-status]');
      const primary = document.querySelector('.kde-discover-app-detail__action--primary');
      const done = primary && (
        primary.classList.contains('is-installed')
        || primary.hasAttribute('data-discover-app-open')
        || primary.textContent.trim() === 'Ouvrir'
      );
      return status && !status.hidden && /installée/i.test(status.textContent) && done;
    },
    null,
    { timeout: 12000 },
  );

  const detailAfterInstall = await page.evaluate(() => {
    const primary = document.querySelector('.kde-discover-app-detail__action--primary');
    return {
      primaryLabel: primary ? primary.textContent.trim() : '',
      isInstalled: primary ? primary.classList.contains('is-installed') : false,
      openSlot: primary ? primary.getAttribute('data-discover-app-open') : null,
      status: document.querySelector('[data-discover-app-status]')?.textContent?.trim(),
    };
  });
  if (!detailAfterInstall.status || !/installée/i.test(detailAfterInstall.status)) {
    errors.push(`fiche app : statut post-install=${detailAfterInstall.status || '(vide)'}`);
  }
  if (!detailAfterInstall.isInstalled && detailAfterInstall.primaryLabel !== 'Ouvrir') {
    errors.push(`fiche app : bouton post-install=${detailAfterInstall.primaryLabel || '(vide)'}`);
  }

  const storeMeta = await page.evaluate(() => {
    if (typeof window.CapsuleGnomeStore === 'undefined'
      || typeof window.CapsuleGnomeStore.loadStoreInstalledMeta !== 'function') {
      return { ok: false, reason: 'CapsuleGnomeStore absent' };
    }
    const meta = window.CapsuleGnomeStore.loadStoreInstalledMeta('linux-kde-neon');
    const ids = meta && Array.isArray(meta.appIds) ? meta.appIds : [];
    return { ok: ids.indexOf('vlc') !== -1, appIds: ids };
  });
  if (!storeMeta.ok) {
    errors.push(`store install meta : ${storeMeta.reason || JSON.stringify(storeMeta.appIds)}`);
  }

  await page.evaluate(() => {
    const back = document.querySelector('[data-discover-app-back]');
    if (back) {
      back.click();
    }
  });
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

  console.log(JSON.stringify({
    ok: errors.length === 0,
    errors,
    cats,
    detailBeforeInstall,
    detailAfterInstall,
    filtered,
  }, null, 2));
} catch (err) {
  errors.push(err.message || String(err));
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
} finally {
  await browser.close();
}

process.exit(errors.length ? 1 : 0);
