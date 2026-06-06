#!/usr/bin/env node
/**
 * Smoke runtime apps P0 — ouverture slot via façade OS (couche 2, miroir gsettings Playwright).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-apps-interactions.mjs --id linux-rocky
 */
import fs from 'fs';
import { buildCatalog } from './apps-catalog-lib.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const main = async () => {
  const opts = parseArgs();
  const base = process.env.CAPSULE_HTTP_BASE || '';
  if (!base) {
    console.log('○ smoke-apps-interactions ignoré — CAPSULE_HTTP_BASE non défini');
    return;
  }

  const catalog = buildCatalog(opts.id);
  const p0Slots = catalog.rows
    .filter((r) => r.priorite === 'P0' && r.statut === 'ok' && r.slotCapsule && r.onVm !== false)
    .map((r) => ({ slot: r.slotCapsule, label: r.labelFr }));

  const errors = [];
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('✗ Playwright indisponible');
    process.exit(1);
  }

  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = resolveCapsuleOsUrl(opts.id, base);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });

    for (const { slot, label } of p0Slots) {
      const result = await page.evaluate(async (slotId) => {
        if (typeof window.openWindowByDataLink === 'function') {
          window.openWindowByDataLink(slotId);
        }
        await new Promise((r) => setTimeout(r, 600));
        const el = document.querySelector(`[data-link="${slotId}"].windowElement, #${slotId}`);
        const active = document.querySelector(`[data-link="${slotId}"].windowElementActive, #${slotId}.windowElementActive`);
        const body = el?.querySelector(
          '.windowElementContent, .nautilus-app, main, .gnome-calc, .capsule-terminal-shell, #terminalContainer, .firefox-chrome',
        );
        const loadErr = (el?.textContent || '').includes('Impossible de charger');
        return {
          hasSlot: !!el,
          active: !!active,
          hasContent: !!body,
          loadErr,
        };
      }, slot);

      if (result.loadErr) errors.push(`${label} (${slot}) : chargement embed échoué`);
      else if (!result.hasSlot) errors.push(`${label} (${slot}) : fenêtre slot absente`);
      else if (!result.hasContent) {
        errors.push(`${label} (${slot}) : contenu applicatif non détecté`);
      }
    }
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.error(`smoke-apps-interactions ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-apps-interactions ${opts.id} OK — ${p0Slots.length} slot(s) P0 (${url})`);
};

main();
