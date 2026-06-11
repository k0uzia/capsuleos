#!/usr/bin/env node
/**
 * Smoke scénarios Logithèque Mi1–Mi12 (linux-mint).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-mint-store-scenarios.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-mint-store-scenarios.mjs --scenario Mi8
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { MINT_URL, chromePath, openMintSlot, waitMintReady } from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const BASE = (process.env.CAPSULE_HTTP_BASE || '').replace(/\/$/, '');
const URL = BASE ? MINT_URL.replace('http://127.0.0.1:5501', BASE) : MINT_URL;

const parseArgs = () => {
    const args = process.argv.slice(2);
    const opts = { scenario: null };
    for (let i = 0; i < args.length; i += 1) {
        if (args[i] === '--scenario' && args[i + 1]) {
            opts.scenario = args[++i];
        }
    }
    return opts;
};

const opts = parseArgs();
const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
}

const contract = JSON.parse(read('etc/capsuleos/contracts/mintinstall-user-scenarios.json') || '{}');
const scenarios = (contract.scenarios || []).filter((s) => {
    if (opts.scenario && s.id !== opts.scenario) {
        return false;
    }
    return true;
});

const kernel = read('usr/lib/capsuleos/shells/linux/mintinstall.js');
const storeKernel = read('usr/lib/capsuleos/shells/linux/mint-store-catalog.js');
const html = read('usr/share/capsuleos/linux/apps/mintinstall.html');

if (!kernel.includes('data-mi-open')) {
    errors.push('mintinstall.js : data-mi-open absent');
}
if (!html.includes('data-mi-discover-grid')) {
    errors.push('mintinstall.html : grille À découvrir absente');
}
if (!storeKernel.includes('CapsuleMintStore')) {
    errors.push('mint-store-catalog.js : CapsuleMintStore absent');
}

scenarios.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
        errors.push(`${scenario.id} : proofs.smoke absent`);
    }
});

async function clearStoreSession(page) {
    await page.evaluate(() => {
        try {
            window.sessionStorage.removeItem('capsule-store-installed:linux-mint');
        } catch (e) {
            /* ignore */
        }
    });
}

async function focusMintinstall(page) {
    await page.evaluate(() => {
        if (typeof window.openWindowByDataLink === 'function') {
            window.openWindowByDataLink('mintinstall');
        }
    });
    await page.waitForSelector('div[data-link="mintinstall"]', { state: 'visible', timeout: 8000 });
    await page.waitForTimeout(150);
}

async function ensureMintHome(page) {
    await page.evaluate(() => {
        const home = document.querySelector('[data-mi-cat="home"]');
        if (home) {
            home.click();
        }
    });
    await page.waitForSelector('[data-mi-page="home"]:not([hidden])', { timeout: 8000 });
}

async function openMintinstall(page) {
    await waitMintReady(page);
    await clearStoreSession(page);
    await openMintSlot(page, 'mintinstall');
    await page.waitForSelector('#mintInstallApp[data-mint-install-init="true"]', { timeout: 15000 });
    await ensureMintHome(page);
    await page.waitForTimeout(200);
}

async function clickInstallButton(page, appId) {
    const clicked = await page.evaluate((id) => {
        var card = document.querySelector('[data-mi-discover-grid] [data-mi-pkg="' + id + '"]');
        if (card && card.scrollIntoView) {
            card.scrollIntoView({ block: 'center' });
        }
        var btn = document.querySelector('[data-mi-discover-grid] [data-mi-pkg="' + id + '"] [data-mi-install="' + id + '"]')
            || document.querySelector('[data-mi-install="' + id + '"]');
        if (!btn) {
            return false;
        }
        btn.click();
        return true;
    }, appId);
    if (!clicked) {
        throw new Error('bouton install ' + appId + ' introuvable');
    }
}

async function waitInstallComplete(page, appId) {
    await page.waitForFunction((id) => {
        var root = document.getElementById('mintInstallApp');
        if (!root || root.dataset.miInstalling === 'true') {
            return false;
        }
        if (root.querySelector('[data-mi-open]')) {
            return true;
        }
        var stillInstall = root.querySelector('[data-mi-install="' + id + '"]');
        return stillInstall && stillInstall.textContent.trim() === 'Ouvrir';
    }, appId, { timeout: 25000 });
}

async function runInstallFlow(page, appId) {
    await focusMintinstall(page);
    await ensureMintHome(page);
    await clickInstallButton(page, appId);
    await waitInstallComplete(page, appId);
}

