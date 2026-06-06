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
if (!trayCss.includes('--gnome-shell-clock-gap')) {
  errors.push('tray.css : horloge top bar sans tokens --gnome-shell-clock-*');
}
if (!trayCss.includes('flex-flow: var(--rnw)')) {
  errors.push('tray.css : horloge top bar doit être sur une ligne (row)');
}
const workstationCss = read('home/RedHat/Rocky/style/gnome-workstation.css');
if (!workstationCss.includes('fedora-top-bar__center') || !workstationCss.includes('translate(-50%')) {
  errors.push('gnome-workstation.css : horloge non centrée optiquement (absolute 50%)');
}
if (!workstationCss.includes('grid-template-columns: 1fr 1fr') || !workstationCss.includes('grid-column: 2')) {
  errors.push('gnome-workstation.css : tray doit être en colonne 2 (centre absolute hors flux)');
}
const dateJs = read('usr/lib/capsuleos/shells/linux/date.js');
if (!dateJs.includes('rocky-clock-date')) {
  errors.push('date.js : mise à jour rocky-clock-date absente');
}
if (!overviewCss.includes('.fedora-overview::before')) {
  errors.push('overview.css : fond Aperçu flouté (::before) absent');
}
const tokensCss = read('home/RedHat/Rocky/style/gnome-shell/tokens.css');
if (!tokensCss.includes('--fedora-overview-dash-bg')) {
  errors.push('tokens.css : tokens dash Aperçu absents');
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
    const trigger = document.querySelector('.taskbar-clock-trigger');
    const date = document.getElementById('rocky-clock-date')?.textContent || '';
    const time = document.getElementById('taskbar-clock')?.textContent || '';
    const bar = document.querySelector('.fedora-top-bar');
    const center = document.querySelector('.fedora-top-bar__center');
    const barRect = bar?.getBoundingClientRect();
    const centerRect = center?.getBoundingClientRect();
    const offsetPx = barRect && centerRect
      ? Math.abs((centerRect.left + centerRect.width / 2) - (barRect.left + barRect.width / 2))
      : 999;
    return {
      date,
      time,
      row: getComputedStyle(trigger).flexDirection === 'row',
      centerOffsetPx: offsetPx,
      fitsBar: trigger && bar ? trigger.getBoundingClientRect().height <= bar.getBoundingClientRect().height + 1 : false,
    };
  });
  if (!clock.date || clock.date.length < 4) errors.push('Playwright : date top bar vide');
  if (/\blundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche\b/i.test(clock.date)) {
    errors.push('Playwright : date top bar ne doit pas inclure le jour de la semaine (format VM)');
  }
  if (!clock.time || !/^\d{1,2}:\d{2}/.test(clock.time.trim())) errors.push('Playwright : horloge invalide');
  if (!clock.row) errors.push('Playwright : horloge doit être sur une ligne');
  if (clock.centerOffsetPx > 3) errors.push(`Playwright : horloge décentrée (${clock.centerOffsetPx.toFixed(1)}px)`);
  if (!clock.fitsBar) errors.push('Playwright : horloge déborde la top bar');

  const tray = await page.evaluate(() => {
    const bar = document.querySelector('.fedora-top-bar')?.getBoundingClientRect();
    const cluster = document.getElementById('tray-quick-settings-btn')?.getBoundingClientRect();
    if (!bar || !cluster) return { ok: false };
    const centerX = cluster.left + cluster.width / 2;
    const barMid = bar.left + bar.width / 2;
    return {
      ok: true,
      onRightHalf: centerX > barMid + 8,
      overlapsClock: (() => {
        const clock = document.querySelector('.taskbar-clock-trigger')?.getBoundingClientRect();
        if (!clock) return false;
        return !(cluster.left > clock.right + 4 || cluster.right < clock.left - 4);
      })(),
    };
  });
  if (!tray.ok) errors.push('Playwright : tray introuvable');
  if (tray.ok && !tray.onRightHalf) errors.push('Playwright : tray pas aligné à droite');
  if (tray.ok && tray.overlapsClock) errors.push('Playwright : tray superposé à l’horloge');

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
