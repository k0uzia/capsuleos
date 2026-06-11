#!/usr/bin/env node
/**
 * Smoke catégories Discover Neon — browseApps + icônes repo + rendu runtime.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-neon-categories.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreCatalogEntries } from './capsule-app-resolver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const catalogPath = path.join(ROOT, 'home/Debian/KDE-Neon/content/discover-catalog.json');
const inventoryPath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-discover-category-apps.json');
const discoverDir = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/discover');
const errors = [];

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const requiredCats = [
  'internet', 'office', 'graphics', 'games', 'multimedia', 'development',
  'education', 'science', 'system', 'utilities', 'accessibility', 'addons',
];

for (const catId of requiredCats) {
  const spec = catalog.categoryFilters?.[catId];
  const minApps = catId === 'addons' ? 1 : 2;
  if (!spec?.appIds?.length) {
    if (minApps > 0) {
      errors.push(`categoryFilters.${catId} : appIds vide`);
    }
    continue;
  }
  if (spec.appIds.length < minApps) {
    errors.push(`categoryFilters.${catId} : ${spec.appIds.length} apps (attendu ≥${minApps})`);
  }
}

const index = new Map();
[...(catalog.homeSections || []).flatMap((s) => s.apps || []), ...(catalog.browseApps || []), ...(catalog.installed || [])].forEach((app) => {
  if (app?.id) index.set(app.id, app);
});
buildStoreCatalogEntries('linux-kde-neon').forEach((entry) => {
  if (entry?.id) {
    index.set(entry.id, {
      id: entry.id,
      name: entry.title,
      desc: entry.sub || entry.desc,
      iconClass: entry.iconClass,
    });
  }
});

let missingIcons = 0;
for (const catId of requiredCats) {
  const ids = catalog.categoryFilters?.[catId]?.appIds || [];
  for (const id of ids) {
    const app = index.get(id);
    if (!app) {
      errors.push(`${catId} : app ${id} absente du pool catalogue`);
      continue;
    }
    if (!app.icon && !app.iconClass) {
      errors.push(`${catId} : ${id} sans icône`);
      missingIcons += 1;
      continue;
    }
    if (app.icon && !app.iconClass) {
      const iconPath = path.join(discoverDir, app.icon);
      if (!fs.existsSync(iconPath)) {
        errors.push(`${catId} : icône manquante discover/${app.icon}`);
        missingIcons += 1;
      }
    }
  }
}

if (!fs.existsSync(inventoryPath)) {
  errors.push('inventaire linux-kde-neon-discover-category-apps.json absent');
}

const discoverJs = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/shells/linux/discover-kde.js'), 'utf8');
if (!discoverJs.includes('catalogAppIndex')) {
  errors.push('discover-kde.js : catalogAppIndex absent');
}

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (chromePath && !errors.length) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });
  const url = process.env.CAPSULE_KDE_NEON_URL
    || `${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500'}/home/Debian/KDE-Neon/index.html`;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');
      window.openWindowByDataLink('update_manager');
    });
    await page.waitForSelector('[data-discover-home-mount] .kde-discover-card', { timeout: 30000 });

    for (const catId of ['internet', 'accessibility', 'education', 'office']) {
      await page.click(`.kde-updates__cat[data-discover-cat="${catId}"]`);
      await page.waitForFunction(
        (id) => {
          const active = document.querySelector('.kde-updates__cat.is-active');
          return active && active.dataset.discoverCat === id;
        },
        catId,
        { timeout: 5000 },
      );
      const cards = await page.evaluate(() => (
        document.querySelectorAll('[data-discover-home-mount] .kde-discover-card').length
      ));
      if (cards < 2) {
        errors.push(`runtime ${catId} : ${cards} cartes (attendu ≥2)`);
      }
      const hasIcon = await page.evaluate(() => {
        const icon = document.querySelector('[data-discover-home-mount] .kde-discover-card__icon');
        if (!icon) return false;
        if (icon.tagName === 'IMG') {
          return icon.complete && icon.naturalWidth > 0;
        }
        const bg = getComputedStyle(icon).backgroundImage;
        return bg && bg !== 'none';
      });
      if (!hasIcon) {
        errors.push(`runtime ${catId} : icône carte non rendue`);
      }
    }
  } catch (err) {
    errors.push(err.message || String(err));
  } finally {
    await browser.close();
  }
}

if (errors.length) {
  console.error('smoke-discover-neon-categories — ÉCHEC');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const browseCount = (catalog.browseApps || []).length;
console.log(`smoke-discover-neon-categories — OK (${requiredCats.length} catégories, ${browseCount} browseApps)`);
