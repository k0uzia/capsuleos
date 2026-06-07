#!/usr/bin/env node
/**
 * Liste les requêtes HTTP 404 au chargement d’un skin CapsuleOS.
 *
 * Usage :
 *   python3 -m http.server 5500   # à la racine du dépôt
 *   node root/tools/lab/smoke-http-404.mjs --url http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html
 */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const url = urlIdx >= 0 ? args[urlIdx + 1] : 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';

const failures = [];

const main = async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (error) {
        console.error('Playwright indisponible — npm install playwright && npx playwright install chromium');
        process.exit(2);
    }

    const page = await browser.newPage();
    page.on('response', (response) => {
        if (response.status() === 404) {
            failures.push(`${response.request().method()} ${response.url()}`);
        }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    await browser.close();

    if (!failures.length) {
        console.log(`✓ Aucun 404 — ${url}`);
        process.exit(0);
    }

    console.log(`✗ ${failures.length} requête(s) 404 — ${url}\n`);
    failures.forEach((line) => console.log(line));
    process.exit(1);
};

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
