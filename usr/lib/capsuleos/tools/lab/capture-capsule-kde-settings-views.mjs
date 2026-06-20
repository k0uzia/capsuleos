#!/usr/bin/env node
/**
 * Captures Capsule Paramètres KDE Neon — 10 shots P0 (prepareShot).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/capture-capsule-kde-settings-views.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const MATRIX_REL = 'root/tools/lab/kde-settings-visual-investigation-matrix.json';
const VIEWPORT = { width: 1060, height: 808 };

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const defaultChrome = [
  process.env.PLAYWRIGHT_CHROME,
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const ensureThemesVisible = async (page) => {
  const visible = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="themes"]');
    return !!(win && getComputedStyle(win).display !== 'none');
  });
  if (visible) return;
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('themes');
    }
  });
  await page.waitForFunction(
    () => {
      const win = document.querySelector('.windowElement[data-link="themes"]');
      return !!(win && getComputedStyle(win).display !== 'none');
    },
    null,
    { timeout: 60000 },
  );
  await sleep(page, 500);
};

const prepareShot = async (page, shotId) => {
  await page.evaluate((id) => {
    if (window.CapsuleKdeSettingsNav?.prepareShot) {
      window.CapsuleKdeSettingsNav.prepareShot(id);
    }
  }, shotId);
  if (shotId === 'appearance-panel') {
    await page.evaluate(() => {
      const imgs = document.querySelectorAll(
        '#themes [data-kde-panel-content="lookandfeel"] .kde-systemsettings__theme-preview-img',
      );
      return Promise.all(
        Array.from(imgs).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            }),
        ),
      );
    });
  }
  await sleep(page, 400);
};

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }

  const matrixPath = path.join(ROOT, MATRIX_REL);
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const shots = (matrix.investigations || []).filter((i) => i.parityPriority === 'P0');

  const paths = appsPathsForRegistry(opts.id);
  const outDir = path.join(paths.capsuleCapturesDir, 'themes');
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });

  const url = resolveCapsuleOsUrl(opts.id, base);
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
  await ensureThemesVisible(page);

  for (const inv of shots) {
    await ensureThemesVisible(page);
    await prepareShot(page, inv.controlId);
    const win = page.locator('.windowElement[data-link="themes"]');
    const outPath = path.join(outDir, `${inv.controlId}-capsule.png`);
    await win.screenshot({ path: outPath });
    process.stdout.write(`  ✓ ${inv.controlId}-capsule.png\n`);
  }

  await browser.close();
  console.log(`✓ capture-capsule-kde-settings-views ${opts.id} — ${shots.length} PNG → ${outDir}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
