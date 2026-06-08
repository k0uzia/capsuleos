/**
 * Scénarios captures par registryId (toolkit / shell).
 */

const sleep = (page, ms) => page.waitForTimeout(ms);

const openSlot = async (page, slot) => {
  await page.evaluate((s) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(s);
    }
  }, slot);
  await page.waitForSelector(`.windowElement[data-link="${slot}"]`, {
    state: 'visible',
    timeout: 15000,
  }).catch(() => {});
  await sleep(page, 200);
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
