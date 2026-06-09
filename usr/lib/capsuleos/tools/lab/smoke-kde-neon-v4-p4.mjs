#!/usr/bin/env node
/**
 * Smoke V4-P4 — KDEConnect stub + Π ≥ 95 + inventaires interactions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const KDECONNECT_DESKTOPS = [
  'org.kde.kdeconnect.nonplasma.desktop',
  'org.kde.kdeconnect.app.desktop',
  'org.kde.kdeconnect.sms.desktop',
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const indexHtml = read('home/Debian/KDE-Neon/index.html');
const menuSrc = read('home/Debian/KDE-Neon/content/mainMenu-data.js');
const profile = JSON.parse(read('etc/capsuleos/profiles/linux-kde-neon.json'));
const parity = JSON.parse(read('root/docs/inventaires/linux-kde-neon-parity-index.json'));

if (!indexHtml.includes('data-link="kdeconnect"')) {
  errors.push('index.html : slot kdeconnect absent');
}
if (!exists('usr/share/capsuleos/linux/apps/kdeconnect_kde_neon.html')) {
  errors.push('template kdeconnect_kde_neon.html absent');
}
if (!profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES?.kdeconnect) {
  errors.push('profil : override kdeconnect manquant');
}

// eslint-disable-next-line no-new-func
const MENU_APPS = Function(`return ${menuSrc.match(/const MENU_APPS = (\[[\s\S]*?\]);/)[1]};`)();
KDECONNECT_DESKTOPS.forEach((desktop) => {
  const app = MENU_APPS.find((a) => a.desktop === desktop);
  if (!app) {
    errors.push(`kickoff : ${desktop} absent`);
  } else if (app.dataLink !== 'kdeconnect') {
    errors.push(`${desktop} : dataLink=${app.dataLink} (attendu kdeconnect)`);
  }
});

const interactionSlots = ['panel', 'mainMenu', 'tray', 'nemo', 'firefox', 'terminal', 'update_manager'];
interactionSlots.forEach((slot) => {
  const p = `root/docs/inventaires/interactions/linux-kde-neon/${slot}.json`;
  if (!exists(p)) {
    errors.push(`interactions/${slot}.json absent`);
  }
});

if ((parity.pi_global ?? 0) < 95) {
  errors.push(`Π_global=${parity.pi_global} < 95`);
}
if (parity.status_global !== 'ok') {
  errors.push(`status_global=${parity.status_global}`);
}

const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
let runtime = { skipped: true };

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (chromePath && !process.env.SKIP_PLAYWRIGHT) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });
    const result = await page.evaluate(async () => {
      window.openWindowByDataLink('kdeconnect');
      await new Promise((r) => { window.setTimeout(r, 500); });
      const root = document.getElementById('kdeconnectApp');
      const container = document.querySelector('div.windowElement[data-link="kdeconnect"]');
      return { ok: !!(container && root), hasRoot: !!root };
    });
    runtime = { skipped: false, kdeconnect: result };
    if (!result.ok) {
      errors.push('runtime kdeconnect : fenêtre ou root absent');
    }
    await browser.close();
  } catch (err) {
    if (!err.message?.includes('ERR_CONNECTION_REFUSED')) {
      errors.push(`playwright : ${err.message || err}`);
    }
  }
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  phase: 'V4-P4',
  errors,
  pi_global: parity.pi_global,
  runtime,
}, null, 2));
process.exit(errors.length ? 1 : 0);
