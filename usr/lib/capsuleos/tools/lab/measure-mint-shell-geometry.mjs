#!/usr/bin/env node
/**
 * Mesure géométrie panel + menu Mint (clone CapsuleOS) — référence VM 1280×800.
 * Sortie JSON : métriques px, deltas vs vmTargets, captures optionnelles, diff visuel.
 *
 * Usage :
 *   node measure-mint-shell-geometry.mjs
 *   node measure-mint-shell-geometry.mjs --capture --out root/docs/inventaires/captures/linux-mint/clone-baseline
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/home/Debian/Mint/index.html node measure-mint-shell-geometry.mjs --compare
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const VM_TARGETS = {
  panelHeightPx: 40,
  menuWidthPx: 600,
  menuHeightPx: 480,
  menuBottomGapPx: 2,
  menuColsPct: [20, 25, 55],
  searchHeightPx: 35,
  searchWidthPx: 134,
  trayIconPx: 24,
  favoritesIconPx: 22,
  favoritesBoxWidthPx: 121,
  favoritesGapPx: 2.86,
  menuBtnPx: 40,
  menuBtnImgPx: 33,
  separatorWidthPx: 1,
  separatorHeightPx: 25,
};

const DEFAULT_URL = 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const VIEWPORT = { width: 1280, height: 800 };
const TOLERANCE_PX = 1;

const args = process.argv.slice(2);
const doCapture = args.includes('--capture');
const doCompare = args.includes('--compare');
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 && args[outIdx + 1]
  ? path.resolve(ROOT, args[outIdx + 1])
  : path.join(ROOT, 'root/docs/inventaires/captures/linux-mint/clone-baseline');

const URL = process.env.CAPSULE_MINT_URL || DEFAULT_URL;

const chromePath = process.env.PLAYWRIGHT_CHROME
  || [
    '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
  ].find((p) => fs.existsSync(p));

async function measurePage(page) {
  return page.evaluate(() => {
  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const tableau = document.getElementById('tableau');
  const footer = tableau;
  const menuBtn = document.querySelector('footer#tableau nav a[data-link="mainMenu"]');
  const sep = document.querySelector('.mint-panel__separator');
  const trayIcon = document.querySelector('#tableau .taskbar-tray__icon');
  const favBox = document.getElementById('mint-tray-favorites');
  const favBtns = [...document.querySelectorAll('.taskbar-favorites__btn')];
  const clockTrig = document.querySelector('.taskbar-clock-trigger');
  const clock = document.getElementById('taskbar-clock');
  const fr = rect(footer);
  const mbr = rect(menuBtn);
  const menuImg = menuBtn ? menuBtn.querySelector('img') : null;
  const f1 = rect(favBtns[0]);
  const f2 = rect(favBtns[1]);
  let favGap = null;
  if (f1 && f2) favGap = Math.round((f2.left - f1.right) * 100) / 100;

  const panel = {
    panelHeightPx: fr ? Math.round(fr.height) : null,
    menuBtnPx: mbr ? Math.round(mbr.width) : null,
    menuBtnImgPx: menuImg && rect(menuImg) ? Math.round(rect(menuImg).width) : null,
    separatorWidthPx: sep && rect(sep) ? Math.round(rect(sep).width) : null,
    separatorHeightPx: sep && rect(sep) ? Math.round(rect(sep).height) : null,
    trayIconPx: trayIcon && rect(trayIcon) ? Math.round(rect(trayIcon).width) : null,
    favoritesIconPx: f1 ? Math.round(f1.width) : null,
    favoritesBoxWidthPx: favBox && rect(favBox) ? Math.round(rect(favBox).width) : null,
    favoritesGapPx: favGap,
    clockHeightPx: clockTrig && rect(clockTrig) ? Math.round(rect(clockTrig).height) : null,
    clockFontPx: clock && cs(clock) ? parseFloat(cs(clock).fontSize) : null,
    taskbarHeightVar: cs(document.body).getPropertyValue('--taskbar-height').trim(),
    panelHeightVar: cs(document.body).getPropertyValue('--mint-panel-height').trim(),
  };

  const m = document.getElementById('mainMenu');
  const root = m ? m.querySelector('.menu-root') : null;
  const sidebar = m ? m.querySelector('.menu-sidebar') : null;
  const cats = m ? m.querySelector('.menu-categories') : null;
  const apps = m ? m.querySelector('.menu-apps') : null;
  const search = m ? m.querySelector('.menu-search') : null;
  const mr = rect(m);
  const ftr = rect(footer);
  const rw = root ? root.getBoundingClientRect().width : 0;
  const cols = [sidebar, cats, apps].map((el) => (el ? Math.round(rect(el).width) : 0));
  const pcts = cols.map((w) => (rw ? Math.round((w / rw) * 1000) / 10 : 0));
  const shortcuts = [...(m ? m.querySelectorAll('.menu-shortcut span') : [])].map((s) => ({
    text: s.textContent.trim(),
    clientW: s.clientWidth,
    scrollW: s.scrollWidth,
    trunc: s.scrollWidth > s.clientWidth + 1,
  }));

  const menu = {
    menuWidthPx: mr ? Math.round(mr.width) : null,
    menuHeightPx: mr ? Math.round(mr.height) : null,
    menuBottomGapPx: mr && ftr ? Math.round(ftr.top - mr.bottom) : null,
    menuColsPct: pcts,
    menuColsPx: cols,
    searchHeightPx: search && rect(search) ? Math.round(rect(search).height) : null,
    searchWidthPx: search && rect(search) ? Math.round(rect(search).width) : null,
    catRowHeightPx: m && m.querySelector('.menu-cat') && rect(m.querySelector('.menu-cat'))
      ? Math.round(rect(m.querySelector('.menu-cat')).height) : null,
    appIconPx: m && m.querySelector('.menu-app-item__icon') && rect(m.querySelector('.menu-app-item__icon'))
      ? Math.round(rect(m.querySelector('.menu-app-item__icon')).width) : null,
    display: m && cs(m) ? cs(m).display : null,
    shortcuts,
  };

  return { panel, menu, viewport: { w: window.innerWidth, h: window.innerHeight }, url: location.href };
  });
}

function deltaMetric(measured, target) {
  if (measured == null || target == null) return null;
  if (Array.isArray(target) && Array.isArray(measured)) {
    return Math.max(...target.map((t, i) => Math.abs((measured[i] || 0) - t)));
  }
  return Math.abs(Number(measured) - Number(target));
}

function buildReport(measured) {
  const deltas = {};
  const flat = { ...measured.panel, ...measured.menu };
  for (const [key, target] of Object.entries(VM_TARGETS)) {
    const val = flat[key];
    if (val !== undefined) {
      const d = deltaMetric(val, target);
      if (d != null) deltas[key] = d;
    }
  }
  const maxDeltaPx = Math.max(0, ...Object.values(deltas).filter((v) => typeof v === 'number'));
  return { vmTargets: VM_TARGETS, measured, deltas, maxDeltaPx, tolerancePx: TOLERANCE_PX, pass: maxDeltaPx <= TOLERANCE_PX };
}

async function runCompare(captureDir) {
  const baselineDir = path.join(ROOT, 'root/docs/inventaires/captures/linux-mint/baseline');
  const pairs = [
    ['01-desktop-panel.png', '01-desktop-panel.png'],
    ['02-menu.png', '02-menu.png'],
  ];
  const diffs = [];
  for (const [a, b] of pairs) {
    const left = path.join(baselineDir, a);
    const right = path.join(captureDir, b);
    if (!fs.existsSync(left) || !fs.existsSync(right)) continue;
    try {
      const out = execSync(
        `compare -metric AE "${left}" "${right}" null: 2>&1`,
        { encoding: 'utf8' },
      ).trim();
      const ae = parseInt(out, 10);
      diffs.push({ file: a, absoluteError: Number.isFinite(ae) ? ae : out, thresholdNote: 'AE documenté — géométrie ≤1px prime' });
    } catch (err) {
      const msg = (err.stdout || err.message || '').toString().trim();
      const ae = parseInt(msg, 10);
      diffs.push({ file: a, absoluteError: Number.isFinite(ae) ? ae : msg });
    }
  }
  return diffs;
}

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  if (doCapture) {
    fs.mkdirSync(outDir, { recursive: true });
    const panelClip = await page.evaluate(() => {
      const f = document.getElementById('tableau');
      const r = f.getBoundingClientRect();
      return { x: 0, y: Math.max(0, r.top - 2), width: 1280, height: Math.min(42, r.height + 4) };
    });
    await page.screenshot({ path: path.join(outDir, '01-desktop-panel.png'), clip: panelClip });
  }

  await page.click('footer#tableau nav a[data-link="mainMenu"]');
  await page.waitForSelector('#mainMenu .menu-root', { timeout: 10000 });
  await page.waitForTimeout(300);

  const full = await measurePage(page);
  const report = buildReport(full);
  report.capturedAt = new Date().toISOString();
  report.viewport = VIEWPORT;

  if (doCapture) {
    const menuClip = await page.evaluate(() => {
      const m = document.getElementById('mainMenu');
      const r = m.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    await page.screenshot({ path: path.join(outDir, '02-menu.png'), clip: menuClip });
    fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
  }

  if (doCompare && doCapture) {
    report.visualDiff = await runCompare(outDir);
  }

  const outJson = process.env.CAPSULE_GEOMETRY_OUT
    || path.join(ROOT, 'root/docs/inventaires/captures/linux-mint/clone-baseline/metrics.json');
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  await browser.close();

  const status = report.pass ? 'OK' : 'WARN';
  process.stdout.write(`${status} maxDelta=${report.maxDeltaPx}px tolerance=${TOLERANCE_PX}px → ${outJson}\n`);
  if (!report.pass) {
    process.stdout.write(JSON.stringify(report.deltas, null, 2) + '\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
