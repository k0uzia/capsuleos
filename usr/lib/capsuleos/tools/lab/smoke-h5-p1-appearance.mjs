#!/usr/bin/env node
/**
 * Smoke H5 P1 — accent, wallpaper, hot-corner (Playwright + statique).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-h5-p1-appearance.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-h5-p1-appearance.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const rockyIndex = read('home/RedHat/Rocky/index.html');
const hotCornersJs = read('usr/lib/capsuleos/shells/linux/gnome-hot-corners.js');
const themeStorage = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const prefsCss = read('usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');

if (!rockyIndex.includes('gnome-hot-corners.js')) {
  errors.push('Rocky index : gnome-hot-corners.js non chargé');
}
if (!hotCornersJs.includes('fedora-overview-hot-zone')) {
  errors.push('gnome-hot-corners.js : zone coin actif absente');
}
if (!themeStorage.includes('wallpaperTransition')) {
  errors.push('capsule-theme-storage.js : transition fond absente');
}
if (!themeStorage.includes('--settings-accent-hex')) {
  errors.push('capsule-theme-storage.js : --settings-accent-hex absent');
}
if (!prefsCss.includes('transition: background 200ms ease')) {
  errors.push('gnome-shell-preferences.base.css : transition fond 200ms absente');
}
if (!prefsCss.includes('.fedora-overview-hot-zone')) {
  errors.push('gnome-shell-preferences.base.css : .fedora-overview-hot-zone absente');
}

async function runPlaywright() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    errors.push('Playwright indisponible');
    return;
  }

  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto(resolveCapsuleOsUrl('linux-rocky'), { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(
      () => typeof window.CapsuleThemeStorage?.applyAccentColor === 'function'
        && document.getElementById('rocky'),
      null,
      { timeout: 30000 },
    );

    const result = await page.evaluate(async () => {
      const checks = [];
      const storage = window.CapsuleThemeStorage;
      const shell = document.getElementById('rocky');

      storage.applyAccentColor('orange');
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--gcc-accent').trim();
      checks.push({
        id: 'accent-css-var',
        ok: accentColor.toLowerCase() === '#ed5b00' || accentColor === 'rgb(237, 91, 0)',
      });
      checks.push({
        id: 'accent-dataset',
        ok: document.documentElement.dataset.gnomeAccent === 'orange',
      });

      storage.applyWallpaper('abstract-2', 'rocky');
      const bg = getComputedStyle(shell).transitionProperty || '';
      checks.push({
        id: 'wallpaper-dataset',
        ok: document.documentElement.dataset.gnomeWallpaper === 'abstract-2',
      });
      checks.push({
        id: 'wallpaper-transition-css',
        ok: bg.includes('background') || getComputedStyle(shell).transitionDuration !== '0s',
      });

      const zone = shell.querySelector('.fedora-overview-hot-zone');
      checks.push({ id: 'hot-zone-dom', ok: !!zone });

      document.documentElement.dataset.hotCorners = 'off';
      document.dispatchEvent(new CustomEvent('capsule:hot-corners-changed', { detail: { enabled: false } }));
      checks.push({
        id: 'hot-corners-off-dataset',
        ok: document.documentElement.dataset.hotCorners === 'off',
      });
      checks.push({
        id: 'hot-zone-disabled-class',
        ok: zone ? zone.classList.contains('is-disabled') : false,
      });

      document.documentElement.dataset.hotCorners = 'on';
      document.dispatchEvent(new CustomEvent('capsule:hot-corners-changed', { detail: { enabled: true } }));
      checks.push({
        id: 'hot-zone-enabled-class',
        ok: zone ? !zone.classList.contains('is-disabled') : false,
      });

      if (zone && window.CapsuleGnomeOverview) {
        window.CapsuleGnomeOverview.setOverview(false, 'workspace');
        const rect = zone.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        zone.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        await new Promise((r) => setTimeout(r, 300));
        checks.push({
          id: 'hot-corner-opens-overview',
          ok: shell.classList.contains('is-overview'),
        });
        window.CapsuleGnomeOverview.setOverview(false, 'workspace');
        document.documentElement.dataset.hotCorners = 'off';
        zone.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }));
        await new Promise((r) => setTimeout(r, 300));
        checks.push({
          id: 'hot-corner-off-no-overview',
          ok: !shell.classList.contains('is-overview'),
        });
      }

      return {
        checks,
        failed: checks.filter((c) => !c.ok).map((c) => c.id),
      };
    });

    if (result.failed?.length) {
      errors.push(`Playwright H5 P1 : ${result.failed.join(', ')}`);
    } else {
      process.stdout.write(`  Playwright H5 P1 : ${result.checks.length} checks OK\n`);
    }
  } catch (err) {
    errors.push(`Playwright H5 P1 : ${err.message}`);
  } finally {
    await browser.close();
  }
}

await runPlaywright();

if (errors.length) {
  console.error('smoke-h5-p1-appearance — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-h5-p1-appearance OK');
