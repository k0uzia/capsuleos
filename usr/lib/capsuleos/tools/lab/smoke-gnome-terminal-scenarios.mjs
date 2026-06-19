#!/usr/bin/env node
/**
 * Smoke scénarios pédagogiques GNOME Terminal Ptyxis (Te1–Te4 P0) — slot `terminal`.
 * Anti-régression Mint : --id linux-mint vérifie terminal Konsole intact (pas chrome Ptyxis GNOME).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-terminal-scenarios.mjs --id linux-alma
 *   ... --scenario Te1
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const GNOME_PROFILES = new Set(['linux-alma', 'linux-rocky', 'linux-fedora', 'linux-ubuntu']);
const CINNAMON_PROFILES = new Set(['linux-mint']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-alma', scenario: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    if (args[i] === '--scenario' && args[i + 1]) opts.scenario = args[++i];
  }
  return opts;
};

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);

const openTerminal = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('terminal');
    }
  });
  await page.waitForFunction(
    () => {
      const app = document.querySelector('.windowElement[data-link="terminal"] [data-terminal-app]');
      return app?.dataset?.terminalReady === 'true';
    },
    null,
    { timeout: 15000 },
  );
  await sleep(page, 500);
};

const readTerminalDataset = async (page) => page.evaluate(() => {
  const root = document.querySelector('[data-terminal-gnome-root]');
  return root ? { ...root.dataset } : {};
});

const submitCommand = async (page, command) => {
  await page.fill('[data-terminal-gnome-command]', command);
  await page.press('[data-terminal-gnome-command]', 'Enter');
  await sleep(page, 400);
};

const expectedHostFragment = (registryId) => {
  if (registryId === 'linux-alma') return 'alma';
  if (registryId === 'linux-rocky') return 'rocky';
  if (registryId === 'linux-fedora') return 'fedora';
  if (registryId === 'linux-ubuntu') return 'ubuntu';
  return 'capsule@';
};

const expectedWhoamiUser = (registryId) => 'capsule';

const scenarioTe1 = async (page, errors, registryId) => {
  await openTerminal(page);
  const ds = await readTerminalDataset(page);
  if (ds.terminalGnomeInit !== 'true') {
    errors.push('Te1 : dataset.terminalGnomeInit=true attendu');
  }
  if (ds.ptyxisGnomeProvider !== 'ptyxis-gnome') {
    errors.push(`Te1 : ptyxisGnomeProvider=ptyxis-gnome attendu, obtenu « ${ds.ptyxisGnomeProvider} »`);
  }
  const hostFrag = expectedHostFragment(registryId);
  if (!String(ds.terminalGnomePrompt || '').includes(hostFrag)) {
    errors.push(`Te1 : invite ${hostFrag} attendue, obtenu « ${ds.terminalGnomePrompt} »`);
  }
  const fedoraChrome = await page.locator('.windowElement[data-link="terminal"].terminal-window--fedora').count();
  if (fedoraChrome === 0) {
    errors.push('Te1 : classe terminal-window--fedora absente (chrome Ptyxis)');
  }
  const promptUser = await page.locator('.capsule-terminal__prompt-user').count();
  if (promptUser === 0) {
    errors.push('Te1 : segments invite colorés absents');
  }
};

const scenarioTe2 = async (page, errors) => {
  await openTerminal(page);
  await submitCommand(page, 'pwd');
  const state = await page.evaluate(() => ({
    dataset: document.querySelector('[data-terminal-gnome-root]')?.dataset || {},
    output: document.querySelector('[data-terminal-gnome-output]')?.textContent || '',
  }));
  if (state.dataset.terminalGnomeLastCommand !== 'pwd') {
    errors.push(`Te2 : dernière commande pwd attendue, obtenu « ${state.dataset.terminalGnomeLastCommand} »`);
  }
  if (!state.output.includes('/')) {
    errors.push(`Te2 : sortie pwd avec chemin attendue, obtenu « ${state.output.slice(0, 80)} »`);
  }
  await submitCommand(page, 'ls');
  const lsOut = await page.textContent('[data-terminal-gnome-output]');
  if (!lsOut || lsOut.trim().length < 2) {
    errors.push('Te2 : sortie ls vide');
  }
};

const scenarioTe3 = async (page, errors) => {
  await openTerminal(page);
  await page.evaluate(() => {
    if (typeof window.openTerminalTab === 'function') {
      window.openTerminalTab();
    }
  });
  await sleep(page, 450);
  const state = await page.evaluate(() => ({
    tabCount: document.querySelector('[data-terminal-gnome-root]')?.dataset?.terminalGnomeTabCount,
    multitab: document.querySelector('.windowElement[data-link="terminal"]')?.classList.contains('terminal-window--multitab'),
    tabs: document.querySelectorAll('.fedora-terminal-tabs__tab').length,
  }));
  if (state.tabCount !== '2') {
    errors.push(`Te3 : 2 onglets attendus, obtenu « ${state.tabCount} »`);
  }
  if (!state.multitab) {
    errors.push('Te3 : classe terminal-window--multitab absente');
  }
  if (state.tabs < 2) {
    errors.push(`Te3 : ${state.tabs} onglet(s) DOM attendu ≥ 2`);
  }
};

const scenarioTe4 = async (page, errors, registryId) => {
  await openTerminal(page);
  await submitCommand(page, 'whoami');
  let ds = await readTerminalDataset(page);
  if (ds.terminalGnomeLastCommand !== 'whoami') {
    errors.push(`Te4 : whoami enregistré attendu, obtenu « ${ds.terminalGnomeLastCommand} »`);
  }
  const whoamiUser = expectedWhoamiUser(registryId);
  const whoamiOut = await page.textContent('[data-terminal-gnome-output]');
  if (!String(whoamiOut).includes(whoamiUser)) {
    errors.push(`Te4 : sortie whoami ${whoamiUser} attendue, obtenu « ${whoamiOut?.slice(-40)} »`);
  }
  await submitCommand(page, 'help');
  ds = await readTerminalDataset(page);
  if (ds.terminalGnomeLastCommand !== 'help') {
    errors.push(`Te4 : help enregistré attendu, obtenu « ${ds.terminalGnomeLastCommand} »`);
  }
  const helpLines = await page.locator('[data-terminal-gnome-output] .capsule-terminal__line').count();
  if (helpLines < 1) {
    errors.push('Te4 : sortie help absente');
  }
};

const SCENARIOS = {
  Te1: scenarioTe1,
  Te2: scenarioTe2,
  Te3: scenarioTe3,
  Te4: scenarioTe4,
};

const smokeMintAntiRegression = async (page, errors) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('terminal');
    }
  });
  await sleep(page, 900);
  const state = await page.evaluate(() => {
    const win = document.querySelector('.windowElement[data-link="terminal"]');
    const toolbar = document.querySelector('[data-konsole-toolbar]');
    const root = document.querySelector('[data-terminal-gnome-root]');
    return {
      bodyId: document.body.id,
      konsoleToolbar: !!toolbar,
      noFedoraClass: !(win && win.classList.contains('terminal-window--fedora')),
      gnomeDatasetInit: root && root.dataset.terminalGnomeInit === 'true',
      ptyxisProvider: root && root.dataset.ptyxisGnomeProvider === 'ptyxis-gnome',
    };
  });
  if (state.bodyId !== 'mint') {
    errors.push(`Mint : body#mint attendu, obtenu « ${state.bodyId} »`);
  }
  if (!state.konsoleToolbar) {
    errors.push('Mint : barre Konsole data-konsole-toolbar attendue');
  }
  if (!state.noFedoraClass) {
    errors.push('Mint : classe terminal-window--fedora interdite sur Mint');
  }
  if (state.gnomeDatasetInit || state.ptyxisProvider) {
    errors.push('Mint : dataset Ptyxis GNOME actif (fuite chrome Alma/Rocky)');
  }
};

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) {
    console.error('✗ CAPSULE_HTTP_BASE requis');
    process.exit(1);
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    ...(defaultChrome ? { executablePath: defaultChrome } : {}),
  });

  const url = resolveCapsuleOsUrl(opts.id, base);
  const errors = [];

  if (CINNAMON_PROFILES.has(opts.id)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
      await smokeMintAntiRegression(page, errors);
    } catch (err) {
      errors.push(`Mint anti-régression : ${err.message}`);
    } finally {
      await page.close();
    }
  } else if (!GNOME_PROFILES.has(opts.id)) {
    errors.push(`${opts.id} : profil non supporté (GNOME ou Mint attendu)`);
  } else {
    const runList = opts.scenario ? [opts.scenario] : Object.keys(SCENARIOS);
    for (const scenarioId of runList) {
      const fn = SCENARIOS[scenarioId];
      if (!fn) {
        errors.push(`${scenarioId} : scénario inconnu`);
        continue;
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
        if (scenarioId === 'Te1') {
          await fn(page, errors, opts.id);
        } else {
          await fn(page, errors, opts.id);
        }
        if (!errors.some((e) => e.startsWith(scenarioId))) {
          process.stdout.write(`  ✓ ${scenarioId}\n`);
        }
      } catch (err) {
        errors.push(`${scenarioId} : ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  if (errors.length) {
    console.error(`smoke-gnome-terminal-scenarios ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  if (CINNAMON_PROFILES.has(opts.id)) {
    console.log(`✓ smoke-gnome-terminal-scenarios ${opts.id} OK — anti-régression Terminal Konsole`);
  } else {
    const count = opts.scenario ? 1 : Object.keys(SCENARIOS).length;
    console.log(`✓ smoke-gnome-terminal-scenarios ${opts.id} OK — ${count} scénario(s) P0`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
