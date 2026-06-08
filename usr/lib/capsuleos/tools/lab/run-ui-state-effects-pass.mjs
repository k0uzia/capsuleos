#!/usr/bin/env node
/**
 * Passe VΣ — burst Capsule (Playwright) + smokes shell + VM SSH optionnel.
 * Met à jour capsuleMatch (partial → ok) dans la matrice Mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint --write
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint --write --vm-burst
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { runSshCommand, loadHost } from './lab-ssh.mjs';
import {
  loadMatrix,
  writeMatrix,
  refreshPredicates,
  validateMatrixReport,
  registryMatrixPath,
} from './ui-state-effects-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', write: false, vmBurst: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--vm-burst') opts.vmBurst = true;
  }
  return opts;
};

const mintUrl = () => process.env.CAPSULE_MINT_URL
  || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';

const chromePath = () => process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const runSmoke = (name) => {
  const script = path.join(__dirname, name);
  if (!fs.existsSync(script)) {
    return { ok: false, note: 'script absent' };
  }
  const res = spawnSync('node', [script], {
    encoding: 'utf8',
    timeout: 120000,
    env: Object.assign({}, process.env, { CAPSULE_MINT_URL: mintUrl() }),
  });
  return {
    ok: res.status === 0,
    note: res.status === 0 ? 'smoke OK' : (res.stderr || res.stdout || '').slice(0, 200),
  };
};

const runVmBurst = (registryId) => {
  try {
    const host = loadHost(registryId);
    const out = runSshCommand(host, 'bash -lc "wmctrl -lx 2>/dev/null | head -3; echo VM_BURST_OK"');
    return {
      ok: (out.stdout || '').indexOf('VM_BURST_OK') !== -1,
      at: new Date().toISOString(),
      sample: (out.stdout || '').split('\n').slice(0, 3).join(' | '),
    };
  } catch (err) {
    return { ok: false, at: new Date().toISOString(), error: String(err.message || err) };
  }
};

const SURFACE_RUNNERS = {
  'shell.panel.menu': async (page) => {
    await page.click('footer nav a[data-link="mainMenu"]');
    await page.waitForSelector('#mainMenu .menu-root', { state: 'visible', timeout: 8000 });
    return page.evaluate(() => {
      const m = document.getElementById('mainMenu');
      return m && getComputedStyle(m).display !== 'none' && !!m.querySelector('.menu-root');
    });
  },
  'shell.panel.grouped-window-list': async (page) => {
    await page.evaluate(() => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink('nemo');
      }
    });
    await page.waitForTimeout(120);
    const count = await page.evaluate(() => (
      document.querySelectorAll('#taskbar-window-list .taskbar-window-list__btn').length
    ));
    return count > 0;
  },
  'shell.tray.favorites': async (page) => page.evaluate(() => {
    const el = document.getElementById('mint-tray-favorites');
    return !!(el && el.querySelector('a, button'));
  }),
  'shell.tray.network': async (page) => {
    await page.click('#tray-btn-network');
    await page.waitForTimeout(80);
    const ok = await page.evaluate(() => {
      const btn = document.getElementById('tray-btn-network');
      const pop = document.getElementById('mint-tray-popover-network');
      return btn && btn.getAttribute('aria-expanded') === 'true'
        && pop && !pop.hasAttribute('hidden');
    });
    await page.keyboard.press('Escape');
    return ok;
  },
  'shell.tray.volume': async (page) => {
    await page.click('#tray-sound-btn');
    await page.waitForTimeout(80);
    const ok = await page.evaluate(() => {
      const pop = document.getElementById('volume-popover');
      return pop && !pop.hasAttribute('hidden');
    });
    await page.keyboard.press('Escape');
    return ok;
  },
  'shell.tray.calendar': async (page) => {
    await page.click('#taskbar-clock-trigger');
    await page.waitForTimeout(80);
    const ok = await page.evaluate(() => {
      const pop = document.getElementById('taskbar-calendar-popover');
      const btn = document.getElementById('taskbar-clock-trigger');
      return pop && !pop.hasAttribute('hidden')
        && btn && btn.getAttribute('aria-expanded') === 'true';
    });
    await page.keyboard.press('Escape');
    return ok;
  },
  'shell.window.muffin': async (page) => {
    await page.evaluate(() => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink('nemo');
      }
    });
    await page.waitForTimeout(100);
    const before = await page.evaluate(() => {
      const n = document.querySelector('div[data-link="nemo"]');
      return { left: n ? n.style.left : '', top: n ? n.style.top : '' };
    });
    const header = page.locator('div[data-link="nemo"] #windowHeader');
    const box = await header.boundingBox();
    if (!box) {
      return false;
    }
    await page.mouse.move(box.x + 30, box.y + 8);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 50, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(40);
    const after = await page.evaluate(() => {
      const n = document.querySelector('div[data-link="nemo"]');
      return { left: n ? n.style.left : '', top: n ? n.style.top : '' };
    });
    return before.left !== after.left || before.top !== after.top;
  },
  'shell.alt-tab': async (page) => {
    await page.evaluate(() => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink('nemo');
      }
    });
    await page.waitForTimeout(100);
    await page.keyboard.down('Alt');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120);
    const visible = await page.evaluate(() => {
      const el = document.getElementById('cinnamon-alt-tab');
      return el && getComputedStyle(el).display !== 'none';
    });
    await page.keyboard.up('Alt');
    return visible;
  },
};

const validateSurfaces = async (surfaces) => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath() });
  const page = await browser.newPage();
  await page.goto(mintUrl(), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.openWindowByDataLink === 'function',
    null,
    { timeout: 60000 },
  );

  const results = [];
  for (let si = 0; si < surfaces.length; si += 1) {
    const surface = surfaces[si];
    const runner = SURFACE_RUNNERS[surface.id];
    let ok = false;
    let note = 'no-runner';
    if (runner) {
      try {
        ok = await runner(page);
        note = ok ? 'playwright OK' : 'playwright fail';
      } catch (err) {
        note = String(err.message || err).slice(0, 120);
      }
    } else if (surface.capsuleSelector) {
      ok = await page.evaluate((sel) => !!document.querySelector(sel), surface.capsuleSelector);
      note = ok ? 'selector present' : 'selector absent';
    }
    results.push({ id: surface.id, ok, note });
    surface.capsuleMatch = ok ? 'ok' : 'partial';
    surface.capsuleValidatedAt = new Date().toISOString();
  }

  await browser.close();
  return results;
};

const main = async () => {
  const opts = parseArgs();
  const matrix = loadMatrix(opts.id);
  const traySmoke = runSmoke('smoke-mint-tray.mjs');
  const interactionSmoke = runSmoke('smoke-mint-interaction.mjs');
  const vmBurst = opts.vmBurst ? runVmBurst(opts.id) : matrix.burst?.vm || null;

  const surfaceResults = await validateSurfaces(matrix.surfaces || []);
  const burstMeta = { tray: traySmoke, interaction: interactionSmoke, vm: vmBurst, surfaceResults };
  refreshPredicates(matrix, burstMeta);
  matrix.generatedAt = new Date().toISOString();
  matrix.burst = burstMeta;

  const report = validateMatrixReport(opts.id, matrix);

  if (opts.write) {
    writeMatrix(opts.id, matrix);
    process.stdout.write(`OK ${registryMatrixPath(opts.id)}\n`);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  const exitOk = report.closed && traySmoke.ok && interactionSmoke.ok;
  process.exit(exitOk ? 0 : 1);
};

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
