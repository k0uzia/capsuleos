/**
 * Scénarios captures par registryId (toolkit / shell).
 */

const sleep = (page, ms) => page.waitForTimeout(ms);

/** Horloge figée pour captures déterministes (panel Plasma / Mint). */
const CAPTURE_CLOCK_ISO = '2026-06-08T14:30:00+02:00';

const resetVisibleWindows = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset ? win.dataset.link : '';
      if (!slot) return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
      link.classList.remove('running-link', 'active-link');
    });
  });
  await sleep(page, 120);
};

const openSlot = async (page, slot) => {
  await resetVisibleWindows(page);
  await page.evaluate((s) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(s);
    }
  }, slot);
  await page.waitForSelector(`.windowElement[data-link="${slot}"]`, {
    state: 'visible',
    timeout: 15000,
  }).catch(() => {});
  if (slot === 'nemo') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="nemo"]');
        if (!root || root.style.display === 'none') return false;
        const grid = root.querySelector('.nemoElement[data-pane="primary"], #voletContainer > .nemoElement');
        return grid && grid.querySelectorAll('a[data-item-name]').length >= 3;
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
  }
  if (slot === 'terminal') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="terminal"]');
        return root && root.style.display !== 'none'
          && root.querySelector('[data-terminal-output]');
      },
      null,
      { timeout: 20000 },
    ).catch(() => {});
  }
  if (slot === 'update_manager') {
    await page.waitForFunction(
      () => {
        const root = document.querySelector('.windowElement[data-link="update_manager"]');
        return root && root.style.display !== 'none'
          && root.querySelector('[data-discover-home-mount] .kde-discover-card');
      },
      null,
      { timeout: 30000 },
    ).catch(() => {});
  }
  await sleep(page, 500);
};

const mintShots = [
  { name: '01-desktop-panel', action: async () => {} },
  {
    name: '02-menu',
    action: async (page) => {
      await page.click('footer nav a[target="windowElement"][data-link="mainMenu"]');
      await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 8000 });
      await sleep(page, 300);
    },
  },
  { name: '03-nemo', action: async (page) => openSlot(page, 'nemo') },
  { name: '04-firefox', action: async (page) => openSlot(page, 'firefox') },
  { name: '05-terminal', action: async (page) => openSlot(page, 'terminal') },
];

const plasmaShots = [
  { name: '01-desktop-panel', action: async (page) => resetVisibleWindows(page) },
  {
    name: '02-kickoff',
    action: async (page) => {
      await resetVisibleWindows(page);
      await page.click('footer nav a[target="windowElement"][data-link="mainMenu"]');
      await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 8000 });
      await page.waitForFunction(
        () => document.querySelectorAll('#mainMenu .menu-app-item').length >= 8,
        null,
        { timeout: 15000 },
      ).catch(() => {});
      await sleep(page, 600);
    },
  },
  { name: '03-dolphin', action: async (page) => openSlot(page, 'nemo') },
  {
    name: '04-firefox',
    action: async (page) => {
      await openSlot(page, 'firefox');
      await page.waitForFunction(
        () => {
          const app = document.querySelector('.windowElement[data-link="firefox"] [data-firefox-app]');
          return app && app.dataset.initialized === 'true';
        },
        null,
        { timeout: 15000 },
      ).catch(() => {});
      await sleep(page, 500);
    },
  },
  { name: '05-terminal', action: async (page) => openSlot(page, 'terminal') },
  {
    name: '06-discover',
    action: async (page) => {
      await page.evaluate(() => {
        sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');
      });
      await openSlot(page, 'update_manager');
      await page.waitForSelector('[data-discover-store-section]', { timeout: 20000 });
      await page.waitForFunction(
        () => {
          const section = document.querySelector('[data-discover-store-section]');
          return section && section.querySelectorAll('.kde-discover-card').length >= 5;
        },
        null,
        { timeout: 15000 },
      );
      await page.evaluate(() => {
        const section = document.querySelector('[data-discover-store-section]');
        if (section) {
          section.scrollIntoView({ block: 'start' });
        }
      });
      await sleep(page, 500);
    },
  },
  {
    name: '07-discover-detail-vlc',
    action: async (page) => {
      await page.evaluate(() => {
        sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');
      });
      await openSlot(page, 'update_manager');
      await page.waitForSelector(
        '[data-discover-home-mount] .kde-discover-card[data-discover-app="vlc"]',
        { timeout: 20000 },
      );
      await sleep(page, 400);
      await page.click('[data-discover-home-mount] .kde-discover-card[data-discover-app="vlc"]');
      await page.waitForFunction(
        () => {
          const panel = document.querySelector('[data-discover-app-detail]');
          if (!panel || panel.hidden) {
            return false;
          }
          const name = document.querySelector('.kde-discover-app-detail__name')?.textContent?.trim();
          const imgs = [...panel.querySelectorAll('.kde-discover-app-detail__shot-img')];
          const loaded = imgs.filter((img) => img.complete && img.naturalWidth > 0);
          return name && name.includes('VLC') && (loaded.length >= 1 || imgs.length >= 2);
        },
        null,
        { timeout: 35000 },
      );
      await page.evaluate(() => {
        const carousel = document.querySelector('.kde-discover-app-detail__carousel');
        if (carousel) {
          carousel.style.display = 'none';
        }
        const top = document.querySelector('.kde-discover-app-detail__top');
        if (top) {
          top.scrollIntoView({ block: 'start' });
        }
      });
      await sleep(page, 500);
    },
  },
];

const gnomeOverviewShots = (triggerSel, showAppsSel) => [
  { name: '01-desktop-shell', action: async () => {} },
  {
    name: '02-overview',
    action: async (page) => {
      if (showAppsSel) {
        await page.click(showAppsSel);
      } else if (triggerSel) {
        await page.click(triggerSel);
      }
      await sleep(page, 400);
    },
  },
  { name: '03-nemo', action: async (page) => openSlot(page, 'nemo') },
  { name: '04-firefox', action: async (page) => openSlot(page, 'firefox') },
  { name: '05-terminal', action: async (page) => openSlot(page, 'terminal') },
];

export const CAPTURE_SCENARIOS = {
  'linux-mint': { shots: mintShots },
  'linux-kde-neon': { shots: plasmaShots },
  'linux-ubuntu': {
    shots: gnomeOverviewShots('.fedora-overview-trigger', '#ubuntu-dock-show-apps'),
  },
  'linux-rocky': {
    shots: gnomeOverviewShots('.fedora-overview-trigger', null),
  },
  'linux-fedora': {
    shots: gnomeOverviewShots('.fedora-overview-trigger', null),
  },
  'linux-opensuse': { shots: plasmaShots },
  'linux-mx-kde': { shots: plasmaShots },
  'linux-debian-kde': { shots: plasmaShots },
};

export const getCaptureShots = (registryId) => {
  const scenario = CAPTURE_SCENARIOS[registryId];
  if (scenario) {
    return scenario.shots;
  }
  return [
    { name: '01-desktop', action: async () => {} },
    { name: '02-nemo', action: async (page) => openSlot(page, 'nemo') },
    { name: '03-firefox', action: async (page) => openSlot(page, 'firefox') },
    { name: '04-terminal', action: async (page) => openSlot(page, 'terminal') },
  ];
};
