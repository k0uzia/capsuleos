#!/usr/bin/env node
/**
 * Smoke H5 P0 — night-light, dynamic-workspaces, dnd (Playwright + statique).
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

const themeStorage = read('usr/lib/capsuleos/shells/linux/capsule-theme-storage.js');
const workspacesJs = read('usr/lib/capsuleos/shells/linux/gnome-workspaces.js');
const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const calendarJs = read('usr/lib/capsuleos/shells/linux/calendar-popover.js');
const prefsCss = read('usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');

if (!themeStorage.includes('nightLightTransition')) errors.push('nightLightTransition absent');
if (!workspacesJs.includes('is-spring-update')) errors.push('workspaces spring absent');
if (!parityJs.includes('syncDndChrome')) errors.push('syncDndChrome absent');
if (!calendarJs.includes('capsule:dnd-changed')) errors.push('calendar DND listener absent');
if (!prefsCss.includes('gnome-workspace-spring-in')) errors.push('spring keyframes absent');
if (!prefsCss.includes('night-light-transition')) errors.push('night-light transition CSS absent');

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
      () => window.CapsuleThemeStorage && window.CapsuleGnomeSettingsParity && window.CapsuleGnomeWorkspaces,
      null,
      { timeout: 30000 },
    );

    const result = await page.evaluate(async () => {
      const checks = [];
      const storage = window.CapsuleThemeStorage;
      const parity = window.CapsuleGnomeSettingsParity;

      storage.applyNightLight(true);
      checks.push({
        id: 'night-light-dataset',
        ok: document.documentElement.dataset.nightLight === 'on',
      });
      checks.push({
        id: 'night-light-transition-flag',
        ok: document.documentElement.dataset.nightLightTransition === 'on',
      });
      await new Promise((r) => setTimeout(r, 50));
      storage.applyNightLight(false);

      const countBefore = window.CapsuleGnomeWorkspaces.count;
      parity.cycleSelectById('dynamic-workspaces', document.querySelector('#themes #themesApp'));
      const countAfter = window.CapsuleGnomeWorkspaces.count;
      checks.push({
        id: 'dynamic-workspaces-count',
        ok: countBefore !== countAfter,
      });
      const strip = document.querySelector('[data-gnome-workspaces-mini]');
      checks.push({
        id: 'dynamic-workspaces-spring-class',
        ok: strip ? strip.classList.contains('is-spring-update') || strip.querySelectorAll('.fedora-overview__mini-workspace').length > 0 : false,
      });

      parity.applySwitch('dnd', true, document.querySelector('#themes #themesApp'));
      const qsActive = document.querySelector('.quick-settings__tile-icon--dnd')?.closest('.quick-settings__tile')?.classList.contains('quick-settings__tile--active');
      const settingsSw = document.querySelector('[data-settings-switch="dnd"]')?.getAttribute('aria-checked');
      checks.push({ id: 'dnd-dataset', ok: document.documentElement.dataset.dndEnabled === 'on' });
      checks.push({ id: 'dnd-qs-tile', ok: !!qsActive });
      checks.push({ id: 'dnd-settings-switch', ok: settingsSw === 'true' });

      const popover = document.getElementById('taskbar-calendar-popover');
      const notifText = popover?.querySelector('.calendar-popover__notif-text')?.textContent || '';
      checks.push({
        id: 'dnd-calendar-text',
        ok: notifText.includes('masquées'),
      });

      return { checks, failed: checks.filter((c) => !c.ok).map((c) => c.id) };
    });

    if (result.failed?.length) {
      errors.push(`Playwright H5 P0 : ${result.failed.join(', ')}`);
    } else {
      process.stdout.write(`  Playwright H5 P0 : ${result.checks.length} checks OK\n`);
    }
  } catch (err) {
    errors.push(`Playwright H5 P0 : ${err.message}`);
  } finally {
    await browser.close();
  }
}

await runPlaywright();

if (errors.length) {
  console.error('smoke-h5-p0-shell — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-h5-p0-shell OK');
