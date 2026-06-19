#!/usr/bin/env node
/**
 * Smoke chrome terminal Ptyxis — 4 états (onglet seul, multi-onglets, min-width, double fenêtre).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-ptyxis-chrome.mjs
 *   CAPSULE_HTTP_BASE=... node ... --profile linux-rocky
 */
import fs from 'fs';
import { chromium } from 'playwright';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const parseArgs = () => {
  const args = process.argv.slice(2);
  let profile = process.env.CAPSULE_PTYXIS_PROFILE || 'linux-rocky';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--profile=')) {
      profile = args[i].split('=')[1] || profile;
    }
    if (args[i] === '--profile' && args[i + 1]) {
      profile = args[++i];
    }
    if (args[i] === '--id' && args[i + 1]) {
      profile = args[++i];
    }
  }
  return profile;
};

const PROFILE = parseArgs();

const PROFILE_URL = {
  'linux-rocky': `${BASE}/home/RedHat/Rocky/index.html`,
  'linux-fedora': `${BASE}/home/RedHat/Fedora/index.html`,
  'linux-alma': `${BASE}/home/RedHat/Alma/index.html`,
  'linux-ubuntu': `${BASE}/home/Debian/Ubuntu/index.html`,
};

const PROFILE_CHROME_RGB = {
  'linux-rocky': { promptUser: { r: 51, g: 209, b: 122 }, pathSeg: { r: 241, g: 241, b: 243 } },
  'linux-fedora': { promptUser: { r: 51, g: 209, b: 122 }, pathSeg: { r: 241, g: 241, b: 243 } },
  'linux-alma': { promptUser: { r: 51, g: 209, b: 122 }, pathSeg: { r: 241, g: 241, b: 243 } },
  'linux-ubuntu': { promptUser: { r: 25, g: 195, b: 125 }, pathSeg: { r: 108, g: 182, b: 255 } },
};

const URL = PROFILE_URL[PROFILE];
const CHROME_RGB = PROFILE_CHROME_RGB[PROFILE];
if (!URL || !CHROME_RGB) {
  console.error(`✗ smoke-terminal-ptyxis-chrome — profil inconnu « ${PROFILE} »`);
  process.exit(1);
}

const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const PROMPT_USER_RGB = CHROME_RGB.promptUser;
const PATH_TEXT_RGB = CHROME_RGB.pathSeg;

const near = (a, b, tol = 18) => Math.abs(a - b) <= tol;

const matchRgb = (parsed, expected) => parsed
  && near(parsed.r, expected.r)
  && near(parsed.g, expected.g)
  && near(parsed.b, expected.b);

const errors = [];

const measureWindow = () => {
  const win = document.querySelector('.windowElement.windowElementActive[data-link="terminal"]')
    || document.querySelector('.windowElement[data-link="terminal"]');
  if (!win) {
    return { error: 'no-window' };
  }
  const header = win.querySelector('#windowHeader');
  const close = header?.querySelector('#closeBtn');
  const promptUser = win.querySelector('.capsule-terminal__prompt-user');
  const pathSeg = win.querySelector('.capsule-terminal__prompt-path-seg');
  const shell = win.querySelector('#terminalContainer, .capsule-terminal-shell');
  const app = win.querySelector('.capsule-terminal, [data-terminal-app]');
  const winRect = win.getBoundingClientRect();
  const headerRect = header?.getBoundingClientRect();
  const closeRect = close?.getBoundingClientRect();
  const tabs = win.querySelectorAll('.fedora-terminal-tabs__tab');
  const cs = getComputedStyle(win);
  const shellCs = shell ? getComputedStyle(shell) : null;
  const appCs = app ? getComputedStyle(app) : null;
  const userCs = promptUser ? getComputedStyle(promptUser) : null;
  const pathCs = pathSeg ? getComputedStyle(pathSeg) : null;

  const parseRgb = (color) => {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
  };

  const closeOk = closeRect && closeRect.width > 4 && closeRect.height > 4
    && closeRect.right <= winRect.right + 1
    && closeRect.left >= winRect.left - 1;

  return {
    active: win.classList.contains('windowElementActive'),
    multitab: win.classList.contains('terminal-window--multitab'),
    tabCount: tabs.length,
    headerH: headerRect ? Math.round(headerRect.height) : 0,
    winW: Math.round(winRect.width),
    overflow: cs.overflow,
    shellPadding: shellCs?.padding,
    appPadding: appCs?.padding,
    promptUser: parseRgb(userCs?.color || ''),
    pathSeg: parseRgb(pathCs?.color || ''),
    closeOk,
    hasTabsSlot: !!header?.querySelector('.fedora-terminal-header__tabs'),
    hasWindowControls: !!header?.querySelector('.fedora-terminal-header__window-controls'),
  };
};

