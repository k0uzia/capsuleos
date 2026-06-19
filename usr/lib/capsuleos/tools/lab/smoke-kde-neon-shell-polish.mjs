#!/usr/bin/env node
/**
 * Smoke polish shell KDE Neon — panel, kickoff, horloge, tray.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
 *   CAPSULE_KDE_NEON_URL=http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];
const httpBase = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500').replace(/\/$/, '');
const URL = process.env.CAPSULE_KDE_NEON_URL || `${httpBase}/home/Debian/KDE-Neon/index.html`;

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const indexHtml = read('home/Debian/KDE-Neon/index.html');
const breezeCss = read('home/Debian/KDE-Neon/style/debian-breeze.css');
const footerCss = read('home/Debian/KDE-Neon/style/footer.css');
const discoverJs = read('usr/lib/capsuleos/shells/linux/discover-kde.js');
const trayJs = read('usr/lib/capsuleos/shells/linux/tray-popover-kde.js');
const dolphinJs = read('usr/lib/capsuleos/shells/linux/fileExplorer/dolphin-kde-chrome.js');

if (!indexHtml.includes('id="kde-neon"')) {
  errors.push('index.html : body#kde-neon absent');
}
if (!indexHtml.includes('data-link="nemo"') || !indexHtml.includes('data-link="firefox"')) {
  errors.push('index.html : pins panel incomplets');
}
if (!indexHtml.includes('taskbar-clock-trigger')) {
  errors.push('index.html : horloge panel absente');
}
if (!breezeCss.includes('--kde-neon-window-titlebar-bg')) {
  errors.push('debian-breeze.css : tokens titlebar absents');
}
if (footerCss.includes('--opensuse-')) {
  errors.push('footer.css : tokens --opensuse-* résiduels');
}
if (!indexHtml.includes('discover-kde.js')) {
  errors.push('index.html : discover-kde.js (usr/lib) absent');
}
if (!indexHtml.includes('dolphin-kde-chrome.js')) {
  errors.push('index.html : dolphin-kde-chrome.js (usr/lib) absent');
}
if (discoverJs.includes('../../../usr/share/') && !discoverJs.includes('resolveAssetUrl')) {
  errors.push('discover-kde.js : chemins usr/share en dur');
}
if (trayJs.includes('../../../usr/share/')) {
  errors.push('tray-popover-kde.js : chemins usr/share en dur');
}
if (!dolphinJs.includes('./assets/') || !dolphinJs.includes('resolveCapsuleResourceUrl')) {
  errors.push('dolphin-kde-chrome.js : convention assets incomplète');
}

const playwrightCache = path.join(process.env.HOME || '', '.cache/ms-playwright');
const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  ...(fs.existsSync(playwrightCache)
    ? fs.readdirSync(playwrightCache)
      .filter((d) => d.startsWith('chromium-'))
      .map((d) => path.join(playwrightCache, d, 'chrome-linux64/chrome'))
    : []),
].find((p) => p && fs.existsSync(p));

let runtime = null;
if (chromePath) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

    runtime = await page.evaluate(() => {
      const pins = document.querySelectorAll('footer nav a[target="windowElement"][data-link]');
      const clock = document.getElementById('taskbar-clock');
      const trayBtns = document.querySelectorAll('.taskbar-tray__btn');
      return {
        bodyId: document.body && document.body.id,
        pinCount: pins.length,
        clockText: clock ? clock.textContent.trim() : '',
        trayControls: trayBtns.length,
      };
    });

    await page.click('.taskbar-pins__launcher, footer nav a[data-link="mainMenu"]');
    await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 8000 });
    await page.waitForFunction(
      () => document.querySelectorAll('#mainMenu .menu-cat').length >= 1,
      null,
      { timeout: 15000 },
    ).catch(() => {});
    const catBtn = await page.$('#mainMenu .menu-cat:not([data-cat-id="favorites"])');
    if (catBtn) {
      await catBtn.click();
      await page.waitForTimeout(500);
    }

    const kickoff = await page.evaluate(() => {
      const menu = document.getElementById('mainMenu');
      const apps = document.querySelectorAll('#mainMenu .menu-app-item');
      const rect = menu ? menu.getBoundingClientRect() : null;
      const styles = menu ? getComputedStyle(menu) : null;
      return {
        visible: menu && menu.style.display !== 'none',
        appCount: apps.length,
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
        cssWidth: styles ? styles.width : '',
        cssHeight: styles ? styles.height : '',
      };
    });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await page.click('#tray-btn-clipboard');
    await page.waitForSelector('#kde-tray-popover-clipboard:not([hidden])', { timeout: 5000 });
    const clipboard = await page.evaluate(() => ({
      items: document.querySelectorAll('#kde-tray-clipboard-history .kde-tray-popover__history-item').length,
    }));

    await page.click('#tray-btn-network');
    await page.waitForSelector('#kde-tray-popover-network:not([hidden])', { timeout: 5000 });
    const networkBefore = await page.evaluate(() => document.getElementById('tray-btn-network')?.title || '');
    await page.click('#kde-tray-network-toggle');
    const networkAfter = await page.evaluate(() => document.getElementById('tray-btn-network')?.title || '');

    await page.evaluate(() => window.openWindowByDataLink('update_manager'));
    await page.waitForFunction(
      () => document.querySelector('[data-discover-nav="updates"]'),
      null,
      { timeout: 15000 },
    );
    await page.click('[data-discover-nav="updates"]');
    await page.waitForFunction(
      () => document.querySelector('[data-discover-updates-mount] .kde-updates__row'),
      null,
      { timeout: 15000 },
    );
    const updatesBefore = await page.evaluate(() => document.querySelector('[data-update-manager-tray]')?.dataset.hasUpdates);
    await page.click('[data-um-kde-action="updateAll"]');
    await page.waitForFunction(
      () => document.querySelector('[data-update-manager-tray]')?.dataset.hasUpdates === 'false',
      null,
      { timeout: 8000 },
    );
    const updatesAfter = await page.evaluate(() => document.querySelector('[data-update-manager-tray]')?.dataset.hasUpdates);

    await browser.close();

    if (runtime.bodyId !== 'kde-neon') {
      errors.push(`runtime : body id=${runtime.bodyId}`);
    }
    if (runtime.pinCount < 4) {
      errors.push(`runtime : pins panel=${runtime.pinCount} (attendu ≥4)`);
    }
    if (!runtime.clockText || runtime.clockText.length < 4) {
      errors.push('runtime : horloge panel vide');
    }
    if (runtime.trayControls < 6) {
      errors.push(`runtime : boutons tray=${runtime.trayControls} (attendu ≥6)`);
    }
    if (!kickoff.visible) {
      errors.push('runtime : kickoff non visible après clic launcher');
    }
    if (kickoff.appCount < 6) {
      errors.push(`runtime : apps kickoff=${kickoff.appCount} (attendu ≥6)`);
    }
    if (kickoff.width < 640 || kickoff.width > 720) {
      errors.push(`runtime : kickoff width=${kickoff.width}px (cible VM ~677)`);
    }
    if (kickoff.height < 480 || kickoff.height > 540) {
      errors.push(`runtime : kickoff height=${kickoff.height}px (cible VM ~513)`);
    }
    if (clipboard.items < 3) {
      errors.push(`tray klipper : entrées=${clipboard.items} (attendu ≥3)`);
    }
    if (networkBefore === networkAfter) {
      errors.push('tray réseau : toggle sans changement titre');
    }
    if (updatesBefore !== 'true' || updatesAfter !== 'false') {
      errors.push(`tray MAJ : badge ${updatesBefore} → ${updatesAfter} (attendu true → false)`);
    }
  } catch (err) {
    errors.push(`playwright : ${err.message || err}`);
  }
} else {
  errors.push('playwright : Chrome introuvable (PLAYWRIGHT_CHROME)');
}

const ok = errors.length === 0;
const registryId = (() => {
  const idx = process.argv.indexOf('--id');
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : 'linux-kde-neon';
})();

if (ok) {
  const invBase = path.join(ROOT, 'root/docs/inventaires', registryId);
  fs.writeFileSync(`${invBase}-shell-polish.json`, `${JSON.stringify({
    registryId,
    domain: 'kde-shell-polish',
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['panel-pins', 'kickoff', 'taskbar-clock', 'dolphin-chrome', 'discover-chrome'],
    smoke: 'smoke-kde-neon-shell-polish.mjs',
  }, null, 2)}\n`);
  fs.writeFileSync(`${invBase}-shell-polish-phase2.json`, `${JSON.stringify({
    registryId,
    domain: 'kde-shell-polish',
    phase: 2,
    status: 'done',
    polishedAt: new Date().toISOString(),
    targets: ['tray-clipboard', 'tray-network', 'tray-updates'],
    smoke: 'smoke-kde-neon-shell-polish.mjs',
  }, null, 2)}\n`);
  console.log(`✓ smoke-kde-neon-shell-polish OK — ${registryId}`);
}

console.log(JSON.stringify({ ok, errors, runtime }, null, 2));
process.exit(ok ? 0 : 1);
