#!/usr/bin/env node
/** Captures Capsule GNOME Characters — scénarios Ch1–Ch4. */
import fs from 'fs';
import path from 'path';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-alma' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const sleep = (page, ms) => page.waitForTimeout(ms);
const openCharacters = async (page) => {
  await page.evaluate(() => window.openWindowByDataLink?.('characters'));
  await page.waitForFunction(() => document.getElementById('gnomeCharactersApp')?.dataset.charactersInit === 'true', null, { timeout: 15000 });
  await sleep(page, 200);
};

const SCENARIOS = [
  { file: 'rocky-capsule-dark-characters.png', run: openCharacters },
  { file: 'rocky-capsule-dark-characters-default.png', run: openCharacters },
  { file: 'rocky-capsule-dark-characters-search.png', run: async (page) => { await openCharacters(page); await page.fill('[data-characters-gnome-action="search"]', 'euro'); await sleep(page, 150); } },
  { file: 'rocky-capsule-dark-characters-select.png', run: async (page) => { await openCharacters(page); await page.click('[data-characters-gnome-glyph="©"]'); await sleep(page, 120); } },
  { file: 'rocky-capsule-dark-characters-copy.png', run: async (page) => { await openCharacters(page); await page.click('[data-characters-gnome-action="copy"]'); await sleep(page, 120); } },
];

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || resolveCapsuleHttpBase(opts.id);
  if (!base) { console.error('✗ CAPSULE_HTTP_BASE requis'); process.exit(1); }
  const paths = appsPathsForRegistry(opts.id);
  fs.mkdirSync(paths.capsuleCapturesDir, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, ...(defaultChrome ? { executablePath: defaultChrome } : {}) });
  const url = resolveCapsuleOsUrl(opts.id, base);
  for (const scenario of SCENARIOS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; localStorage.setItem('gnome-theme', 'dark'); });
    await scenario.run(page);
    await page.locator('.windowElement[data-link="characters"]').screenshot({ path: path.join(paths.capsuleCapturesDir, scenario.file) });
    process.stdout.write(`  ✓ ${scenario.file}\n`);
    await page.close();
  }
  await browser.close();
  console.log(`✓ capture-capsule-characters-views ${opts.id} — ${SCENARIOS.length} PNG`);
};

main().catch((err) => { console.error(err); process.exit(1); });
