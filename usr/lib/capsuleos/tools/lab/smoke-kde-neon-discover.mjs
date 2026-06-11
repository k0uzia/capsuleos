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
      return status && !status.hidden && status.textContent.length > 0;
    },
    null,
    { timeout: 5000 },
  );

  const detailAfterInstall = await page.evaluate(() => ({
    installDisabled: document.querySelector('[data-discover-app-install="vlc"]')?.disabled,
    status: document.querySelector('[data-discover-app-status]')?.textContent?.trim(),
  }));
  if (!detailAfterInstall.installDisabled) {
    errors.push('fiche app : bouton Installer non désactivé après clic');
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

  await page.click('[data-discover-nav="home"]');
  await page.waitForTimeout(300);
  await page.click('.kde-updates__cat[data-discover-cat="all"]');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const input = document.querySelector('[data-discover-search]');
    if (!input) {
      return;
    }
    input.value = 'VLC';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(400);

  const searchFiltered = await page.evaluate(() => ({
    cards: document.querySelectorAll('[data-discover-home-mount] .kde-discover-card').length,
    names: [...document.querySelectorAll('[data-discover-home-mount] .kde-discover-card__name')]
      .map((el) => el.textContent.trim()),
  }));
  if (searchFiltered.cards < 1) {
    errors.push(`recherche VLC : cartes=${searchFiltered.cards}`);
  }
  if (!searchFiltered.names.some((n) => n.indexOf('VLC') !== -1)) {
    errors.push(`recherche VLC : résultats=${searchFiltered.names.join(', ')}`);
  }

  await page.evaluate(() => {
    const input = document.querySelector('[data-discover-search]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.click('[data-discover-nav="installed"]');
  await page.waitForFunction(
    () => document.querySelector('[data-discover-panel="installed"]:not([hidden])'),
    null,
    { timeout: 8000 },
  );
  await page.waitForSelector('[data-discover-installed-mount] .kde-discover-card--installed', { timeout: 8000 });

  const installedTab = await page.evaluate(() => ({
    heading: document.querySelector('[data-discover-installed-heading]')?.textContent?.trim(),
    sort: document.querySelector('[data-discover-installed-sort-label]')?.textContent?.trim(),
    cards: document.querySelectorAll('[data-discover-installed-mount] .kde-discover-card--installed').length,
    withSize: document.querySelectorAll('.kde-discover-card--installed__size').length,
    withRemove: document.querySelectorAll('.kde-discover-card--installed__remove').length,
  }));
  if (!installedTab.heading || installedTab.heading.indexOf('119') === -1) {
    errors.push(`installé(s) : en-tête=${installedTab.heading || '(vide)'}`);
  }
  if (installedTab.sort !== 'Tri : Nom') {
    errors.push(`installé(s) : tri=${installedTab.sort || '(vide)'}`);
  }
  if (installedTab.cards < 6) {
    errors.push(`installé(s) : cartes=${installedTab.cards}`);
  }
  if (installedTab.withSize < 6 || installedTab.withRemove < 6) {
    errors.push(`installé(s) : taille=${installedTab.withSize} corbeille=${installedTab.withRemove}`);
  }

  console.log(JSON.stringify({
    ok: errors.length === 0,
    errors,
    cats,
    detailBeforeInstall,
    detailAfterInstall,
    filtered,
    searchFiltered,
    installedTab,
  }, null, 2));
} catch (err) {
  errors.push(err.message || String(err));
  console.log(JSON.stringify({ ok: false, errors }, null, 2));
} finally {
  await browser.close();
}

process.exit(errors.length ? 1 : 0);
