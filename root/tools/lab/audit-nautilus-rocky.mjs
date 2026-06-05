#!/usr/bin/env node
/**
 * Audit slot nemo (gabarit nemo-gnome / Nautilus Rocky) : images cassées et chemins icônes.
 * Usage : node root/tools/lab/audit-nautilus-rocky.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const URL = process.env.CAPSULE_ROCKY_URL || 'http://127.0.0.1:5500/home/RedHat/Rocky/index.html';
const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
const chromePath = process.env.PLAYWRIGHT_CHROME || defaultChrome;

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const failed = [];
  page.on('response', (res) => {
    if (res.status() >= 400 && /nemo|adwaita|cinnamon\/nemo|wallpaper/.test(res.url())) {
      failed.push({ status: res.status(), url: res.url() });
    }
  });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('nemo');
    }
  });
  await page.waitForFunction(
    () => document.querySelector('#nemo .nautilus-app__headerbar') != null,
    { timeout: 20000 },
  );
  await page.waitForTimeout(800);
  const audit = await page.evaluate(() => {
    const slot = document.getElementById('nemo');
    const imgs = slot ? [...slot.querySelectorAll('img[src]')] : [];
    const visible = imgs.filter((img) => {
      if (img.closest('.nemo-app__menubar')) return false;
      const hidden = img.closest('[style*="display: none"]');
      return !hidden;
    });
    const broken = visible
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src'));
    const cinnamonLeft = visible
      .map((img) => img.getAttribute('src'))
      .filter((src) => src && src.includes('cinnamon/nemo'));
    const adwaita = imgs
      .map((img) => img.getAttribute('src'))
      .filter((src) => src && (src.includes('adwaita') || src.includes('icons/gnome')));
    return {
      template: window.CAPSULE_EXPLORER_TEMPLATE,
      assetsBase: window.CAPSULE_ASSETS_BASE,
      gnomeBase: window.CAPSULE_GNOME_ICONS_BASE,
      total: imgs.length,
      broken,
      cinnamonLeft,
      adwaitaCount: adwaita.length,
      sample: adwaita.slice(0, 5),
    };
  });
  await browser.close();
  console.log(JSON.stringify({ audit, failed: failed.slice(0, 30) }, null, 2));
  const ok = audit.broken.length === 0 && audit.cinnamonLeft.length === 0;
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
