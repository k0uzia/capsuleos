#!/usr/bin/env node
/**
 * Smoke V4-P2 KDE Neon — kickoff B2/B3 (Spectacle, Info-centre, System Monitor).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const INDEX = path.join(ROOT, 'home/Debian/KDE-Neon/index.html');
const MENU = path.join(ROOT, 'home/Debian/KDE-Neon/content/mainMenu-data.js');
const PROFILE = path.join(ROOT, 'etc/capsuleos/profiles/linux-kde-neon.json');

const V4_P2 = [
    { desktop: 'org.kde.spectacle.desktop', dataLink: 'spectacle', rootId: 'spectacleApp', name: 'Spectacle' },
    { desktop: 'org.kde.kinfocenter.desktop', dataLink: 'kinfocenter', rootId: 'kinfocenterApp', name: 'Centre d\'informations' },
    { desktop: 'org.kde.plasma-systemmonitor.desktop', dataLink: 'system_monitor', rootId: 'systemMonitorApp', name: 'Surveillance du système' },
];

const errors = [];
const indexHtml = fs.readFileSync(INDEX, 'utf8');
const menuSrc = fs.readFileSync(MENU, 'utf8');
const profile = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));
const overrides = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES || {};

// eslint-disable-next-line no-new-func
const MENU_APPS = Function(`return ${menuSrc.match(/const MENU_APPS = (\[[\s\S]*?\]);/)[1]};`)();

V4_P2.forEach((spec) => {
    if (!indexHtml.includes(`data-link="${spec.dataLink}"`)) {
        errors.push(`index.html : slot ${spec.dataLink} absent`);
    }
    const app = MENU_APPS.find((a) => a.desktop === spec.desktop);
    if (!app) {
        errors.push(`mainMenu-data : ${spec.name} (${spec.desktop}) absent`);
    } else if (app.dataLink !== spec.dataLink) {
        errors.push(`${spec.name} : dataLink=${app.dataLink} (attendu ${spec.dataLink})`);
    }
    if (spec.dataLink === 'spectacle' || spec.dataLink === 'kinfocenter') {
        if (!overrides[spec.dataLink]) {
            errors.push(`profil : override template ${spec.dataLink} manquant`);
        }
    }
    const tplPath = path.join(ROOT, 'usr/share/capsuleos/linux/apps', `${spec.dataLink === 'spectacle' ? 'spectacle_kde_neon' : spec.dataLink === 'kinfocenter' ? 'kinfocenter_kde_neon' : 'system_monitor'}.html`);
    if (!fs.existsSync(tplPath)) {
        errors.push(`template manquant : ${tplPath}`);
    }
});

const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/OS/linux/families/debian/kde-neon/index.html';
let runtime = { skipped: true, reason: 'no-playwright' };

const chromePath = [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (chromePath && !process.env.SKIP_PLAYWRIGHT) {
    try {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true, executablePath: chromePath });
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

        const slotChecks = [];
        for (const spec of V4_P2) {
            const result = await page.evaluate(async (entry) => {
                window.openWindowByDataLink(entry.dataLink);
                await new Promise((r) => { window.setTimeout(r, 450); });
                const root = document.getElementById(entry.rootId);
                const container = document.querySelector(`div.windowElement[data-link="${entry.dataLink}"]`);
                return {
                    dataLink: entry.dataLink,
                    ok: !!(container && container.style.display !== 'none' && root),
                    hasRoot: !!root,
                };
            }, spec);
            slotChecks.push(result);
            if (!result.ok) {
                errors.push(`runtime ${spec.dataLink} : root=${result.hasRoot}`);
            }
        }
        runtime = { skipped: false, slotChecks };
        await browser.close();
    } catch (err) {
        if (err.message && err.message.includes('ERR_CONNECTION_REFUSED')) {
            runtime = { skipped: true, reason: 'http-unavailable' };
        } else {
            errors.push(`playwright : ${err.message || err}`);
        }
    }
}

const out = {
    ok: errors.length === 0,
    phase: 'V4-P2',
    errors,
    apps: V4_P2.map((s) => s.dataLink),
    runtime,
};
console.log(JSON.stringify(out, null, 2));
process.exit(errors.length ? 1 : 0);
