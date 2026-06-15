/**
 * Helpers capture parité P0 GNOME — fenêtre .windowElement alignée compare Φ.
 */
export const vendorPrefix = (registryId) => {
  if (registryId === 'linux-alma') return 'alma';
  if (registryId === 'linux-fedora') return 'fedora';
  if (registryId === 'linux-ubuntu') return 'ubuntu';
  return 'rocky';
};

export const setGnomeTheme = async (page, theme = 'dark') => {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('gnome-theme', t);
  }, theme);
};

export const openSlotWindow = async (page, slotId, waitSelector = null) => {
  await page.evaluate((slot) => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      if (win.dataset.link !== slot) {
        win.style.display = 'none';
      }
    });
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(slot);
    }
  }, slotId);
  await page.waitForFunction(
    (slot) => {
      const win = document.querySelector(`.windowElement[data-link="${slot}"]`);
      return !!(win && getComputedStyle(win).display !== 'none');
    },
    slotId,
    { timeout: 60000 },
  );
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 30000 });
  }
  await page.waitForTimeout(500);
};

export const captureSlotWindow = async (page, slotId, outPath) => {
  await page.locator(`.windowElement[data-link="${slotId}"]`).screenshot({ path: outPath });
};
