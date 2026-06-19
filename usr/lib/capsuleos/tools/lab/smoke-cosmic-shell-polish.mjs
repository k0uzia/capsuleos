#!/usr/bin/env node
/**
 * Smoke polish shell COSMIC Pop!_OS — top bar, dock, launcher, applications, Firefox, Fichiers.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-cosmic-shell-polish.mjs --id linux-popos
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-cosmic-shell-polish.mjs --id linux-popos --playwright
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-popos', playwright: false };
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
  const skinRel = (profile.paths?.skin || '').replace(/\/index\.html$/i, '');
  if (!skinRel) throw new Error(`${registryId}: paths.skin manquant`);
  return { registryId, skinRel, bodyId: profile.bodyId || 'popos' };
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const runStaticChecks = (ctx) => {
  const errors = [];
  const skin = ctx.skinRel;
  const indexHtml = read(`${skin}/index.html`);
  const tokensCss = read(`${skin}/style/cosmic-shell/popos-tokens.css`);
  const topBarCss = read(`${skin}/style/cosmic-shell/top-bar.css`);
  const dockCss = read(`${skin}/style/cosmic-shell/dock.css`);
  const trayCss = read(`${skin}/style/cosmic-shell/tray.css`);
  const firefoxCss = read(`${skin}/style/apps/firefox.skin.css`);
  const nautilusCss = read(`${skin}/style/apps/nautilus.skin.css`);
  const dockJs = read(`${skin}/js/cosmic-dock.js`);
  const launcherJs = read(`${skin}/js/cosmic-launcher.js`);
  const appsJs = read(`${skin}/js/cosmic-applications.js`);
  const shellStateJs = read(`${skin}/js/cosmic-shell-state.js`);
  const dateJs = read('usr/lib/capsuleos/shells/linux/date.js');

  if (!indexHtml.includes(`id="${ctx.bodyId}"`)) {
    errors.push(`index.html : body#${ctx.bodyId} absent`);
  }
  if (!indexHtml.includes('class="cosmic-top-bar"')) {
    errors.push('index.html : cosmic-top-bar absent');
  }
  if (!indexHtml.includes('class="cosmic-dock"')) {
    errors.push('index.html : cosmic-dock absent');
  }
  if (!indexHtml.includes('id="cosmic-launcher"')) {
    errors.push('index.html : cosmic-launcher absent');
  }
  if (!indexHtml.includes('id="cosmic-applications"')) {
    errors.push('index.html : cosmic-applications absent');
  }
  if (!indexHtml.includes('data-link="nemo"') || !indexHtml.includes('data-link="firefox"')) {
    errors.push('index.html : slots dock P0 (nemo, firefox) absents');
  }
  if (!indexHtml.includes('id="popos-clock-date"') || !indexHtml.includes('id="taskbar-clock"')) {
    errors.push('index.html : horloge top bar absente');
  }
  if (!tokensCss.includes('--popos-dock-scale')) {
    errors.push('popos-tokens.css : tokens dock absents');
  }
  if (!topBarCss.includes('.cosmic-top-bar__center')) {
    errors.push('top-bar.css : zone horloge centrée absente');
  }
  if (!dockCss.includes('.cosmic-dock__item--active')) {
    errors.push('dock.css : état actif dock absent');
  }
  if (!trayCss.includes('.popos-clock-date')) {
    errors.push('tray.css : date top bar absente');
  }
  if (!dockJs.includes('cosmic-dock__item--active')) {
    errors.push('cosmic-dock.js : sync état actif absent');
  }
  if (!launcherJs.includes('cosmic-launcher')) {
    errors.push('cosmic-launcher.js : launcher absent');
  }
  if (!appsJs.includes('cosmic-applications')) {
    errors.push('cosmic-applications.js : grille applications absente');
  }
  if (!shellStateJs.includes('CosmicShellState')) {
    errors.push('cosmic-shell-state.js : mutual exclusion overlays absente');
  }
  if (!dateJs.includes('popos-clock-date')) {
    errors.push('date.js : binding popos-clock-date absent');
  }
  if (!firefoxCss.includes('border-radius: calc(var(--head) / 8) calc(var(--head) / 8) 0 0')) {
    errors.push('firefox.skin.css : onglets arrondis absents');
  }
  if (!nautilusCss.includes('windowElementActive') || !nautilusCss.includes('data-link="nemo"')) {
    errors.push('nautilus.skin.css : focus fenêtre Fichiers absent');
  }
  return errors;
};

const findChrome = () => {
  const playwrightCache = path.join(process.env.HOME || '', '.cache/ms-playwright');
  return [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    ...(fs.existsSync(playwrightCache)
      ? fs.readdirSync(playwrightCache)
        .filter((d) => d.startsWith('chromium-'))
        .map((d) => path.join(playwrightCache, d, 'chrome-linux64/chrome'))
      : []),
  ].find((p) => p && fs.existsSync(p));
};

async function runPlaywright(ctx, errors) {
  const chromePath = findChrome();
  if (!chromePath) {
    errors.push('Playwright : Chrome/Chromium introuvable');
    return;
  }
  const url = resolveCapsuleOsUrl(ctx.registryId);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  await page.evaluate(() => window.openWindowByDataLink('firefox'));
  await page.waitForTimeout(500);

  const dock = await page.evaluate(() => {
    const item = document.querySelector('.cosmic-dock__item[data-link="firefox"]');
    return {
      active: item ? item.classList.contains('cosmic-dock__item--active') : false,
    };
  });
  if (!dock.active) errors.push('Playwright : dock Firefox non actif');

  const clock = await page.evaluate(() => {
    const trigger = document.querySelector('.taskbar-clock-trigger');
    const dateEl = document.getElementById('popos-clock-date');
    const timeEl = document.getElementById('taskbar-clock');
    const bar = document.querySelector('.cosmic-top-bar');
    const center = document.querySelector('.cosmic-top-bar__center');
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const centerRect = center ? center.getBoundingClientRect() : null;
    const offsetPx = barRect && centerRect
      ? Math.abs((centerRect.left + centerRect.width / 2) - (barRect.left + barRect.width / 2))
      : 999;
    const triggerStyle = trigger ? getComputedStyle(trigger) : null;
    return {
      date: dateEl ? dateEl.textContent.trim() : '',
      time: timeEl ? timeEl.textContent.trim() : '',
      row: triggerStyle ? triggerStyle.flexDirection === 'row' : false,
      centerOffsetPx: offsetPx,
    };
  });
  if (!clock.date || clock.date.length < 4) errors.push('Playwright : date top bar vide');
  if (!clock.time || !/^\d{1,2}:\d{2}/.test(clock.time)) errors.push('Playwright : horloge invalide');
  if (!clock.row) errors.push('Playwright : horloge doit être sur une ligne');
  if (clock.centerOffsetPx > 6) errors.push(`Playwright : horloge décentrée (${clock.centerOffsetPx.toFixed(1)}px)`);

  await page.click('#cosmic-btn-applications');
  await page.waitForSelector('#cosmic-applications:not([hidden])', { timeout: 5000 });
  const apps = await page.evaluate(() => {
    const panel = document.getElementById('cosmic-applications');
    const grid = document.querySelectorAll('#cosmic-applications-grid .cosmic-applications__app');
    return {
      visible: panel && !panel.hidden,
      appCount: grid.length,
    };
  });
  if (!apps.visible) errors.push('Playwright : panneau Applications non visible');
  if (apps.appCount < 6) errors.push(`Playwright : grille Applications incomplète (${apps.appCount})`);

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
    console.error(`smoke-cosmic-shell-polish — échec (${opts.id})\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const outPath = path.join(ROOT, `root/docs/inventaires/${opts.id}-shell-polish.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: opts.id,
    domain: 'cosmic-shell-polish',
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['top-bar', 'dock', 'launcher', 'applications', 'firefox-chrome', 'nautilus-focus'],
    smoke: 'smoke-cosmic-shell-polish.mjs',
  }, null, 2)}\n`);
  console.log(`✓ smoke-cosmic-shell-polish OK — ${opts.id}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
