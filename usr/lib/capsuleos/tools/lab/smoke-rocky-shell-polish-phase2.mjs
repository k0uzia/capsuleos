#!/usr/bin/env node
/**
 * Smoke polish shell Rocky phase 2 — Quick Settings + calendrier (P2 shell).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish-phase2.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish-phase2.mjs --playwright
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

const volumeCss = read('home/RedHat/Rocky/style/gnome-shell/volume-popover.css');
const calendarCss = read('home/RedHat/Rocky/style/gnome-shell/calendar-popover.css');
const indexHtml = read('home/RedHat/Rocky/index.html');
const volumeJs = read('usr/lib/capsuleos/shells/linux/volume.js');
const calendarJs = read('usr/lib/capsuleos/shells/linux/calendar-popover.js');

if (!volumeCss.includes('.quick-settings__tile--active')) {
  errors.push('volume-popover.css : tuile QS active absente');
}
if (!volumeCss.includes('var(--menu-accent)')) {
  errors.push('volume-popover.css : accent QS non tokenisé (--menu-accent)');
}
if (!volumeCss.includes('grid-template-columns: repeat(2')) {
  errors.push('volume-popover.css : grille QS 2 colonnes absente');
}
if (!calendarCss.includes('.calendar-popover__columns')) {
  errors.push('calendar-popover.css : layout deux colonnes absent');
}
if (!calendarCss.includes('body#rocky .calendar-popover')) {
  errors.push('calendar-popover.css : ancrage Rocky sous top bar absent');
}
if (!calendarCss.includes('.calendar-popover__day--today')) {
  errors.push('calendar-popover.css : jour courant absent');
}
if (!indexHtml.includes('id="volume-popover"')) {
  errors.push('index.html : popover Quick Settings absent');
}
if (!indexHtml.includes('id="taskbar-calendar-popover"')) {
  errors.push('index.html : popover calendrier absent');
}
if (!volumeJs.includes('tray-quick-settings-btn')) {
  errors.push('volume.js : binding bouton QS absent');
}
if (!calendarJs.includes('taskbar-clock-trigger')) {
  errors.push('calendar-popover.js : binding horloge absent');
}

async function runPlaywright() {
  const url = resolveCapsuleOsUrl('linux-rocky');
  const { chromium } = await import('playwright');
  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  await page.evaluate(() => {
    document.getElementById('tray-quick-settings-btn')?.click();
  });
  await page.waitForTimeout(350);

  const qs = await page.evaluate(() => {
    const pop = document.getElementById('volume-popover');
    const active = document.querySelector('.quick-settings__tile--active');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--menu-accent').trim();
    const activeBg = active ? getComputedStyle(active).backgroundColor : '';
    return {
      open: pop && !pop.hidden,
      tiles: document.querySelectorAll('.quick-settings__tile').length,
      activeBg,
      accent,
    };
  });
  if (!qs.open) errors.push('Playwright : Quick Settings non ouvert');
  if (qs.tiles < 4) errors.push('Playwright : tuiles QS insuffisantes');
  if (!qs.activeBg) errors.push('Playwright : tuile QS active sans fond');

  await page.evaluate(() => {
    document.getElementById('volume-popover')?.setAttribute('hidden', '');
    document.getElementById('taskbar-clock-trigger')?.click();
  });
  await page.waitForTimeout(350);

  const cal = await page.evaluate(() => {
    const pop = document.getElementById('taskbar-calendar-popover');
    const today = document.querySelector('.calendar-popover__day--today');
    const cols = document.querySelector('.calendar-popover__columns');
    return {
      open: pop && !pop.hidden,
      today: !!today,
      twoCols: cols ? getComputedStyle(cols).gridTemplateColumns.split(' ').length >= 2 : false,
      weekday: document.getElementById('cal-weekday-big')?.textContent?.trim() || '',
    };
  });
  if (!cal.open) errors.push('Playwright : calendrier non ouvert');
  if (!cal.today) errors.push('Playwright : jour courant non marqué');
  if (!cal.twoCols) errors.push('Playwright : calendrier non deux colonnes');
  if (!cal.weekday) errors.push('Playwright : en-tête calendrier vide');

  await browser.close();
}

const main = async () => {
  if (process.argv.includes('--playwright')) {
    await runPlaywright();
  }
  if (errors.length) {
    console.error('smoke-rocky-shell-polish-phase2 — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  const outPath = path.join(ROOT, 'root/docs/inventaires/linux-rocky-shell-polish-phase2.json');
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: 'linux-rocky',
    domain: 'gnome-shell-polish',
    phase: 2,
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['quick-settings', 'calendar-popover', 'notifications-column'],
    smoke: 'smoke-rocky-shell-polish-phase2.mjs',
  }, null, 2)}\n`);
  console.log('✓ smoke-rocky-shell-polish-phase2 OK');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
