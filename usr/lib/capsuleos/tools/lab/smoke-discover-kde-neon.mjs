#!/usr/bin/env node
/**
 * Smoke Discover KDE neon — catalogue magasin actif + section « À découvrir » (runtime).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs [--static-only]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildStoreCatalogEntries } from './capsule-app-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const staticOnly = process.argv.includes('--static-only');
const URL = process.env.CAPSULE_KDE_NEON_URL
  || `${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500'}/home/Debian/KDE-Neon/index.html`;

const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        errors.push(`Fichier manquant: ${rel}`);
        return '';
    }
    return fs.readFileSync(abs, 'utf8');
}

const indexHtml = read('home/Debian/KDE-Neon/index.html');
const template = read('usr/share/capsuleos/linux/apps/update_manager_kde_neon.html');
const catalogJson = read('home/Debian/KDE-Neon/content/discover-catalog.json');
const presentation = JSON.parse(read('etc/capsuleos/contracts/presentation-bindings.json') || '{}');
const discoverJs = read('usr/lib/capsuleos/shells/linux/discover-kde.js');

if (!indexHtml.includes("window.CAPSULE_SKIN_PROFILE_ID = 'linux-kde-neon'")) {
    errors.push('index.html : CAPSULE_SKIN_PROFILE_ID linux-kde-neon absent');
}
if (!indexHtml.includes('capsule-store-catalog.js')) {
    errors.push('index.html : capsule-store-catalog.js absent');
}
if (!indexHtml.includes('gnome-store-catalog.js')) {
    errors.push('index.html : gnome-store-catalog.js absent');
}
if (!indexHtml.includes('discover-kde.js')) {
    errors.push('index.html : discover-kde.js absent');
}
if (!template.includes('update-manager--kde-neon')) {
    errors.push('update_manager_kde_neon.html : classe update-manager--kde-neon absente');
}
if (!template.includes('data-discover-nav="home"')) {
    errors.push('update_manager_kde_neon.html : navigation Discover absente');
}
if (!template.includes('data-discover-home-mount')) {
    errors.push('update_manager_kde_neon.html : montage accueil absent');
}

const binding = presentation.bindings && presentation.bindings['linux-kde-neon'];
if (!binding || binding.storeCatalogStatus !== 'active') {
    errors.push('presentation-bindings.json : linux-kde-neon storeCatalogStatus doit être active');
}

let catalog;
try {
    catalog = JSON.parse(catalogJson);
} catch (e) {
    errors.push('discover-catalog.json : JSON invalide');
}
if (catalog && (!catalog.homeSections || !catalog.homeSections.length)) {
    errors.push('discover-catalog.json : homeSections vide');
}

const storeEntries = buildStoreCatalogEntries('linux-kde-neon');
if (!storeEntries.length) {
    errors.push('catalogue magasin linux-kde-neon : 0 entrée storeInstallable');
}

if (!discoverJs.includes('getStoreDiscoverApps')) {
    errors.push('discover-kde.js : branchement catalogue magasin absent');
}
if (!discoverJs.includes('À découvrir')) {
    errors.push('discover-kde.js : section À découvrir absente');
}
if (discoverJs.includes('../../../usr/share/')) {
    errors.push('discover-kde.js : chemins usr/share en dur');
}
if (!read('usr/share/capsuleos/linux/apps/style/discover-kde-store-icons.css').includes('gnome-software__cardicon--libreoffice')) {
    errors.push('discover-kde-store-icons.css : icônes magasin absentes');
}

if (errors.length) {
    console.error('smoke-discover-kde-neon — ÉCHEC (statique)');
    errors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

const chromePath = [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

async function runRuntimeSmoke() {
    if (staticOnly || !chromePath) {
        return { skipped: true };
    }
    const runtimeErrors = [];
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });
    try {
        await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(() => {
            sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');
            window.openWindowByDataLink('update_manager');
        });
        await page.waitForFunction(
            () => document.querySelector('[data-discover-store-section]'),
            null,
            { timeout: 60000 },
        );

        const storeSection = await page.evaluate(() => {
            const section = document.querySelector('[data-discover-store-section]');
            const title = section?.querySelector('.kde-discover-home__section-title')?.textContent?.trim();
            const cards = section?.querySelectorAll('.kde-discover-card')?.length || 0;
            const hasLibre = !!section?.querySelector('[data-discover-app="libreoffice"]');
            return { title, cards, hasLibre };
        });
        if (storeSection.title !== 'À découvrir') {
            runtimeErrors.push(`section magasin : titre=${storeSection.title || '(vide)'}`);
        }
        if (storeSection.cards < 5) {
            runtimeErrors.push(`section magasin : ${storeSection.cards} cartes (attendu ≥5)`);
        }
        if (!storeSection.hasLibre) {
            runtimeErrors.push('section magasin : LibreOffice absent');
        }

        await page.click('[data-discover-store-section] [data-discover-app="libreoffice"]');
        await page.waitForFunction(
            () => {
                const panel = document.querySelector('[data-discover-app-detail]');
                return panel && !panel.hidden;
            },
            null,
            { timeout: 8000 },
        );

        const detail = await page.evaluate(() => ({
            name: document.querySelector('.kde-discover-app-detail__name')?.textContent?.trim(),
            version: document.querySelector('.kde-discover-app-detail__facts dd')?.textContent?.trim(),
            hasStoreIcon: !!document.querySelector('.kde-discover-app-detail__icon.gnome-software__cardicon'),
        }));
        if (!detail.name || detail.name.indexOf('LibreOffice') === -1) {
            runtimeErrors.push(`fiche magasin : titre=${detail.name || '(vide)'}`);
        }
        if (!detail.hasStoreIcon) {
            runtimeErrors.push('fiche magasin : icône catalogue absente');
        }

        await page.click('[data-discover-app-install="libreoffice"]');
        await page.waitForFunction(
            () => {
                const status = document.querySelector('[data-discover-app-status]');
                return status && !status.hidden && /simulation magasin/i.test(status.textContent);
            },
            null,
            { timeout: 5000 },
        );

        await page.evaluate(() => {
            const back = document.querySelector('[data-discover-app-back]');
            if (back) {
                back.click();
            }
        });
        await page.waitForFunction(
            () => document.querySelector('[data-discover-panel="home"]:not([hidden])'),
            null,
            { timeout: 5000 },
        );

        const afterInstall = await page.evaluate(() => ({
            libreInStore: !!document.querySelector('[data-discover-store-section] [data-discover-app="libreoffice"]'),
        }));
        if (afterInstall.libreInStore) {
            runtimeErrors.push('section magasin : LibreOffice encore visible après install');
        }

        return { storeSection, detail, afterInstall, runtimeErrors };
    } catch (err) {
        runtimeErrors.push(err.message || String(err));
        return { runtimeErrors };
    } finally {
        await browser.close();
    }
}

const runtime = await runRuntimeSmoke();
if (runtime.runtimeErrors && runtime.runtimeErrors.length) {
    console.error('smoke-discover-kde-neon — ÉCHEC (runtime)');
    runtime.runtimeErrors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

const mode = runtime.skipped ? 'statique' : 'statique+runtime';
console.log(`smoke-discover-kde-neon — OK (${mode}, ${storeEntries.length} apps magasin)`);
