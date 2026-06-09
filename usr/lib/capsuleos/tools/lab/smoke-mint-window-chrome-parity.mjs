#!/usr/bin/env node
/**
 * Parité chrome Muffin — mesures DOM CapsuleOS vs inventaire VM.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs
 *
 * Attendu (VM Mint 22.3, SSD) : titlebar 32 px, contrôles 32 px, pas de gutter interne.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { chromePath, MINT_URL, waitMintReady } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const VM_JSON = path.join(ROOT, 'root/docs/inventaires/linux-mint-window-chrome-vm.json');

const vm = JSON.parse(fs.readFileSync(VM_JSON, 'utf8'));
const expectedTitlebar = vm.aggregates.ssdTitlebarTopMedian || 32;
const expectedControl = 22;
const expectedIcon = 18;
const tolerance = 2;

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);

await page.evaluate(() => {
  window.openWindowByDataLink('nemo');
});
await page.waitForSelector('div[data-link="nemo"]', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(45);

const metrics = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const header = win?.querySelector(':scope > #windowHeader');
  const btn = header?.querySelector('#minimizeBtn');
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const px = (v) => parseFloat(v) || 0;
  const winCs = cs(win);
  const headerCs = cs(header);
  const btnCs = cs(btn);
  const winRect = win?.getBoundingClientRect();
  const headerRect = header?.getBoundingClientRect();
  return {
    winPaddingTop: px(winCs?.paddingTop),
    winPaddingLeft: px(winCs?.paddingLeft),
    winBorderWidth: px(winCs?.borderTopWidth),
    headerHeight: headerRect?.height || 0,
    headerWidth: headerRect?.width || 0,
    winInnerWidth: winRect?.width || 0,
    headerPadding: headerCs?.padding || '',
    btnWidth: px(btnCs?.width),
    btnHeight: px(btnCs?.height),
    btnBgSize: btnCs?.backgroundSize || '',
    iconLayerSize: (() => {
      const parts = (btnCs?.backgroundSize || '').split(/\s+/);
      return parseFloat(parts[0]) || 0;
    })(),
    titlebarVar: getComputedStyle(document.documentElement).getPropertyValue('--mint-muffin-titlebar-height').trim(),
  };
});

const checks = [
  {
    id: 'titlebar-height',
    ok: Math.abs(metrics.headerHeight - expectedTitlebar) <= tolerance,
    expected: expectedTitlebar,
    actual: metrics.headerHeight,
  },
  {
    id: 'control-hit-size',
    ok: Math.abs(metrics.btnWidth - expectedControl) <= tolerance
      && Math.abs(metrics.btnHeight - expectedControl) <= tolerance,
    expected: expectedControl,
    actual: { w: metrics.btnWidth, h: metrics.btnHeight },
  },
  {
    id: 'control-icon-size',
    ok: Math.abs(metrics.iconLayerSize - expectedIcon) <= tolerance,
    expected: expectedIcon,
    actual: metrics.iconLayerSize,
  },
  {
    id: 'no-win-gutter',
    ok: metrics.winPaddingTop <= 1 && metrics.winPaddingLeft <= 1,
    expected: 0,
    actual: { top: metrics.winPaddingTop, left: metrics.winPaddingLeft },
  },
  {
    id: 'header-full-bleed',
    ok: metrics.winInnerWidth > 0 && Math.abs(metrics.headerWidth - metrics.winInnerWidth) <= 2,
    expected: 'header ≈ largeur fenêtre',
    actual: { header: metrics.headerWidth, win: metrics.winInnerWidth },
  },
  {
    id: 'btn-background-contain',
    ok: metrics.btnBgSize.indexOf(String(expectedIcon)) !== -1,
    expected: expectedIcon + 'px',
    actual: metrics.btnBgSize,
  },
];

const ok = checks.every((c) => c.ok);
const payload = {
  vmReference: {
    collectedAt: vm.collectedAt,
    ssdTitlebarTopMedian: expectedTitlebar,
    buttonLayout: vm.aggregates.buttonLayout,
  },
  metrics,
  checks,
  ok,
};

console.log(JSON.stringify(payload, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
