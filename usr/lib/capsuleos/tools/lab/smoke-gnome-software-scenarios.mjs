#!/usr/bin/env node
/**
 * Smoke scénarios GNOME Software S1–S12 (pilote Alma store S5–S12).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs --id linux-alma
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs --id linux-alma
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const BASE = (process.env.CAPSULE_HTTP_BASE || '').replace(/\/$/, '');

const parseArgs = () => {
    const args = process.argv.slice(2);
    const opts = { id: 'linux-alma', scenario: null, optional: false };
    for (let i = 0; i < args.length; i += 1) {
        if ((args[i] === '--id' || args[i] === '--profile') && args[i + 1]) {
            opts.id = args[++i];
        } else if (args[i] === '--scenario' && args[i + 1]) {
            opts.scenario = args[++i];
        } else if (args[i] === '--optional') {
            opts.optional = true;
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

const contract = JSON.parse(read('etc/capsuleos/contracts/software-user-scenarios.json') || '{}');
const scenarios = (contract.scenarios || []).filter((s) => {
    if (opts.scenario && s.id !== opts.scenario) {
        return false;
    }
    if (opts.optional && !s.optional) {
        return false;
    }
    if (s.registryIds && s.registryIds.indexOf(opts.id) === -1 && /^S(5|6|7|9|10|11|12)$/.test(s.id)) {
        return false;
    }
    return true;
});

const kernel = read('usr/lib/capsuleos/shells/linux/update-manager.js');
const storeKernel = read('usr/lib/capsuleos/shells/linux/gnome-store-catalog.js');
const storeGenerated = read('var/lib/capsuleos/generated/capsule-store-catalog.js');
const html = read('usr/share/capsuleos/linux/apps/update_manager_gnome.html');

if (!kernel.includes('bindGnomeSoftware')) {
    errors.push('update-manager.js : bindGnomeSoftware absent');
}
if (!html.includes('data-um-gnome-discover-grid')) {
    errors.push('update_manager_gnome.html : grille À découvrir absente');
}
const STORE_PILOTES = {
    'linux-alma': 11,
    'linux-rocky': 11,
    'linux-fedora': 11,
    'linux-ubuntu': 11,
    'linux-popos': 11,
    'linux-anduinos': 11,
};
if (STORE_PILOTES[opts.id] && !storeGenerated.includes(`"${opts.id}"`)) {
    errors.push(`capsule-store-catalog.js : catalogue ${opts.id} absent`);
}
if (!storeKernel.includes('CAPSULE_STORE_APPS_BY_REGISTRY')) {
    errors.push('gnome-store-catalog.js : consommation catalogue généré absente');
}

scenarios.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
        errors.push(`${scenario.id} : proofs.smoke absent`);
    }
});

async function openSoftware(page, url) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });
    await page.evaluate((registryId) => {
        try {
            window.sessionStorage.removeItem('capsule-gnome-software-installed');
            window.sessionStorage.removeItem('capsule-store-installed:' + registryId);
        } catch (e) {
            /* ignore */
        }
        window.openWindowByDataLink('update_manager');
    }, opts.id);
    await page.waitForSelector('div[data-link="update_manager"]', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('#updateManagerApp.update-manager--gnome', { timeout: 15000 });
    await page.waitForSelector('[data-um-gnome-pane="explore"]:not([hidden])', { timeout: 8000 });
    await page.waitForTimeout(600);
}

async function runInstallFlow(page, appId) {
    await page.click(`[data-um-gnome-app="${appId}"]`);
    await page.waitForTimeout(300);
    const installBtn = page.locator('.gnome-software__detail-install');
    await installBtn.click();
    await page.waitForFunction(
        (id) => {
            const root = document.getElementById('updateManagerApp');
            if (!root || root.dataset.umGnomeInstalling === 'true') {
                return false;
            }
            const btn = root.querySelector('.gnome-software__detail-install');
            return btn && btn.textContent.trim() === 'Ouvrir';
        },
        appId,
        { timeout: 15000 }
    );
}

