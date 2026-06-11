#!/usr/bin/env node
/**
 * Smoke scénarios magasin Logithèque Cinnamon (Mi1–Mi6) — pilote linux-mint.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-mint-store-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { buildStoreCatalogEntries } from './capsule-app-resolver.mjs';
import { MINT_URL, MINT_VIEWPORT, chromePath, openMintSlot, openMintMainMenu } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const BASE = (process.env.CAPSULE_HTTP_BASE || '').replace(/\/$/, '');
const URL = BASE ? `${BASE}/home/Debian/Mint/index.html` : MINT_URL;

const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
}

const template = read('usr/share/capsuleos/linux/apps/mintinstall.html');
const mintinstallJs = read('usr/lib/capsuleos/shells/linux/mintinstall.js');
const storeCatalogJs = read('usr/lib/capsuleos/shells/linux/mint-store-catalog.js');

if (!template.includes('data-mi-discover-grid')) {
    errors.push('mintinstall.html : grille À découvrir absente');
}
if (!template.includes('data-mi-cat="games"')) {
    errors.push('mintinstall.html : catégorie Jeux absente');
}
if (!mintinstallJs.includes('renderDiscoverSection')) {
    errors.push('mintinstall.js : renderDiscoverSection absent');
}
if (!storeCatalogJs.includes('recordStoreInstall')) {
    errors.push('mint-store-catalog.js : recordStoreInstall absent');
}

const storeEntries = buildStoreCatalogEntries('linux-mint');
const discoverCount = storeEntries.filter((e) => e.storeInstallable === true || e.defaultInstalled === false).length;
if (!discoverCount) {
    errors.push('catalogue linux-mint : 0 entrée À découvrir');
}

if (errors.length) {
    console.error('smoke-mint-store-scenarios — statique ÉCHEC');
    errors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await page.setViewportSize(MINT_VIEWPORT);
await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForFunction(
    () => typeof window.openWindowByDataLink === 'function',
    null,
    { timeout: 60000 },
);

await page.evaluate(() => {
    try {
        window.sessionStorage.removeItem('capsule-store-installed:linux-mint');
    } catch (e) {
        /* ignore */
    }
});

await openMintSlot(page, 'mintinstall');
await page.waitForTimeout(250);

const mi1 = await page.evaluate(() => ({
    title: document.querySelector('div[data-link="mintinstall"] #windowTitle')?.textContent,
    featured: document.querySelectorAll('.mi-app__featured .mi-app__featured-card').length,
    discoverTitle: document.querySelector('.mi-app__discover-title')?.textContent,
}));

if (mi1.title !== 'Logithèque' || mi1.featured < 4) {
    errors.push(`Mi1 accueil VM : title=${mi1.title} featured=${mi1.featured}`);
}
if (mi1.discoverTitle !== 'À découvrir') {
    errors.push('Mi2 section À découvrir : titre absent');
}

const mi2 = await page.evaluate(() => document.querySelectorAll('#mi-discover-grid .mi-app__discover-card').length);
if (mi2 < 3) {
    errors.push(`Mi2 grille discover : ${mi2} cartes (attendu ≥3)`);
}

await page.click('[data-mi-cat="games"]');
await page.waitForTimeout(80);
const mi3 = await page.evaluate(() => ({
    active: document.querySelector('[data-mi-cat="games"]')?.classList.contains('is-active'),
    list: document.querySelectorAll('#mi-app-list .mi-app__list-item').length,
}));
if (!mi3.active) {
    errors.push('Mi3 catégorie Jeux : non active');
}

await page.click('[data-mi-cat="home"]');
await page.waitForTimeout(60);

const installTarget = await page.evaluate(() => {
    const prefer = ['thunderbird', 'transmission', 'rhythmbox', 'warpinator', 'simple-scan', 'snapshot'];
    var pi;
    for (pi = 0; pi < prefer.length; pi += 1) {
        const btn = document.querySelector(`#mi-discover-grid [data-mi-install="${prefer[pi]}"]:not(:disabled)`);
        if (btn) {
            return prefer[pi];
        }
    }
    const fallback = document.querySelector('#mi-discover-grid [data-mi-install]:not(:disabled)');
    return fallback ? fallback.getAttribute('data-mi-install') : null;
});

if (!installTarget) {
    errors.push('Mi4 install : aucun bouton discover disponible');
} else {
    await page.evaluate((appId) => {
        const btn = document.querySelector(`#mi-discover-grid [data-mi-install="${appId}"]`);
        if (btn) {
            btn.click();
        }
    }, installTarget);
    await page.waitForTimeout(120);
    const mi4 = await page.evaluate((appId) => {
        const btn = document.querySelector(`#mi-discover-grid [data-mi-install="${appId}"]`);
        let stored = [];
        try {
            const raw = window.sessionStorage.getItem('capsule-store-installed:linux-mint');
            if (raw) {
                stored = JSON.parse(raw).appIds || [];
            }
        } catch (e) {
            /* ignore */
        }
        return {
            stillVisible: !!btn,
            disabled: btn ? btn.disabled : false,
            stored: stored.indexOf(appId) !== -1,
            status: document.getElementById('mi-status')?.textContent || '',
        };
    }, installTarget);
    if (!mi4.stored || (mi4.stillVisible && !mi4.disabled)) {
        errors.push(`Mi4 install ${installTarget} : stored=${mi4.stored} visible=${mi4.stillVisible} disabled=${mi4.disabled}`);
    }
}

await openMintMainMenu(page);
await page.waitForTimeout(120);
const mi5 = await page.evaluate((appId) => {
    const storeEntry = window.CapsuleMintStore && window.CapsuleMintStore.getStoreAppEntry
        ? window.CapsuleMintStore.getStoreAppEntry(appId)
        : null;
    const slot = storeEntry && storeEntry.storeSlot ? storeEntry.storeSlot : appId;
    if (!window.MENU_APPS) {
        return { menuApps: false };
    }
    var i;
    for (i = 0; i < window.MENU_APPS.length; i += 1) {
        if (window.MENU_APPS[i].dataLink === slot) {
            return { menuLinked: true, slot: slot };
        }
    }
    return { menuLinked: false, slot: slot };
}, installTarget || 'thunderbird');

if (installTarget && !mi5.menuLinked) {
    errors.push(`Mi5 menu pin : slot ${mi5.slot} non lié après install`);
}

await browser.close();

if (errors.length) {
    console.error('smoke-mint-store-scenarios — ÉCHEC');
    errors.forEach((msg) => console.error(`  • ${msg}`));
    process.exit(1);
}

console.log(`smoke-mint-store-scenarios — OK (discover=${mi2}, install=${installTarget || 'n/a'})`);
