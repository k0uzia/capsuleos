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
  { name: '06-discover', action: async (page) => openSlot(page, 'update_manager') },
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
  'linux-opensuse': {
    shots: gnomeOverviewShots('.fedora-overview-trigger', null),
  },
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
