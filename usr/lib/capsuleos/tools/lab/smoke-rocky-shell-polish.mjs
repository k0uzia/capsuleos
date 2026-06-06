#!/usr/bin/env node
/**
 * Smoke polish shell Rocky — top bar, dash Aperçu, Firefox, Nautilus.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright
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

const launcherJs = read('usr/lib/capsuleos/shells/linux/taskbar-launcher-state.js');
const trayCss = read('home/RedHat/Rocky/style/gnome-shell/tray.css');
const overviewCss = read('home/RedHat/Rocky/style/gnome-shell/overview.css');
const firefoxCss = read('home/RedHat/Rocky/style/apps/firefox.skin.css');
const nautilusCss = read('home/RedHat/Rocky/style/apps/nautilus.skin.css');
const indexHtml = read('home/RedHat/Rocky/index.html');

if (!launcherJs.includes('syncOverviewDash')) {
  errors.push('taskbar-launcher-state.js : syncOverviewDash absent');
}
if (!launcherJs.includes('is-running')) {
  errors.push('taskbar-launcher-state.js : indicateurs dash is-running absents');
}
if (!trayCss.includes('flex-flow: column')) {
  errors.push('tray.css : horloge top bar non empilée (colonne)');
}
if (!trayCss.includes('weekday')) {
  /* date format lives in index.html */
}
if (!indexHtml.includes('weekday:')) {
  errors.push('index.html : date longue GNOME (weekday) absente');
}
if (!overviewCss.includes('.fedora-overview__dash-item.is-running::after')) {
  errors.push('overview.css : pointeur dash running absent');
}
if (!overviewCss.includes('.fedora-overview__dash-item.is-focused::after')) {
  errors.push('overview.css : indicateur dash focused absent');
}
if (!firefoxCss.includes('border-radius: 0.55rem 0.55rem 0 0')) {
  errors.push('firefox.skin.css : onglets Proton arrondis absents');
}
if (!nautilusCss.includes('div[data-link="nemo"].windowElementActive')) {
  errors.push('nautilus.skin.css : focus fenêtre Nautilus absent');
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
    document.querySelector('.fedora-overview-trigger')?.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => window.openWindowByDataLink('firefox'));
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    if (window.CapsuleTaskbarLauncherState?.refresh) {
      window.CapsuleTaskbarLauncherState.refresh();
    }
  });

  const dash = await page.evaluate(() => {
    const btn = document.querySelector('.fedora-overview__dash-item[data-overview-link="firefox"]');
    return {
      running: btn?.classList.contains('is-running'),
      focused: btn?.classList.contains('is-focused'),
    };
  });
  if (!dash.running) errors.push('Playwright : dash Firefox non is-running');
  if (!dash.focused) errors.push('Playwright : dash Firefox non is-focused');

  const clock = await page.evaluate(() => {
    const date = document.getElementById('rocky-clock-date')?.textContent || '';
    const time = document.getElementById('taskbar-clock')?.textContent || '';
    return { date, time, stacked: getComputedStyle(document.querySelector('.taskbar-clock-trigger')).flexDirection === 'column' };
  });
  if (!clock.date || clock.date.length < 6) errors.push('Playwright : date top bar vide');
  if (!clock.time || !/^\d{1,2}:\d{2}/.test(clock.time.trim())) errors.push('Playwright : horloge invalide');
  if (!clock.stacked) errors.push('Playwright : horloge non empilée');

  await browser.close();
}

const main = async () => {
  if (process.argv.includes('--playwright')) {
    await runPlaywright();
  }
  if (errors.length) {
    console.error('smoke-rocky-shell-polish — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  const outPath = path.join(ROOT, 'root/docs/inventaires/linux-rocky-shell-polish.json');
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: 'linux-rocky',
    domain: 'gnome-shell-polish',
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['top-bar', 'overview-dash', 'firefox-chrome', 'nautilus-focus'],
    smoke: 'smoke-rocky-shell-polish.mjs',
  }, null, 2)}\n`);
  console.log('✓ smoke-rocky-shell-polish OK');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
