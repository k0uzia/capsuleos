#!/usr/bin/env node
/**
 * Smoke Konsole KDE Neon — chrome titlebar + toolbar.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
const errors = [];

const terminalCss = fs.readFileSync(path.join(ROOT, 'home/Debian/KDE-Neon/style/apps/terminal.skin.css'), 'utf8');
if (!terminalCss.includes('--konsole-chrome')) {
  errors.push('terminal.skin.css : tokens konsole absents');
}
if (!terminalCss.includes('body#kde-neon div[data-link="terminal"]')) {
  errors.push('terminal.skin.css : scope kde-neon absent');
}

const chromePath = [
  process.env.PLAYWRIGHT_CHROME,
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));

let runtime = null;
if (chromePath) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => window.openWindowByDataLink('terminal'));
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="terminal"]');
        return root && root.style.display !== 'none' && root.querySelector('#windowHeader');
      },
      null,
      { timeout: 15000 },
    );
    runtime = await page.evaluate(() => {
      const root = document.querySelector('.windowElement[data-link="terminal"]');
      const header = root ? root.querySelector('#windowHeader') : null;
      const title = root ? root.querySelector('#windowTitle') : null;
      const toolbar = root ? root.querySelector('.capsule-terminal-toolbar') : null;
      const style = header ? getComputedStyle(header) : null;
      return {
        visible: !!(root && root.style.display !== 'none'),
        titleText: title ? title.textContent.trim() : '',
        headerBg: style ? style.backgroundColor : '',
        hasToolbar: !!toolbar,
      };
    });
    await browser.close();
    if (!runtime.visible) {
      errors.push('runtime : fenêtre Konsole invisible');
    }
    if (!runtime.titleText || runtime.titleText.indexOf('Konsole') === -1) {
      errors.push(`runtime : titre=${runtime.titleText || '(vide)'}`);
    }
  } catch (err) {
    errors.push(`playwright : ${err.message || err}`);
  }
} else {
  errors.push('playwright : Chrome introuvable');
}

const ok = errors.length === 0;
console.log(JSON.stringify({ ok, errors, runtime }, null, 2));
process.exit(ok ? 0 : 1);
