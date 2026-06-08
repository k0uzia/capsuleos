#!/usr/bin/env node
/**
 * Passe effets d'état UI — shell (menu/panel/desktop) + apps déclarées.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --shell mainMenu,panel,desktop --write
 *   node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --apps nemo,calculator
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  loadParityIndex,
  saveParityIndex,
  updateShellParity,
  dimensionScoresFromChecks,
  computePiApp,
  parityStatus,
} from './parity-index-lib.mjs';
import { chromePath, openMintMainMenu, openMintSlot, waitMintReady } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const tools = path.join(ROOT, 'usr/lib/capsuleos/tools');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = {
    apps: null,
    shell: null,
    id: 'linux-mint',
    write: false,
    json: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--apps' && args[i + 1]) opts.apps = args[++i].split(',');
    else if (a === '--shell' && args[i + 1]) opts.shell = args[++i].split(',');
    else if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--write') opts.write = true;
    else if (a === '--json') opts.json = true;
  }
  return opts;
};

const run = (rel, extraArgs) => {
  const script = path.join(ROOT, rel);
  const res = spawnSync('node', [script, ...(extraArgs || [])], {
    encoding: 'utf8',
    cwd: ROOT,
    timeout: 120000,
  });
  return {
    script: rel,
    ok: res.status === 0,
    status: res.status,
    stderr: (res.stderr || '').trim().slice(0, 400),
  };
};

async function runShellChecks(page, surfaces) {
  const report = { surfaces: {} };

  for (const surface of surfaces) {
    const checks = [];
    const push = (id, dimension, pass, detail) => {
      checks.push({ id, dimension, pass, detail });
    };

    if (surface === 'mainMenu') {
      await openMintMainMenu(page);
      await page.waitForTimeout(50);
      const open = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        const r = m ? m.getBoundingClientRect() : null;
        const footer = document.querySelector('footer')?.getBoundingClientRect();
        return {
          display: m ? getComputedStyle(m).display : 'none',
          hasRoot: !!m?.querySelector('.menu-root'),
          aboveFooter: r && footer ? r.bottom <= footer.top + 4 : false,
        };
      });
      push('menu-open', 'nav', open.display !== 'none' && open.hasRoot, open);
      const layout = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        const r = m ? m.getBoundingClientRect() : null;
        return {
          width: r ? Math.round(r.width) : 0,
          hasRoot: !!m?.querySelector('.menu-root'),
        };
      });
      push('menu-layout', 'vis', layout.width >= 320 && layout.hasRoot, layout);

      await page.fill('#menu-search', 'Firefox');
      await page.waitForTimeout(80);
      const search = await page.evaluate(() => (
        document.querySelectorAll('#menu-app-list .menu-app-item:not(.is-unavailable)').length >= 1
      ));
      push('menu-search', 'int', search, {});
      push('menu-data', 'data', search, {});

      await page.keyboard.press('Escape');
      await page.waitForTimeout(40);
      const kb = await page.evaluate(() => {
        const m = document.getElementById('mainMenu');
        return m && getComputedStyle(m).display === 'none';
      });
      push('menu-kb', 'kb', kb, {});
    }

    if (surface === 'panel') {
      await openMintSlot(page, 'nemo');
      await page.waitForFunction(() => {
        if (window.CapsuleTaskbarWindowList && typeof window.CapsuleTaskbarWindowList.refresh === 'function') {
          window.CapsuleTaskbarWindowList.refresh();
        }
        return document.querySelectorAll('#taskbar-window-list .taskbar-window-list__btn').length >= 1;
      }, null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(80);
      const list = await page.evaluate(() => {
        const links = document.querySelectorAll('#taskbar-window-list .taskbar-window-list__btn');
        const nemo = document.querySelector('#taskbar-window-list .taskbar-window-list__btn[data-window-link="nemo"]');
        return {
          count: links.length,
          nemoActive: nemo ? nemo.classList.contains('is-active') : false,
        };
      });
      push('window-list', 'nav', list.count >= 1, list);
      push('panel-vis', 'vis', list.nemoActive, list);

      const nemoLink = await page.$('#taskbar-window-list .taskbar-window-list__btn[data-window-link="nemo"]');
      if (nemoLink) {
        await nemoLink.click();
        await page.waitForTimeout(60);
      }
      const focus = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        return win && win.style.display !== 'none';
      });
      push('panel-focus', 'int', focus, {});
      push('panel-data', 'data', list.count >= 1, list);
    }

    if (surface === 'desktop') {
      const shortcuts = await page.evaluate(() => (
        document.querySelectorAll('#desktop > .desktop-shortcuts .desktop-shortcut').length >= 2
      ));
      push('desktop-shortcuts', 'int', shortcuts, {});
      push('desktop-vis', 'vis', shortcuts, {});

      await page.evaluate(() => {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 920,
          clientY: 420,
        });
        desktop.dispatchEvent(event);
      });
      await page.waitForTimeout(80);
      const ctx = await page.evaluate(() => {
        const menu = document.getElementById('desktop-context-menu');
        return menu && !menu.hidden && !menu.hasAttribute('hidden');
      });
      push('desktop-ctx', 'ctx', ctx, {});

      await page.keyboard.press('Escape');
      await page.waitForTimeout(40);
      const kb = await page.evaluate(() => {
        const menu = document.getElementById('desktop-context-menu');
        return menu && menu.hasAttribute('hidden');
      });
      push('desktop-kb', 'kb', kb, {});
      push('desktop-data', 'data', shortcuts, {});
    }

    const dims = dimensionScoresFromChecks(checks);
    ['vis', 'nav', 'int', 'ctx', 'kb', 'data'].forEach((d) => {
      if (dims[d] === null || dims[d] === undefined) dims[d] = 50;
    });
    report.surfaces[surface] = {
      pi: computePiApp(dims),
      status: parityStatus(computePiApp(dims)),
      dimensions: dims,
      checks,
    };
  }

  return report;
}

const main = async () => {
  const opts = parseArgs();
  const results = [];

  if (opts.shell && opts.shell.length) {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage();
    await waitMintReady(page);
    const shellReport = await runShellChecks(page, opts.shell);
    await browser.close();

    if (opts.write) {
      let index = loadParityIndex(opts.id);
      if (index) {
        Object.entries(shellReport.surfaces).forEach(([surface, data]) => {
          updateShellParity(index, surface, {
            dimensions: data.dimensions,
            pi: data.pi,
            status: data.status,
            lastPass: new Date().toISOString(),
            checksPassed: data.checks.filter((c) => c.pass).length,
            checksTotal: data.checks.length,
          });
        });
        const out = saveParityIndex(opts.id, index);
        shellReport.indexWritten = out.replace(`${ROOT}/`, '');
        shellReport.pi_global = index.pi_global;
      }
    }

    results.push({ name: 'shell-parity', ok: Object.values(shellReport.surfaces).every((s) => s.checks.every((c) => c.pass)), shellReport });
  }

  const steps = [
    { name: 'validate-window-side-effects', run: () => run('usr/lib/capsuleos/tools/validate-window-side-effects.mjs') },
    { name: 'smoke-mint-interaction', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-interaction.mjs') },
    { name: 'smoke-mint-window-chrome-parity', run: () => run('usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs') },
  ];

  const appSlots = opts.apps || [];
  appSlots.forEach((slot) => {
    const smokeName = slot === 'text_editor' ? 'text-editor' : slot.replace(/_/g, '-');
    steps.push({
      name: `smoke-${slot}`,
      run: () => run(`usr/lib/capsuleos/tools/lab/smoke-mint-${smokeName}.mjs`),
    });
    steps.push({
      name: `parity-${slot}`,
      run: () => run('usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs', ['--id', 'linux-mint', '--slot', slot, '--json']),
    });
  });

  if (steps.length) {
    results.push(...steps.map((s) => ({ name: s.name, ...s.run() })));
  }

  const failed = results.filter((r) => !r.ok);
  if (opts.json) {
    console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  } else {
    results.forEach((r) => {
      if (r.shellReport) {
        Object.entries(r.shellReport.surfaces).forEach(([s, d]) => {
          console.log(`${s}: Π=${d.pi} (${d.status})`);
        });
        if (r.shellReport.pi_global) console.log(`Π_global=${r.shellReport.pi_global}`);
      } else {
        console.log(`${r.name}: ${r.ok ? 'OK' : 'FAIL'}`);
      }
    });
  }
  process.exit(failed.length ? 1 : 0);
};

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