async function runScenario(page, scenario, url) {
    const storeScenarios = ['S1', 'S5', 'S6', 'S7', 'S9', 'S10', 'S11', 'S12'];
    if (storeScenarios.includes(scenario.id)) {
        await openSoftware(page, url);
    }
    if (scenario.id === 'S1') {
        await runInstallFlow(page, 'libreoffice-writer');
        await page.click('.gnome-software__detail-install');
        await page.waitForSelector('div[data-link="librewriter"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S2') {
        await openSoftware(page, url);
        await page.evaluate(() => {
            const root = document.getElementById('updateManagerApp');
            const titlebar = root?.querySelector('.gnome-software__titlebar');
            if (titlebar?.classList.contains('gnome-software__search--collapsed')) {
                root.querySelector('[data-um-gnome-action="toggleSearch"]')?.click();
            }
        });
        await page.waitForSelector('[data-um-gnome-search-panel] input[data-um-gnome-search]', {
            state: 'visible',
            timeout: 8000,
        });
        await page.fill('[data-um-gnome-search]', 'writer');
        await page.waitForTimeout(400);
        await page.click('[data-um-gnome-search-grid] [data-um-gnome-app="libreoffice-writer"]');
        await page.click('.gnome-software__detail-install');
        return;
    }
    if (scenario.id === 'S3') {
        await openSoftware(page, url);
        await page.click('[data-um-gnome-nav="updates"]');
        await page.click('[data-um-gnome-action="updateAll"]');
        await page.waitForSelector('[data-um-gnome-updates-empty]:not([hidden])', { timeout: 12000 });
        return;
    }
    if (scenario.id === 'S4') {
        await openSoftware(page, url);
        await page.click('[data-um-gnome-nav="installed"]');
        await page.click('[data-um-gnome-installed-list] [data-um-gnome-action="open"][data-um-gnome-app="firefox"]');
        await page.waitForSelector('div[data-link="firefox"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S5') {
        await page.waitForSelector('[data-um-gnome-discover-section]:not([hidden])', { timeout: 8000 });
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="file-roller"]', { timeout: 8000 });
        await runInstallFlow(page, 'file-roller');
        await page.click('[data-um-gnome-nav="installed"]');
        await page.waitForSelector('[data-um-gnome-installed-list] [data-um-gnome-app="file-roller"]', { timeout: 8000 });
        const scenarioTag = await page.evaluate(() => document.getElementById('updateManagerApp')?.dataset?.umGnomeScenario);
        if (scenarioTag !== 'S5-complete') {
            errors.push('S5 : dataset.umGnomeScenario !== S5-complete');
        }
        return;
    }
    if (scenario.id === 'S6') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="libreoffice"]', { timeout: 8000 });
        await runInstallFlow(page, 'libreoffice');
        await page.click('.gnome-software__detail-install');
        await page.waitForSelector('div[data-link="librewriter"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S7') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="calendar"]', { timeout: 8000 });
        await runInstallFlow(page, 'calendar');
        await page.click('.gnome-software__detail-install');
        await page.waitForSelector('div[data-link="calendar"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S9') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="thunderbird"]', { timeout: 8000 });
        await runInstallFlow(page, 'thunderbird');
        await page.click('.gnome-software__detail-install');
        await page.waitForSelector('div[data-link="thunderbird"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S10') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="transmission"]', { timeout: 8000 });
        await runInstallFlow(page, 'transmission');
        await page.click('[data-um-gnome-nav="installed"]');
        await page.waitForSelector('[data-um-gnome-installed-list] [data-um-gnome-app="transmission"]', { timeout: 8000 });
        const scenarioTag = await page.evaluate(() => document.getElementById('updateManagerApp')?.dataset?.umGnomeScenario);
        if (scenarioTag !== 'S10-complete') {
            errors.push('S10 : dataset.umGnomeScenario !== S10-complete');
        }
        return;
    }
    if (scenario.id === 'S11') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="warpinator"]', { timeout: 8000 });
        await runInstallFlow(page, 'warpinator');
        await page.click('.gnome-software__detail-install');
        await page.waitForSelector('div[data-link="warpinator"]', { state: 'visible', timeout: 8000 });
        return;
    }
    if (scenario.id === 'S12') {
        await page.waitForSelector('[data-um-gnome-discover-grid] [data-um-gnome-app="simple-scan"]', { timeout: 8000 });
        await runInstallFlow(page, 'simple-scan');
        await page.click('[data-um-gnome-nav="installed"]');
        await page.waitForSelector('[data-um-gnome-installed-list] [data-um-gnome-app="simple-scan"]', { timeout: 8000 });
        const scenarioTag = await page.evaluate(() => document.getElementById('updateManagerApp')?.dataset?.umGnomeScenario);
        if (scenarioTag !== 'S12-complete') {
            errors.push('S12 : dataset.umGnomeScenario !== S12-complete');
        }
        return;
    }
    if (scenario.id === 'S8') {
        await openSoftware(page, url);
        await page.click('[data-um-gnome-action="simulateNetworkError"]');
        await page.waitForSelector('[data-um-gnome-network-error]:not([hidden])', { timeout: 5000 });
    }
}

if (BASE) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = resolveCapsuleOsUrl(opts.id, BASE);
    try {
        for (const scenario of scenarios) {
            if (scenario.optional && !opts.optional && opts.scenario !== scenario.id) {
                continue;
            }
            try {
                await runScenario(page, scenario, url);
            } catch (e) {
                errors.push(`${scenario.id} Playwright : ${e.message}`);
            }
        }
    } finally {
        await browser.close();
    }
} else {
    process.stdout.write('○ smoke-gnome-software-scenarios Playwright ignoré — CAPSULE_HTTP_BASE non défini\n');
}

if (errors.length) {
    console.error(`✗ smoke-gnome-software-scenarios — ${errors.length} erreur(s) (${opts.id})`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

const ran = scenarios.map((s) => s.id).join(', ');
console.log(`✓ smoke-gnome-software-scenarios OK — ${opts.id} [${ran}]${BASE ? ' (Playwright)' : ' (statique)'}`);
process.exit(0);
