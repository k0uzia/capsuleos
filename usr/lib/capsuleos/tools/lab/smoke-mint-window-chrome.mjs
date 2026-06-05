#!/usr/bin/env node
/**
 * Smoke — barre titre Muffin sur plusieurs fenêtres Mint.
 */
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

async function probeSlot(slotId) {
  await page.evaluate((id) => {
    window.openWindowByDataLink(id);
  }, slotId);
  await page.waitForSelector(`div[data-link="${slotId}"]`, { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(600);
  return page.evaluate((id) => {
    const win = document.querySelector(`div[data-link="${id}"]`);
    const header = win?.querySelector(':scope > #windowHeader');
    const style = header ? getComputedStyle(header) : null;
    const provider = win?.getAttribute('data-window-chrome-provider');
    return {
      slotId: id,
      toolkit: win?.getAttribute('data-window-chrome-toolkit'),
      provider,
      headerVisible: !!(header && style && style.display !== 'none' && style.visibility !== 'hidden'),
      headerDrag: header?.hasAttribute('data-window-drag-handle') === true,
      title: header?.querySelector('#windowTitle')?.textContent?.trim() || '',
      hasClose: !!header?.querySelector('#closeBtn'),
    };
  }, slotId);
}

const slots = [
  { id: 'nemo', provider: 'nemo', titleIncludes: 'Nemo' },
  { id: 'firefox', provider: 'cinnamon', titleIncludes: 'Firefox' },
  { id: 'calculator', provider: 'cinnamon', titleIncludes: 'Calculatrice' },
  { id: 'update_manager', provider: 'cinnamon', titleIncludes: 'mise' },
];

const results = [];
for (const slot of slots) {
  results.push(await probeSlot(slot.id));
}

await page.click('footer nav a[data-link="mainMenu"]');
await page.waitForTimeout(400);
await page.fill('#menu-search', 'Gestionnaire d\'archives');
await page.waitForTimeout(300);
await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
await page.waitForTimeout(800);

const fileRoller = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="file_roller"]');
  const header = win?.querySelector(':scope > #windowHeader');
  const style = header ? getComputedStyle(header) : null;
  return {
    slotId: 'file_roller',
    toolkit: win?.getAttribute('data-window-chrome-toolkit'),
    provider: win?.getAttribute('data-window-chrome-provider'),
    headerVisible: !!(header && style && style.display !== 'none'),
    headerDrag: header?.hasAttribute('data-window-drag-handle') === true,
    csd: win?.classList.contains('file-roller--csd'),
    title: header?.querySelector('#windowTitle')?.textContent?.trim() || '',
    hasClose: !!header?.querySelector('#closeBtn'),
  };
});
results.push(fileRoller);

const ok = results.every((r) => {
  const spec = slots.find((s) => s.id === r.slotId) || { provider: 'cinnamon', titleIncludes: 'archives' };
  const titleNeedle = r.slotId === 'file_roller' ? 'archives' : spec.titleIncludes;
  return r.toolkit === 'cinnamon'
    && r.provider === spec.provider
    && r.headerVisible
    && r.hasClose
    && r.headerDrag
    && !r.csd
    && r.title.toLowerCase().includes(titleNeedle.toLowerCase());
});

console.log(JSON.stringify({ results, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
