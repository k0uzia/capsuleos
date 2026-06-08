/**
 * Helpers Playwright Mint — attentes conditionnelles, sleeps courts.
 */

const SLOT_VISIBLE = 'div.windowElement[data-link="%s"]';

export async function openMintSlot(page, slotId, options) {
  const opts = options || {};
  const settleMs = opts.settleMs !== undefined ? opts.settleMs : 80;
  await page.evaluate((slot) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(slot);
    }
  }, slotId);
  await page.waitForSelector(SLOT_VISIBLE.replace('%s', slotId), {
    state: 'visible',
    timeout: opts.timeout || 15000,
  }).catch(() => {});
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
}

export async function openMintMainMenu(page) {
  await page.click('footer nav a[data-link="mainMenu"]');
  await page.waitForSelector('#mainMenu .menu-root', { state: 'visible', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(80);
}

export async function openMintAppFromMenu(page, searchText, slotId) {
  await openMintMainMenu(page);
  await page.fill('#menu-search', searchText);
  await page.waitForTimeout(100);
  await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
  if (slotId) {
    await page.waitForSelector(SLOT_VISIBLE.replace('%s', slotId), {
      state: 'visible',
      timeout: 15000,
    }).catch(() => {});
  }
  await page.waitForTimeout(100);
}

/** Pause courte entre micro-actions (défaut 80 ms). */
export function mintTick(page, ms) {
  return page.waitForTimeout(ms !== undefined ? ms : 80);
}
