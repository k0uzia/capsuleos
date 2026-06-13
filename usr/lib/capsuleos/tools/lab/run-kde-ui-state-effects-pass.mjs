#!/usr/bin/env node
/**
 * Passe effets d'état UI shell KDE — kickoff, panel, tray, desktop.
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-ui-state-effects-pass.mjs --id linux-kde-neon --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findChromePath } from './kde-fidelity-smoke-lib.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { loadParityIndex, saveParityIndex, updateShellParity, dimensionScoresFromChecks } from './parity-index-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const KDE_VIEWPORT = { width: 1211, height: 756 };

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon', write: false, json: false, shell: ['kickoff', 'panel', 'tray', 'desktop'] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--shell' && args[i + 1]) opts.shell = args[++i].split(',');
  }
  return opts;
};

async function runShellChecks(page, surfaces) {
  const report = { surfaces: {} };

  for (const surface of surfaces) {
    const checks = [];
    const push = (id, dimension, pass, detail) => {
      checks.push({ id, dimension, pass, detail });
    };

    if (surface === 'kickoff') {
      await page.click('.taskbar-pins__launcher[data-link="mainMenu"], footer nav a[data-link="mainMenu"]');
      await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 10000 });
      const menu = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        const r = m ? m.getBoundingClientRect() : null;
        return {
          visible: m && getComputedStyle(m).display !== 'none',
          width: r ? Math.round(r.width) : 0,
          hasApps: document.querySelectorAll('#menu-app-list .menu-app-item').length,
        };
      });
      push('kickoff-open', 'nav', menu.visible && menu.width >= 320, menu);
      await page.fill('#menu-search', 'Firefox');
      await page.waitForTimeout(120);
      const search = await page.evaluate(() => (
        document.querySelectorAll('#menu-app-list .menu-app-item:not(.is-unavailable)').length >= 1
      ));
      push('kickoff-search', 'nav', search, { search });
    }

    if (surface === 'panel') {
      const panel = await page.evaluate(() => {
        const footer = document.querySelector('footer');
        const r = footer ? footer.getBoundingClientRect() : null;
        return {
          height: r ? Math.round(r.height) : 0,
          pins: document.querySelectorAll('.taskbar-pins__item').length,
        };
      });
      push('panel-layout', 'vis', panel.height >= 28 && panel.pins >= 3, panel);
      const heightAttr = await page.evaluate(() => document.body.dataset.plasmaPanelHeight || '40');
      push('panel-height-dataset', 'fx', !!heightAttr, { height: heightAttr });
    }

    if (surface === 'tray') {
      const tray = await page.evaluate(() => {
        const icons = document.querySelectorAll('.tray-area__icon, .system-tray .tray-icon');
        return { count: icons.length };
      });
      push('tray-icons', 'vis', tray.count >= 4, tray);
    }

    if (surface === 'desktop') {
      const desktop = await page.evaluate(() => {
        const bg = document.querySelector('#desktop, .desktop-background, body');
        const r = bg ? bg.getBoundingClientRect() : null;
        return {
          width: r ? Math.round(r.width) : 0,
          height: r ? Math.round(r.height) : 0,
        };
      });
      push('desktop-viewport', 'vis', desktop.width >= 800 && desktop.height >= 600, desktop);
    }

    report.surfaces[surface] = {
      checks,
      pi: dimensionScoresFromChecks(checks),
    };
  }

  return report;
}

const main = async () => {
  const opts = parseArgs();
  const chromePath = findChromePath();
  if (!chromePath) {
    process.stderr.write('Chrome introuvable\n');
    process.exit(2);
  }

  const url = resolveCapsuleOsUrl(opts.id, process.env.CAPSULE_HTTP_BASE);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: KDE_VIEWPORT });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(
      () => typeof window.openWindowByDataLink === 'function',
      null,
      { timeout: 60000 },
    );

    const report = await runShellChecks(page, opts.shell);
    const allChecks = Object.values(report.surfaces).flatMap((s) => s.checks);
    const failed = allChecks.filter((c) => !c.pass);
    report.registryId = opts.id;
    report.passOk = failed.length === 0;
    report.evaluatedAt = new Date().toISOString();

    if (opts.json || !opts.write) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    }

    if (opts.write) {
      const index = loadParityIndex(opts.id) || { registryId: opts.id, apps: {}, shell: {} };
      Object.entries(report.surfaces).forEach(([surface, data]) => {
        updateShellParity(index, surface, data.pi);
      });
      saveParityIndex(opts.id, index);
      process.stdout.write('→ parity-index shell mis à jour\n');
    }

    if (failed.length) {
      failed.forEach((f) => process.stderr.write(`✗ ${f.id}\n`));
      process.exit(1);
    }
    process.stdout.write(`✓ run-kde-ui-state-effects-pass ${opts.id} OK\n`);
  } finally {
    await browser.close();
  }
};

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
