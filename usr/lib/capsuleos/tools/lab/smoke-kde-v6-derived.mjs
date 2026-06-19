#!/usr/bin/env node
/**
 * Smoke V6 — propagation dérivés KDE (cloisonnement + Discover Kirigami).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const derived = [
  { id: 'linux-opensuse', index: 'home/SUSE/openSUSE/index.html', bodyId: 'opensuse', url: 'http://127.0.0.1:8765/home/SUSE/openSUSE/index.html' },
  { id: 'linux-mx-kde', index: 'home/Debian/MX-KDE/index.html', bodyId: 'mx-kde', url: 'http://127.0.0.1:8765/home/Debian/MX-KDE/index.html' },
  { id: 'linux-debian-kde', index: 'home/Debian/Debian-KDE/index.html', bodyId: 'debian-kde', url: 'http://127.0.0.1:8765/home/Debian/Debian-KDE/index.html' },
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

for (const skin of derived) {
  const html = read(skin.index);
  const menu = read(skin.index.replace('index.html', 'content/mainMenu-data.js'));
  if (html.includes('toolkits/gnome/apps')) {
    errors.push(`${skin.id} : fuite toolkits/gnome dans index.html`);
  }
  if (menu.includes('toolkits/gnome/apps')) {
    errors.push(`${skin.id} : fuite toolkits/gnome dans mainMenu-data.js`);
  }
  if (!html.includes('discover-kde.js')) {
    errors.push(`${skin.id} : discover-kde.js absent`);
  }
  if (html.includes('update-manager.js')) {
    errors.push(`${skin.id} : update-manager.js interdit (écrase initUpdateManagerApp Discover)`);
  }
  const catalog = skin.index.replace('index.html', 'content/discover-catalog.json');
  if (!fs.existsSync(path.join(ROOT, catalog))) {
    errors.push(`${skin.id} : discover-catalog.json absent`);
  }
  const skinCss = skin.index.replace('index.html', 'style/apps/update_manager.skin.css');
  if (!fs.existsSync(path.join(ROOT, skinCss))) {
    errors.push(`${skin.id} : style/apps/update_manager.skin.css absent`);
  }
}

const sharedCss = 'usr/share/capsuleos/linux/apps/style/discover-kirigami-kde.shared.css';
if (!fs.existsSync(path.join(ROOT, sharedCss))) {
  errors.push('discover-kirigami-kde.shared.css absent');
}

const p3 = spawnSync('node', ['usr/lib/capsuleos/tools/lab/smoke-kde-v4-p3-propagation.mjs'], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (p3.status !== 0) {
  errors.push('smoke-kde-v4-p3-propagation en échec');
}

const p4 = spawnSync('node', ['usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs'], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (p4.status !== 0) {
  errors.push('smoke-kde-p4-propagation en échec');
}

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (chromePath && !process.env.SKIP_PLAYWRIGHT) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  for (const skin of derived) {
    const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });
    try {
      await page.goto(skin.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });
      await page.evaluate(() => window.openWindowByDataLink('update_manager'));
      await page.waitForFunction(
        () => document.querySelector('[data-discover-home-mount] .kde-discover-card'),
        null,
        { timeout: 60000 },
      );
      const cards = await page.locator('[data-discover-home-mount] .kde-discover-card').count();
      if (cards < 3) {
        errors.push(`${skin.id} : discover cards=${cards} (attendu ≥3)`);
      }
    } catch (err) {
      errors.push(`${skin.id} runtime : ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  phase: 'V6-derived',
  errors,
  derived: derived.map((s) => s.id),
}, null, 2));
process.exit(errors.length ? 1 : 0);
