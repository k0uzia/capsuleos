#!/usr/bin/env node
/**
 * Checklist panel CapsuleOS via Playwright (clics réels) → /tmp/capsule-panel.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.CAPSULE_PANEL_OUT || '/tmp/capsule-panel.json';
const URL = process.env.CAPSULE_PANEL_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const PROBE = fs.readFileSync(path.join(__dirname, 'capsule-probe-snippet.js'), 'utf8')
  .replace(/\(function capsuleProbeState\(\) \{/, 'function probeState() {')
  .split('}());').join('}');

const STEPS = [
  { step: 0, actions: [['open-launcher', 'nemo']] },
  { step: 1, actions: [['open-launcher', 'firefox'], ['focus-launcher', 'firefox']] },
  { step: 2, actions: [['open-launcher', 'terminal'], ['focus-launcher', 'terminal']] },
  { step: 3, actions: [['focus-launcher', 'nemo']] },
  { step: 4, actions: [['minimize-launcher', 'nemo']] },
  { step: 5, actions: [['nemo-sidebar', 'Documents']] },
];

const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const sleep = (page, ms) => page.waitForTimeout(ms);

const resetPanel = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset ? win.dataset.link : '';
      if (!slot || slot === 'mainMenu') return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
      link.classList.remove('running-link', 'active-link');
    });
    if (window.CapsuleTaskbarLauncherState && window.CapsuleTaskbarLauncherState.refresh) {
      window.CapsuleTaskbarLauncherState.refresh();
    }
  });
};

const runAction = async (page, cmd, arg) => {
  const launcher = `footer nav a[target="windowElement"][data-link="${arg}"]`;
  if (cmd === 'open-launcher') {
    await page.evaluate((slot) => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink(slot);
      }
    }, arg);
    await page.waitForSelector('.windowElement[data-link="' + arg + '"]', {
      state: 'visible',
      timeout: 15000,
    });
    return;
  }
  if (cmd === 'focus-launcher') {
    await page.evaluate((slot) => {
      const container = document.querySelector('.windowElement[data-link="' + slot + '"]');
      const hidden = !container || container.style.display === 'none';
      if (hidden && typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink(slot);
        return;
      }
      if (container && !container.classList.contains('windowElementActive')) {
        const link = document.querySelector(
          'footer nav a[target="windowElement"][data-link="' + slot + '"]',
        );
        if (link) {
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
      }
    }, arg);
    await page.waitForSelector('.windowElement[data-link="' + arg + '"]', {
      state: 'visible',
      timeout: 15000,
    });
    return;
  }
  if (cmd === 'minimize-launcher') {
    const active = await page.locator('.windowElement[data-link="' + arg + '"].windowElementActive').count();
    if (active > 0) {
      await page.locator(launcher).click({ timeout: 15000, force: true });
    }
    return;
  }
  if (cmd === 'nemo-sidebar') {
    await page.locator('footer nav a[data-link="nemo"]').click({ timeout: 15000, force: true });
    await page.waitForSelector('.windowElement[data-link="nemo"]', { state: 'visible', timeout: 15000 });
    await sleep(page, 500);
    await page.locator('.windowElement[data-link="nemo"] a[data-link="' + arg + '"]').click({
      timeout: 15000,
      force: true,
    });
  }
};

const main = async () => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
    timeout: 60000,
  });

  await resetPanel(page);
  await sleep(page, 400);

  const out = [];
  for (const st of STEPS) {
    for (const [cmd, arg] of st.actions) {
      await runAction(page, cmd, arg);
      await sleep(page, 900);
    }
    await sleep(page, 400);
    await page.evaluate(() => {
      if (window.CapsuleTaskbarLauncherState && window.CapsuleTaskbarLauncherState.refresh) {
        window.CapsuleTaskbarLauncherState.refresh();
      }
    });
    const state = await page.evaluate((probeSrc) => {
      const fn = new Function(probeSrc + '; return probeState();');
      return fn();
    }, PROBE);
    out.push({ step: st.step, state });
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  await browser.close();
  process.stdout.write(`OK ${OUT} (${out.length} steps)\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
