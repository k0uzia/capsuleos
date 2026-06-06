#!/usr/bin/env node
/**
 * Smoke rendu façade pick-os Rocky — polices, profil, base href (Playwright).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-os-facade-rocky.mjs
 */
import fs from 'fs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const errors = [];

async function main() {
  const base = process.env.CAPSULE_HTTP_BASE || '';
  if (!base) {
    console.log('○ smoke-os-facade-rocky ignoré — CAPSULE_HTTP_BASE non défini');
    return;
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    errors.push('Playwright indisponible');
  }

  if (!errors.length) {
    const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
    const browser = await chromium.launch({
      headless: true,
      ...(chromePath ? { executablePath: chromePath } : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const url = resolveCapsuleOsUrl('linux-rocky', base);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      const state = await page.evaluate(() => ({
        profile: window.CAPSULE_SKIN_PROFILE_ID,
        bodyId: document.body?.id,
        base: document.querySelector('base')?.href || null,
        font: getComputedStyle(document.body).fontFamily,
        redHatLoaded: [...document.fonts].some((f) => f.family.includes('Red Hat Text')),
        rockyFontsLink: !!document.querySelector('link[href*="rocky-fonts"]'),
      }));

      if (state.profile !== 'linux-rocky') errors.push(`CAPSULE_SKIN_PROFILE_ID=${state.profile}`);
      if (state.bodyId !== 'rocky') errors.push(`body#${state.bodyId} au lieu de body#rocky`);
      if (!state.base?.includes('/home/RedHat/Rocky/')) errors.push(`base href inattendu: ${state.base}`);
      if (!state.font.includes('Red Hat Text')) errors.push(`font-family: ${state.font}`);
      if (!state.redHatLoaded) errors.push('police Red Hat Text non chargée (@font-face)');
      if (!state.rockyFontsLink) errors.push('rocky-fonts.css non lié');
    } finally {
      await browser.close();
    }
  }

  if (errors.length) {
    console.error('smoke-os-facade-rocky — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-os-facade-rocky OK — ${resolveCapsuleOsUrl('linux-rocky', base)}`);
}

main();