const browser = await chromium.launch({
  headless: true,
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  await page.evaluate(() => window.openWindowByDataLink('terminal'));
  await page.waitForTimeout(1200);

  const s1 = await page.evaluate(measureWindow);
  if (s1.error) errors.push(`single-tab: ${s1.error}`);
  else {
    if (s1.tabCount !== 1) errors.push(`single-tab: ${s1.tabCount} onglet(s) attendu 1`);
    if (!s1.hasTabsSlot) errors.push('single-tab: slot onglets header absent');
    if (!s1.hasWindowControls) errors.push('single-tab: contrôles fenêtre non regroupés');
    if (!matchRgb(s1.promptUser, PROMPT_USER_RGB)) errors.push('single-tab: couleur user@host incorrecte');
    if (!matchRgb(s1.pathSeg, PATH_TEXT_RGB)) errors.push('single-tab: couleur chemin incorrecte (porosité bleue ?)');
    if (s1.shellPadding !== '0px') errors.push(`single-tab: padding shell ${s1.shellPadding} attendu 0px`);
    if (!s1.closeOk) errors.push('single-tab: bouton fermer coupé');
  }

  await page.evaluate(() => window.openTerminalTab?.());
  await page.waitForTimeout(500);
  const s2flex = await page.evaluate(() => {
    const win = document.querySelector('.windowElement.windowElementActive[data-link="terminal"]')
      || document.querySelector('.windowElement[data-link="terminal"]');
    const strip = win?.querySelector('.fedora-terminal-tabs');
    const tabs = strip ? [...strip.querySelectorAll('.fedora-terminal-tabs__tab')] : [];
    const stripRect = strip?.getBoundingClientRect();
    const tabRects = tabs.map((t) => t.getBoundingClientRect());
    if (!strip || tabs.length < 2 || !stripRect) {
      return { ok: false, reason: 'need-two-tabs' };
    }
    const stripInner = stripRect.width;
    const tabSum = tabRects.reduce((s, r) => s + r.width, 0);
    const ratio0 = tabRects[0].width / stripInner;
    const ratio1 = tabRects[1].width / stripInner;
    const balanced = Math.abs(ratio0 - ratio1) < 0.12;
    const fillsStrip = tabSum >= stripInner * 0.72;
    const noFixedCap = tabs.every((t) => getComputedStyle(t).maxWidth === 'none');
    return {
      ok: balanced && fillsStrip && noFixedCap,
      stripW: Math.round(stripInner),
      tabWs: tabRects.map((r) => Math.round(r.width)),
      maxWidth: tabs.map((t) => getComputedStyle(t).maxWidth),
    };
  });
  if (!s2flex.ok) {
    errors.push(`flex-tabs: répartition inégale ou max-width fixe (${JSON.stringify(s2flex)})`);
  }

  await page.evaluate(() => {
    for (let i = 0; i < 2; i += 1) window.openTerminalTab?.();
  });
  await page.waitForTimeout(500);
  const s2 = await page.evaluate(measureWindow);
  if (s2.tabCount < 3) errors.push(`multi-tab: ${s2.tabCount} onglet(s) attendu ≥ 3`);
  if (!s2.multitab) errors.push('multi-tab: classe terminal-window--multitab absente');
  if (!s2.closeOk) errors.push('multi-tab: bouton fermer coupé');

  await page.evaluate(() => {
    const win = document.querySelector('.windowElement.windowElementActive[data-link="terminal"]')
      || document.querySelector('.windowElement[data-link="terminal"]');
    const minW = parseFloat(getComputedStyle(win).minWidth) || 640;
    win.style.width = `${minW}px`;
    win.style.maxWidth = `${minW}px`;
  });
  await page.waitForTimeout(300);
  const s3 = await page.evaluate(measureWindow);
  if (!s3.closeOk) errors.push(`min-width (${s3.winW}px): bouton fermer coupé`);
  if (s3.headerH < 40 || s3.headerH > 56) errors.push(`min-width: hauteur header ${s3.headerH}px hors plage`);

  await page.evaluate(() => {
    if (window.openNewWindowByDataLink) window.openNewWindowByDataLink('terminal');
    else window.openWindowByDataLink('terminal', { newWindow: true });
  });
  await page.waitForTimeout(1200);
  const s4 = await page.evaluate(() => {
    const wins = [...document.querySelectorAll('.windowElement[data-link="terminal"]')];
    return {
      count: wins.length,
      oneInactive: wins.some((w) => !w.classList.contains('windowElementActive')),
      oneActive: wins.some((w) => w.classList.contains('windowElementActive')),
      allCloseOk: wins.every((win) => {
        const close = win.querySelector('#closeBtn');
        const r = close?.getBoundingClientRect();
        const w = win.getBoundingClientRect();
        return r && r.width > 4 && r.right <= w.right + 1;
      }),
    };
  });
  if (s4.count < 2) errors.push(`dual-window: ${s4.count} fenêtre(s) attendu 2`);
  if (!s4.oneInactive || !s4.oneActive) errors.push('dual-window: états actif/inactif incorrects');
  if (!s4.allCloseOk) errors.push('dual-window: fermer coupé sur une fenêtre');

  if (errors.length) {
    console.error(`✗ smoke-terminal-ptyxis-chrome — ${PROFILE} — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
  }

  console.log(`✓ smoke-terminal-ptyxis-chrome OK — ${PROFILE} (4 états)`);
} finally {
  await browser.close();
}
