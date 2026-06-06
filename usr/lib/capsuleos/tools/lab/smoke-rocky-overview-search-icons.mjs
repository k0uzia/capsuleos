#!/usr/bin/env node
/**
 * Smoke — icônes recherche Aperçu Rocky résolues via CapsuleResource.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { resolveCapsuleOsUrl, resolveOsFacadeFileUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const url = process.argv[2]
  || (process.env.CAPSULE_HTTP_BASE ? resolveCapsuleOsUrl('linux-rocky') : resolveOsFacadeFileUrl('linux-rocky'));

async function main() {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => typeof window.CapsuleResource !== 'undefined', null, { timeout: 15000 });

        const result = await page.evaluate(() => {
            const catalog = [
                './assets/images/toolkits/gnome/apps/dash/org.gnome.Nautilus.svg',
                './assets/images/toolkits/gnome/apps/firefox.png',
                './assets/images/toolkits/gnome/apps/overview/org.gnome.Settings.svg',
            ];
            return catalog.map((icon) => {
                const resolved = window.CapsuleResource.resolve(icon);
                return { icon, resolved, ok: !resolved.startsWith('./assets/') };
            });
        });

        result.forEach((row) => {
            if (!row.ok) {
                errors.push(`non résolu: ${row.icon}`);
            }
        });

        await page.click('.fedora-overview-trigger');
        await page.fill('[data-overview-search-input]', 'fichiers');
        await page.waitForTimeout(200);

        const imgSrc = await page.$eval('.fedora-overview__search-result img', (img) => img.src);
        if (imgSrc.includes('/Rocky/assets/') || imgSrc.endsWith('/assets/images/')) {
            errors.push(`src recherche invalide: ${imgSrc}`);
        }
    } catch (error) {
        errors.push(error.message);
    } finally {
        await browser.close();
    }

    if (errors.length) {
        console.error('✗ smoke-rocky-overview-search-icons');
        errors.forEach((e) => console.error(' ', e));
        process.exit(1);
    }
    console.log('✓ smoke-rocky-overview-search-icons OK');
}

main();