async function runScenario(page, scenario) {
    if (scenario.id === 'Mi1') {
        await openMintinstall(page);
        await page.click('[data-mi-cat="office"]');
        await page.waitForTimeout(200);
        await page.click('[data-mi-pkg="librewriter"]');
        await page.waitForTimeout(200);
        await page.click('[data-mi-detail-install]');
        await page.waitForFunction(() => {
            const root = document.getElementById('mintInstallApp');
            return root && root.dataset.miInstalling !== 'true'
                && root.querySelector('[data-mi-open="librewriter"]');
        }, null, { timeout: 20000 });
        await page.click('[data-mi-open="librewriter"]');
        await page.waitForSelector('div[data-link="librewriter"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi2') {
        await openMintinstall(page);
        await page.fill('#mi-search', 'writer');
        await page.waitForTimeout(400);
        await page.click('#mi-search-list [data-mi-pkg="librewriter"]');
        await page.waitForSelector('[data-mi-page="detail"]:not([hidden])', { timeout: 8000 });
        await page.evaluate(() => {
            var btn = document.querySelector('[data-mi-detail-install]')
                || document.querySelector('[data-mi-open="librewriter"]');
            if (btn) {
                btn.click();
            }
        });
        await waitInstallComplete(page, 'librewriter');
        return;
    }
    if (scenario.id === 'Mi3') {
        await openMintinstall(page);
        await page.evaluate(() => window.openWindowByDataLink('update_manager'));
        await page.waitForSelector('div[data-link="update_manager"]', { state: 'visible', timeout: 8000 });
        const welcome = page.locator('#um-welcome:not([hidden])');
        if (await welcome.count()) {
            await page.click('[data-um-welcome="finish"]');
        }
        await page.click('[data-um-action="refresh"]');
        await page.waitForTimeout(1000);
        await page.click('[data-um-action="selectAll"]');
        await page.click('[data-um-action="install"]');
        await page.waitForSelector('#um-empty:not([hidden])', { timeout: 20000 });
        return;
    }
    if (scenario.id === 'Mi4') {
        await openMintinstall(page);
        await page.click('[data-mi-cat="installed"]');
        await page.waitForTimeout(300);
        await page.click('#mi-app-list [data-mi-open="firefox"]');
        await page.waitForSelector('div[data-link="firefox"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi5') {
        await openMintinstall(page);
        await page.click('[data-mi-cat="accessories"]');
        await page.waitForTimeout(300);
        await page.click('[data-mi-open="file_roller"]');
        await page.waitForSelector('div[data-link="file_roller"]', { state: 'visible', timeout: 8000 });
        await focusMintinstall(page);
        await page.click('[data-mi-cat="installed"]', { force: true });
        await page.waitForSelector('#mi-app-list [data-mi-pkg="file-roller"]', { timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi6') {
        await openMintinstall(page);
        await page.click('[data-mi-cat="office"]');
        await page.waitForTimeout(300);
        await page.click('[data-mi-open="librewriter"]');
        await page.waitForSelector('div[data-link="librewriter"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi7') {
        await openMintinstall(page);
        await page.click('[data-mi-cat="accessories"]');
        await page.waitForTimeout(300);
        await page.click('[data-mi-open="calendar"]');
        await page.waitForSelector('div[data-link="calendar"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi8') {
        await openMintinstall(page);
        await page.waitForSelector('[data-mi-discover-grid]:not([hidden]) [data-mi-pkg="thunderbird"]', { timeout: 8000 });
        await runInstallFlow(page, 'thunderbird');
        await focusMintinstall(page);
        await page.evaluate(() => {
            var btn = document.querySelector('[data-mi-open="thunderbird"]');
            if (btn) {
                btn.click();
            }
        });
        await page.waitForSelector('div[data-link="thunderbird"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi9') {
        await openMintinstall(page);
        await page.waitForSelector('[data-mi-discover-grid]:not([hidden]) [data-mi-pkg="transmission"]', { timeout: 8000 });
        await runInstallFlow(page, 'transmission');
        await focusMintinstall(page);
        await page.click('[data-mi-cat="installed"]', { force: true });
        await page.waitForSelector('#mi-app-list [data-mi-pkg="transmission"]', { timeout: 8000 });
        const tag = await page.evaluate(() => document.getElementById('mintInstallApp').dataset.miScenario);
        if (tag !== 'Mi9-complete') {
            errors.push('Mi9 : dataset.miScenario !== Mi9-complete');
        }
        return;
    }
    if (scenario.id === 'Mi10') {
        await openMintinstall(page);
        await page.waitForSelector('[data-mi-discover-grid]:not([hidden]) [data-mi-pkg="warpinator"]', { timeout: 8000 });
        await runInstallFlow(page, 'warpinator');
        await focusMintinstall(page);
        await page.evaluate(() => {
            var btn = document.querySelector('[data-mi-open="warpinator"]');
            if (btn) {
                btn.click();
            }
        });
        await page.waitForSelector('div[data-link="warpinator"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi11') {
        await openMintinstall(page);
        await page.waitForSelector('[data-mi-discover-grid]:not([hidden]) [data-mi-pkg="rhythmbox"]', { timeout: 8000 });
        await runInstallFlow(page, 'rhythmbox');
        await focusMintinstall(page);
        await page.evaluate(() => {
            var btn = document.querySelector('[data-mi-open="rhythmbox"]');
            if (btn) {
                btn.click();
            }
        });
        await page.waitForSelector('div[data-link="rhythmbox"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'Mi12') {
        await openMintinstall(page);
        await page.waitForSelector('[data-mi-discover-grid]:not([hidden]) [data-mi-pkg="simple-scan"]', { timeout: 8000 });
        await runInstallFlow(page, 'simple-scan');
        await focusMintinstall(page);
        await page.evaluate(() => {
            var btn = document.querySelector('[data-mi-open="simple_scan"]');
            if (btn) {
                btn.click();
            }
        });
        await page.waitForSelector('div[data-link="simple_scan"]', { state: 'visible', timeout: 8000 });
        return;
    }
}

if (BASE || URL) {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage();
    try {
        for (const scenario of scenarios) {
            try {
                await runScenario(page, scenario);
            } catch (e) {
                errors.push(`${scenario.id} Playwright : ${e.message}`);
            }
        }
    } finally {
        await browser.close();
    }
} else {
    process.stdout.write('○ smoke-mint-store-scenarios Playwright ignoré — CAPSULE_HTTP_BASE non défini\n');
}

if (errors.length) {
    console.error(`✗ smoke-mint-store-scenarios — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

const ran = scenarios.map((s) => s.id).join(', ');
console.log(`✓ smoke-mint-store-scenarios OK — linux-mint [${ran}]${BASE ? ' (Playwright)' : ' (statique)'}`);
process.exit(0);
