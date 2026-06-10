#!/usr/bin/env node
/**
 * Smoke polish shell GNOME RHEL — top bar, dash Aperçu, Firefox, Nautilus.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --id linux-rocky
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --id linux-alma --playwright
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', playwright: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--playwright') opts.playwright = true;
  }
  return opts;
};

const loadSkinContext = (registryId) => {
  const profilePath = path.join(ROOT, 'etc/capsuleos/profiles', `${registryId}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`profil absent: ${profilePath}`);
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const skinRel = (profile.paths && profile.paths.skin
    ? profile.paths.skin
    : '').replace(/\/index\.html$/i, '');
  if (!skinRel) {
    throw new Error(`${registryId}: paths.skin manquant`);
  }
  const bodyId = profile.bodyId || registryId.replace(/^linux-/, '');
  return {
    registryId,
    skinRel,
    bodyId,
    clockDateId: `${bodyId}-clock-date`,
  };
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const runStaticChecks = (ctx) => {
  const errors = [];
  const skin = ctx.skinRel;
  const launcherJs = read('usr/lib/capsuleos/shells/linux/taskbar-launcher-state.js');
  const trayCss = read(`${skin}/style/gnome-shell/tray.css`);
  const overviewCss = read(`${skin}/style/gnome-shell/overview.css`);
  const firefoxCss = read(`${skin}/style/apps/firefox.skin.css`);
  const nautilusCss = read(`${skin}/style/apps/nautilus.skin.css`);
  const indexHtml = read(`${skin}/index.html`);
  const workstationCss = read(`${skin}/style/gnome-workstation.css`);
  const tokensCss = read(`${skin}/style/gnome-shell/tokens.css`);
  const dateJs = read('usr/lib/capsuleos/shells/linux/date.js');

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
  if (!workstationCss.includes('fedora-top-bar__center') || !workstationCss.includes('translate(-50%')) {
    errors.push('gnome-workstation.css : horloge non centrée optiquement (absolute 50%)');
  }
  if (!workstationCss.includes('grid-template-columns: 1fr 1fr') || !workstationCss.includes('grid-column: 2')) {
    errors.push('gnome-workstation.css : tray doit être en colonne 2 (centre absolute hors flux)');
  }
  const hasClockDate = indexHtml.includes(ctx.clockDateId)
    || dateJs.includes(ctx.clockDateId);
  if (!hasClockDate) {
    errors.push(`${ctx.clockDateId} : mise à jour date top bar absente`);
  }
  if (!overviewCss.includes('.fedora-overview::before')) {
    errors.push('overview.css : fond Aperçu flouté (::before) absent');
  }
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
  return errors;
};

async function runPlaywright(ctx, errors) {
  const url = resolveCapsuleOsUrl(ctx.registryId);
  const { chromium } = await import('playwright');
  const chromePath = process.env.PLAYWRIGHT_CHROME
    || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
  const fallbacks = ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  const executablePath = fs.existsSync(chromePath)
    ? chromePath
    : fallbacks.find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  await page.evaluate(() => {
    const trigger = document.querySelector('.fedora-overview-trigger');
    if (trigger) trigger.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => window.openWindowByDataLink('firefox'));
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    if (window.CapsuleTaskbarLauncherState && typeof window.CapsuleTaskbarLauncherState.refresh === 'function') {
      window.CapsuleTaskbarLauncherState.refresh();
    }
  });

  const dash = await page.evaluate(() => {
    const btn = document.querySelector('.fedora-overview__dash-item[data-overview-link="firefox"]');
    return {
      running: btn ? btn.classList.contains('is-running') : false,
      focused: btn ? btn.classList.contains('is-focused') : false,
    };
  });
  if (!dash.running) errors.push('Playwright : dash Firefox non is-running');
  if (!dash.focused) errors.push('Playwright : dash Firefox non is-focused');

  const clockDateId = ctx.clockDateId;
  const clock = await page.evaluate((dateId) => {
    const trigger = document.querySelector('.taskbar-clock-trigger');
    const dateEl = document.getElementById(dateId);
    const date = dateEl ? dateEl.textContent : '';
    const time = document.getElementById('taskbar-clock') ? document.getElementById('taskbar-clock').textContent : '';
    const bar = document.querySelector('.fedora-top-bar');
    const center = document.querySelector('.fedora-top-bar__center');
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const centerRect = center ? center.getBoundingClientRect() : null;
    const offsetPx = barRect && centerRect
      ? Math.abs((centerRect.left + centerRect.width / 2) - (barRect.left + barRect.width / 2))
      : 999;
    const triggerStyle = trigger ? getComputedStyle(trigger) : null;
    return {
      date,
      time,
      row: triggerStyle ? triggerStyle.flexDirection === 'row' : false,
      centerOffsetPx: offsetPx,
      fitsBar: trigger && bar ? trigger.getBoundingClientRect().height <= bar.getBoundingClientRect().height + 1 : false,
    };
  }, clockDateId);
  if (!clock.date || clock.date.length < 4) errors.push('Playwright : date top bar vide');
  if (/\blundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche\b/i.test(clock.date)) {
    errors.push('Playwright : date top bar ne doit pas inclure le jour de la semaine (format VM)');
  }
  if (!clock.time || !/^\d{1,2}:\d{2}/.test(clock.time.trim())) errors.push('Playwright : horloge invalide');
  if (!clock.row) errors.push('Playwright : horloge doit être sur une ligne');
  if (clock.centerOffsetPx > 3) errors.push(`Playwright : horloge décentrée (${clock.centerOffsetPx.toFixed(1)}px)`);
  if (!clock.fitsBar) errors.push('Playwright : horloge déborde la top bar');

  const tray = await page.evaluate(() => {
    const bar = document.querySelector('.fedora-top-bar');
    const cluster = document.getElementById('tray-quick-settings-btn');
    if (!bar || !cluster) return { ok: false };
    const barRect = bar.getBoundingClientRect();
    const clusterRect = cluster.getBoundingClientRect();
    const centerX = clusterRect.left + clusterRect.width / 2;
    const barMid = barRect.left + barRect.width / 2;
    const clockEl = document.querySelector('.taskbar-clock-trigger');
    const clockRect = clockEl ? clockEl.getBoundingClientRect() : null;
    let overlapsClock = false;
    if (clockRect) {
      overlapsClock = !(clusterRect.left > clockRect.right + 4 || clusterRect.right < clockRect.left - 4);
    }
    return {
      ok: true,
      onRightHalf: centerX > barMid + 8,
      overlapsClock,
    };
  });
  if (!tray.ok) errors.push('Playwright : tray introuvable');
  if (tray.ok && !tray.onRightHalf) errors.push('Playwright : tray pas aligné à droite');
  if (tray.ok && tray.overlapsClock) errors.push('Playwright : tray superposé à l\'horloge');

  await browser.close();
}

const main = async () => {
  const opts = parseArgs();
  const ctx = loadSkinContext(opts.id);
  const errors = runStaticChecks(ctx);

  if (opts.playwright) {
    await runPlaywright(ctx, errors);
  }

  if (errors.length) {
    console.error(`smoke-rocky-shell-polish — échec (${opts.id})\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const outPath = path.join(ROOT, `root/docs/inventaires/${opts.id}-shell-polish.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: opts.id,
    domain: 'gnome-shell-polish',
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['top-bar', 'overview-dash', 'firefox-chrome', 'nautilus-focus'],
    smoke: 'smoke-rocky-shell-polish.mjs',
  }, null, 2)}\n`);
  console.log(`✓ smoke-rocky-shell-polish OK — ${opts.id}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
