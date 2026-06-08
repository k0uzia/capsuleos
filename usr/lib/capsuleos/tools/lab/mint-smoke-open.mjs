/**
 * Ouvre un slot Mint sans lanceur panel fixe (VM : menu / favoris / grouped-window-list).
 */
export async function openMintSlot(page, slotId, waitMs = 500) {
  await page.evaluate((slot) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(slot);
    }
  }, slotId);
  await page.waitForTimeout(waitMs);
}

export async function openMintMainMenu(page) {
  await page.click('footer nav a[data-link="mainMenu"]');
  await page.waitForTimeout(400);
}
