#!/usr/bin/env node
/**
 * Captures panel + menu Mint pour comparaison VM / baseline.
 * Usage : PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node usr/lib/capsuleos/tools/lab/capture-mint-panel-menu.mjs [--compare]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { openMintMainMenu } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const compare = process.argv.includes('--compare');
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
const outDir = path.join(ROOT, 'root/docs/inventaires/captures/linux-mint', stamp);
const baselineDir = path.join(ROOT, 'root/docs/inventaires/captures/linux-mint/baseline');

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.screenshot({ path: path.join(outDir, '01-desktop-panel.png'), fullPage: false });
await openMintMainMenu(page);
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(outDir, '02-menu.png'), fullPage: false });

const iconStats = await page.evaluate(() => {
  const imgs = document.querySelectorAll('#menu-app-list img');
  let ok = 0;
  let broken = 0;
  imgs.forEach((img) => {
    if (img.naturalWidth > 0) ok += 1;
    else broken += 1;
  });
  return { total: imgs.length, ok, broken };
});

const manifest = {
  id: 'linux-mint',
  url: URL,
  stamp,
  iconStats,
  captures: [
    { name: '01-desktop-panel', file: path.relative(ROOT, path.join(outDir, '01-desktop-panel.png')) },
    { name: '02-menu', file: path.relative(ROOT, path.join(outDir, '02-menu.png')) },
  ],
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

if (compare && fs.existsSync(baselineDir)) {
  const baseManifest = JSON.parse(fs.readFileSync(path.join(baselineDir, 'manifest.json'), 'utf8'));
  const diff = {
    stamp,
    baseline: baseManifest.stamp,
    iconStats,
    baselineIconStats: baseManifest.iconStats || null,
  };
  fs.writeFileSync(path.join(outDir, 'compare-baseline.json'), `${JSON.stringify(diff, null, 2)}\n`);
}

console.log(JSON.stringify({ outDir, iconStats, menuOk: iconStats.broken === 0 }, null, 2));
await browser.close();
process.exit(iconStats.broken === 0 ? 0 : 1);
