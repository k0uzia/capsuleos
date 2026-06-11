#!/usr/bin/env node
/**
 * Smoke ground G3 — kickoff B1 Okular · Kate · Gwenview.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const INDEX = path.join(ROOT, 'home/Debian/KDE-Neon/index.html');
const MENU = path.join(ROOT, 'home/Debian/KDE-Neon/content/mainMenu-data.js');
const PROFILE = path.join(ROOT, 'etc/capsuleos/profiles/linux-kde-neon.json');

const B1 = [
    { desktop: 'org.kde.okular.desktop', dataLink: 'visionneur_pdf', rootId: 'okularApp', title: 'Okular' },
    { desktop: 'org.kde.kate.desktop', dataLink: 'text_editor', rootId: 'xedApp', title: 'Kate' },
    { desktop: 'org.kde.gwenview.desktop', dataLink: 'visionneur_images', rootId: 'gwenviewApp', title: 'Gwenview' },
];

const errors = [];
const indexHtml = fs.readFileSync(INDEX, 'utf8');
const menuSrc = fs.readFileSync(MENU, 'utf8');
const profile = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));
const overrides = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES || {};

// eslint-disable-next-line no-new-func
const MENU_APPS = Function(`return ${menuSrc.match(/const MENU_APPS = (\[[\s\S]*?\]);/)[1]};`)();

B1.forEach((spec) => {
    if (!indexHtml.includes(`data-link="${spec.dataLink}"`)) {
        errors.push(`index.html : slot ${spec.dataLink} absent`);
    }
    const app = MENU_APPS.find((a) => a.desktop === spec.desktop);
    if (!app) {
        errors.push(`mainMenu-data : ${spec.name || spec.desktop} absent`);
    } else if (app.dataLink !== spec.dataLink) {
        errors.push(`${spec.desktop} : dataLink=${app.dataLink} (attendu ${spec.dataLink})`);
    }
    if (spec.dataLink === 'visionneur_pdf' || spec.dataLink === 'visionneur_images') {
        if (!overrides[spec.dataLink]) {
            errors.push(`profil : override ${spec.dataLink} manquant`);
        }
    }
});

const URL = process.env.CAPSULE_KDE_NEON_URL || 'http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html';
let runtime = { skipped: true };

const chromePath = [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
].find((p) => p && fs.existsSync(p));

if (chromePath) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

    const slotChecks = [];
    for (const spec of B1) {
        const result = await page.evaluate(async (entry) => {
            window.openWindowByDataLink(entry.dataLink);
            await new Promise((r) => { window.setTimeout(r, 500); });
            const root = document.getElementById(entry.rootId);
            const container = document.querySelector(`div.windowElement[data-link="${entry.dataLink}"]`);
            const titleEl = container ? container.querySelector('#windowTitle') : null;
            return {
                dataLink: entry.dataLink,
                ok: !!(container && container.style.display !== 'none' && root),
                hasRoot: !!root,
                title: titleEl ? titleEl.textContent : '',
            };
        }, spec);
        slotChecks.push(result);
        if (!result.ok) {
            errors.push(`runtime ${spec.dataLink} : root=${result.hasRoot}`);
        } else if (spec.dataLink === 'text_editor') {
            if (!result.title.includes('Kate')) {
                errors.push('runtime text_editor : titre Kate attendu');
            }
        } else if (!result.title.includes(spec.title)) {
            errors.push(`runtime ${spec.dataLink} : titre "${result.title}"`);
        }
    }

    const gwenImg = await page.evaluate(() => {
        const img = document.querySelector('#gwenview-content .kde-gwenview__image');
        return !!(img && img.naturalWidth > 0);
    });
    if (!gwenImg) {
        errors.push('runtime gwenview : image démo absente');
    }

    const okularSidebar = await page.evaluate(() => {
        const sidebar = document.querySelector('#okular-sidebar');
        return !!(sidebar && !sidebar.hidden);
    });
    if (!okularSidebar) {
        errors.push('runtime okular : sidebar miniatures absente');
    }

    runtime = { skipped: false, slotChecks, gwenImg, okularSidebar };
    await browser.close();
}

const out = { ok: errors.length === 0, phase: 'ground-G3-B1', errors, apps: B1.map((s) => s.dataLink), runtime };
console.log(JSON.stringify(out, null, 2));
if (errors.length) {
    console.error('✗ smoke-kde-neon-b1-kickoff');
    process.exit(1);
}
console.log('✓ smoke-kde-neon-b1-kickoff OK');
