#!/usr/bin/env node
/**
 * Smoke polish shell COSMIC phase 2 — calendrier + menu alimentation.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-cosmic-shell-polish-phase2.mjs --id linux-popos
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-cosmic-shell-polish-phase2.mjs --id linux-popos --playwright
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

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const runStaticChecks = (registryId) => {
  const errors = [];
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'etc/capsuleos/profiles', `${registryId}.json`), 'utf8'));
  const skin = (profile.paths?.skin || '').replace(/\/index\.html$/i, '');
  const indexHtml = read(`${skin}/index.html`);
  const calendarCss = read(`${skin}/style/cosmic-shell/calendar-popover.css`);
  const powerCss = read(`${skin}/style/cosmic-shell/power-menu.css`);
  const calendarJs = read('usr/lib/capsuleos/shells/linux/calendar-popover.js');
  const powerJs = read(`${skin}/js/cosmic-power-menu.js`);

  if (!indexHtml.includes('id="taskbar-calendar-popover"')) {
    errors.push('index.html : popover calendrier absent');
  }
  if (!indexHtml.includes('id="cosmic-power-menu"')) {
    errors.push('index.html : menu alimentation absent');
  }
  if (!calendarCss.includes('body#popos .calendar-popover')) {
    errors.push('calendar-popover.css : ancrage Pop!_OS absent');
  }
  if (!calendarCss.includes('.calendar-popover__day--today')) {
    errors.push('calendar-popover.css : jour courant absent');
  }
  if (!calendarCss.includes('.cosmic-calendar-popover__head')) {
    errors.push('calendar-popover.css : en-tête COSMIC absent');
  }
  if (!powerCss.includes('.cosmic-power-menu__row')) {
    errors.push('power-menu.css : lignes menu alimentation absentes');
  }
  if (!calendarJs.includes('taskbar-clock-trigger')) {
    errors.push('calendar-popover.js : binding horloge absent');
  }
  if (!powerJs.includes('cosmic-tray-power-btn')) {
    errors.push('cosmic-power-menu.js : binding bouton alimentation absent');
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

async function runPlaywright(registryId, errors) {
  const chromePath = findChrome();
  if (!chromePath) {
    errors.push('Playwright : Chrome/Chromium introuvable');
    return;
  }
  const url = resolveCapsuleOsUrl(registryId);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  await page.click('#taskbar-clock-trigger');
  await page.waitForTimeout(350);
  const cal = await page.evaluate(() => {
    const pop = document.getElementById('taskbar-calendar-popover');
    const days = document.querySelectorAll('#cal-days-grid .calendar-popover__day:not(.calendar-popover__day--empty)');
    return {
      visible: pop && !pop.hidden,
      dayCount: days.length,
      today: !!document.querySelector('#cal-days-grid .calendar-popover__day--today'),
    };
  });
  if (!cal.visible) errors.push('Playwright : calendrier non visible');
  if (cal.dayCount < 28) errors.push(`Playwright : grille calendrier incomplète (${cal.dayCount})`);
  if (!cal.today) errors.push('Playwright : jour courant non marqué');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.click('#cosmic-tray-power-btn');
  await page.waitForTimeout(300);
  const power = await page.evaluate(() => {
    const menu = document.getElementById('cosmic-power-menu');
    const rows = document.querySelectorAll('.cosmic-power-menu__row');
    return {
      visible: menu && !menu.hidden,
      rowCount: rows.length,
    };
  });
  if (!power.visible) errors.push('Playwright : menu alimentation non visible');
  if (power.rowCount < 2) errors.push('Playwright : menu alimentation incomplet');

  await browser.close();
}

const main = async () => {
  const opts = parseArgs();
  const errors = runStaticChecks(opts.id);

  if (opts.playwright) {
    await runPlaywright(opts.id, errors);
  }

  if (errors.length) {
    console.error(`smoke-cosmic-shell-polish-phase2 — échec (${opts.id})\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const outPath = path.join(ROOT, `root/docs/inventaires/${opts.id}-shell-polish-phase2.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: opts.id,
    domain: 'cosmic-shell-polish',
    phase: 2,
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['calendar-popover', 'power-menu'],
    smoke: 'smoke-cosmic-shell-polish-phase2.mjs',
  }, null, 2)}\n`);
  console.log(`✓ smoke-cosmic-shell-polish-phase2 OK — ${opts.id}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
