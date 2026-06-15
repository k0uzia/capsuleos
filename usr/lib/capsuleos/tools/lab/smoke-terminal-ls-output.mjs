#!/usr/bin/env node
/**
 * Smoke To — listing ls multi-colonnes (noyau partagé CapsuleTerminalListing).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-terminal-ls-output.mjs
 *   ... --id linux-rocky
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const DEFAULT_PROFILES = [
  'linux-mint',
  'linux-rocky',
  'linux-ubuntu',
  'linux-kde-neon',
  'linux-elementary',
  'linux-fedora',
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { ids: [...DEFAULT_PROFILES] };
  for (let i = 0; i < args.length; i += 1) {
    if ((args[i] === '--id' || args[i] === '--profile') && args[i + 1]) {
      opts.ids = [args[++i]];
    }
  }
  return opts;
};

const errors = [];

const runExecutorLs = async (page) => page.evaluate(async () => {
  const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
  let fs = baseFs;
  if (window.CapsuleVirtualShell?.prepareTerminalFilesystem) {
    const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
    fs = hydration.fs || baseFs;
  }
  const home = window.CAPSULE_TERMINAL_HOME
    || window.CapsuleExplorerVfs?.getTerminalLogicalHome?.()
    || '/home/public';
  const state = {
    cwd: home,
    home,
    user: window.CAPSULE_TERMINAL_USER || 'capsule',
    host: window.CAPSULE_TERMINAL_HOST || 'host',
    fs,
    fileContents: {},
    fileHrefs: {},
    history: [],
  };
  const helpers = {
    resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
    formatPrompt: () => '',
    normalizePath: window.CapsuleTerminal.normalizePath,
  };
  return window.executeTerminalCommand(state, 'ls', helpers);
});

const runBrowserLs = async (page) => {
  await page.evaluate(() => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('terminal');
    }
  });
  await page.waitForFunction(
    () => document.querySelector('.windowElement[data-link="terminal"] [data-terminal-app]'),
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(600);
  await page.fill('[data-terminal-command], #command', 'ls');
  await page.press('[data-terminal-command], #command', 'Enter');
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.capsule-terminal__line--listing')];
    const codes = rows.map((row) => row.querySelector('code')).filter(Boolean);
    const spans = [...document.querySelectorAll('.capsule-terminal__line--listing span')];
    const hasScrollbars = codes.some((code) => {
      const cs = getComputedStyle(code);
      return cs.overflowX === 'auto' || cs.overflowX === 'scroll';
    });
    const rowDivs = [...document.querySelectorAll('.capsule-terminal__line--listing')];
    const perRowCounts = rowDivs.map((row) => row.querySelectorAll('span').length);
    const concatenated = rowDivs.some((row) => {
      const spans = [...row.querySelectorAll('span')];
      if (spans.length <= 1) {
        return false;
      }
      for (let i = 0; i < spans.length - 1; i += 1) {
        if (spans[i + 1].getBoundingClientRect().left < spans[i].getBoundingClientRect().right - 2) {
          return true;
        }
      }
      return false;
    });
    return {
      rowCount: rowDivs.length,
      spanCount: spans.length,
      perRowCounts,
      concatenated,
      hasScrollbars,
      hasListingModule: typeof window.CapsuleTerminalListing !== 'undefined',
    };
  });
};

const auditProfile = async (browser, registryId) => {
  const url = resolveCapsuleOsUrl(registryId, BASE);
  const page = await browser.newPage({ viewport: { width: 760, height: 420 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    const exec = await runExecutorLs(page);
    if (!exec.listing) {
      errors.push(`${registryId}: ls listing=false (attendu true)`);
    }
    if (!exec.listingColumnWidth || exec.listingColumnWidth < 8) {
      errors.push(`${registryId}: listingColumnWidth invalide (${exec.listingColumnWidth})`);
    }
    if (!Array.isArray(exec.lines) || exec.lines.length < 1) {
      errors.push(`${registryId}: lines ls vides`);
    }
    const browserOut = await runBrowserLs(page);
    if (!browserOut.hasListingModule) {
      errors.push(`${registryId}: CapsuleTerminalListing absent`);
    }
    if (browserOut.rowCount < 1) {
      errors.push(`${registryId}: aucune ligne listing DOM`);
    }
    if (browserOut.spanCount < 4) {
      errors.push(`${registryId}: spans listing insuffisants (${browserOut.spanCount})`);
    }
    if (browserOut.hasScrollbars) {
      errors.push(`${registryId}: barres de défilement horizontales sur listing ls`);
    }
    if (browserOut.concatenated) {
      errors.push(`${registryId}: noms ls superposés ou collés (chevauchement)`);
    }
    const maxPerRow = Math.max(...browserOut.perRowCounts, 0);
    if (maxPerRow > 5) {
      errors.push(`${registryId}: plus de 5 colonnes sur une rangée (${maxPerRow})`);
    }
    if (browserOut.perRowCounts.length > 1) {
      const midSingleton = browserOut.perRowCounts
        .slice(0, -1)
        .some((count) => count === 1);
      if (midSingleton) {
        errors.push(`${registryId}: grille irrégulière (${browserOut.perRowCounts.join(',')})`);
      }
    }
  } finally {
    await page.close();
  }
};

const opts = parseArgs();
const browser = await chromium.launch({ headless: true });
try {
  for (const id of opts.ids) {
    await auditProfile(browser, id);
  }
} finally {
  await browser.close();
}

if (errors.length) {
  console.error(`✗ smoke-terminal-ls-output — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`✓ smoke-terminal-ls-output OK — ${opts.ids.join(', ')} (To₁ listing partagé)`);
