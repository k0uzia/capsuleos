#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Smoke portail — panneau a11y, persistance localStorage, data-contrast-mode.
 * Prérequis : CAPSULE_HTTP_BASE ou serveur local sur le port lab.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:9876 node usr/lib/capsuleos/tools/lab/smoke-a11y-portal.mjs
 */
import { chromium } from 'playwright';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:9876').replace(/\/$/, '');
const PORTAL_URL = `${BASE}/index.html`;

const STORAGE_KEYS = [
  'mint-contrast-mode',
  'mint-font-scale',
  'capsule-reduced-motion',
  'capsule-underline-links',
];

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 45000 });

  const toggle = page.locator('#header-a11y-toggle');
  if (!(await toggle.count())) {
    errors.push('Bouton #header-a11y-toggle absent');
  } else {
    await toggle.click();
    const panel = page.locator('#a11y-panel');
    if (await panel.isHidden()) {
      errors.push('Panneau #a11y-panel reste hidden après clic');
    }
  }

  await page.locator('#a11y-contrast').check();
  await page.locator('[data-a11y-font-scale="125"]').click();
  await page.locator('#a11y-reduced-motion').check();

  const state = await page.evaluate((keys) => {
    const storage = {};
    keys.forEach((key) => {
      storage[key] = localStorage.getItem(key);
    });
    const root = document.documentElement;
    return {
      storage,
      contrastMode: root.dataset.contrastMode || null,
      fontScale: root.dataset.fontScale || null,
      reducedMotion: root.dataset.reducedMotion || null,
    };
  }, STORAGE_KEYS);

  if (state.storage['mint-contrast-mode'] !== 'high') {
    errors.push(`localStorage mint-contrast-mode attendu "high", reçu "${state.storage['mint-contrast-mode']}"`);
  }
  if (state.storage['mint-font-scale'] !== '125') {
    errors.push(`localStorage mint-font-scale attendu "125", reçu "${state.storage['mint-font-scale']}"`);
  }
  if (state.storage['capsule-reduced-motion'] !== 'on') {
    errors.push(`localStorage capsule-reduced-motion attendu "on", reçu "${state.storage['capsule-reduced-motion']}"`);
  }
  if (state.contrastMode !== 'high') {
    errors.push(`html[data-contrast-mode] attendu "high", reçu "${state.contrastMode}"`);
  }
  if (state.fontScale !== '125') {
    errors.push(`html[data-font-scale] attendu "125", reçu "${state.fontScale}"`);
  }
  if (state.reducedMotion !== 'on') {
    errors.push(`html[data-reduced-motion] attendu "on", reçu "${state.reducedMotion}"`);
  }
} catch (err) {
  errors.push(err.message || String(err));
} finally {
  await browser.close();
}

if (errors.length) {
  console.error('smoke-a11y-portal — échec');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ smoke-a11y-portal OK — panneau, localStorage et data-contrast-mode');
