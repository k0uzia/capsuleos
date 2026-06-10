#!/usr/bin/env node
/**
 * Smoke GNOME Software — navigation multi-vues (explore, updates, installed, detail, category, search).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-software-views.mjs --id linux-alma
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const errors = [];

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = resolveCapsuleOsUrl(opts.id, base);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate(() => window.openWindowByDataLink('update_manager'));
    await page.waitForSelector('.windowElement[data-link="update_manager"]', { state: 'visible', timeout: 15000 });

    const checks = [
      { id: 'explore-grid', fn: () => page.$('.gnome-software__grid .gnome-software__card') },
      { id: 'updates-nav', fn: async () => {
        await page.click('[data-um-gnome-nav="updates"]');
        await page.waitForSelector('[data-um-gnome-pane="updates"]:not([hidden])');
        return page.$('.gnome-software__update-row');
      } },
      { id: 'installed-nav', fn: async () => {
        await page.click('[data-um-gnome-nav="installed"]');
        await page.waitForSelector('[data-um-gnome-pane="installed"]:not([hidden])');
        return page.$('.gnome-software__update-row--installed');
      } },
      { id: 'detail-firefox', fn: async () => {
        await page.click('[data-um-gnome-nav="explore"]');
        await page.click('[data-um-gnome-app="firefox"]');
        await page.waitForSelector('[data-um-gnome-pane="detail"]:not([hidden])');
        return page.$('[data-um-gnome-detail-title]');
      } },
      { id: 'category-productivity', fn: async () => {
        await page.click('[data-um-gnome-nav="explore"]');
        await page.click('[data-um-gnome-category="productivity"]');
        await page.waitForSelector('[data-um-gnome-pane="category"]:not([hidden])');
        return page.$('[data-um-gnome-category-grid] .gnome-software__card');
      } },
      { id: 'search-firefox', fn: async () => {
        await page.click('[data-um-gnome-nav="explore"]');
        await page.fill('[data-um-gnome-search]', 'firefox');
        await page.waitForSelector('[data-um-gnome-pane="search"]:not([hidden])');
        return page.$('[data-um-gnome-search-grid] .gnome-software__card');
      } },
      { id: 'updates-empty-state', fn: async () => {
        await page.evaluate(() => {
          const root = document.getElementById('updateManagerApp');
          root?.querySelector('[data-um-gnome-nav="updates"]')?.click();
        });
        await page.waitForFunction(
          () => document.getElementById('updateManagerApp')?.dataset?.umGnomeView === 'updates',
          null,
          { timeout: 5000 },
        );
        return page.$('[data-um-gnome-updates-list] .gnome-software__update-row');
      } },
    ];

    for (const check of checks) {
      const el = await check.fn();
      const text = el ? await el.textContent().catch(() => 'ok') : null;
      if (!el) {
        errors.push(`${check.id} : élément attendu absent`);
      } else if (check.id === 'detail-firefox' && !String(text).includes('Firefox')) {
        errors.push('detail-firefox : titre incorrect');
      }
    }
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.error(`smoke-gnome-software-views ${opts.id} — échec`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-gnome-software-views ${opts.id} OK — 7 vérifications`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
