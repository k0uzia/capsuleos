#!/usr/bin/env node
/**
 * Vérifie que les boutons fenêtre (fermer) restent visibles et cliquables
 * lorsque la fenêtre est réduite à sa largeur minimale — GNOME + KDE.
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765';
const chromePath = process.env.PLAYWRIGHT_CHROME
    || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const TARGETS = [
    { id: 'rocky-terminal', url: `${BASE}/home/RedHat/Rocky/index.html`, slot: 'terminal', toolkit: 'gnome', csd: false },
    { id: 'rocky', url: `${BASE}/home/RedHat/Rocky/index.html`, slot: 'profile', toolkit: 'gnome', csd: true },
    { id: 'rocky-baobab', url: `${BASE}/home/RedHat/Rocky/index.html`, slot: 'baobab', toolkit: 'gnome', csd: true },
    { id: 'rocky-characters', url: `${BASE}/home/RedHat/Rocky/index.html`, slot: 'characters', toolkit: 'gnome', csd: true },
    { id: 'fedora', url: `${BASE}/home/RedHat/Fedora/index.html`, slot: 'profile', toolkit: 'gnome', csd: true },
    { id: 'ubuntu', url: `${BASE}/home/Debian/Ubuntu/index.html`, slot: 'profile', toolkit: 'gnome', csd: true },
    { id: 'opensuse', url: `${BASE}/home/SUSE/openSUSE/index.html`, slot: 'text_editor', toolkit: 'kde', csd: false },
    { id: 'debian-kde', url: `${BASE}/home/Debian/Debian-KDE/index.html`, slot: 'text_editor', toolkit: 'kde', csd: false },
    { id: 'kde-neon', url: `${BASE}/home/Debian/KDE-Neon/index.html`, slot: 'profile', toolkit: 'kde', csd: false },
    { id: 'mx-kde', url: `${BASE}/home/Debian/MX-KDE/index.html`, slot: 'text_editor', toolkit: 'kde', csd: false },
];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });

for (const target of TARGETS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

    await page.evaluate((slot) => {
        window.openWindowByDataLink(slot);
    }, target.slot);

    await page.waitForSelector(`div[data-link="${target.slot}"]`, { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(target.slot === 'terminal' ? 1500 : 500);

    if (target.slot === 'terminal') {
        await page.evaluate(() => {
            for (let index = 0; index < 6; index += 1) {
                if (typeof window.openTerminalTab === 'function') {
                    window.openTerminalTab();
                }
            }
        });
        await page.waitForTimeout(400);
    }

    await page.evaluate((slot) => {
        const win = document.querySelector(`div[data-link="${slot}"]`);
        if (!win) {
            return;
        }
        const style = getComputedStyle(win);
        const minW = parseFloat(style.minWidth) || 320;
        win.style.width = `${minW}px`;
        win.style.maxWidth = `${minW}px`;
    }, target.slot);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ slot, csd }) => {
        const win = document.querySelector(`div[data-link="${slot}"]`);
        if (!win) {
            return { ok: false, reason: 'missing-window' };
        }

        const closeBtn = csd
            ? win.querySelector('.gnome-app__window-controls #closeBtn, #closeBtn')
            : win.querySelector(':scope > #windowHeader #closeBtn');
        const header = csd
            ? win.querySelector('.gnome-app__header-end, .profile-app__header, .gnome-settings__headerbar, .xed-app__menubar')
            : (win.querySelector(':scope > #windowHeader')
                || win.querySelector('.fedora-terminal-header'));

        if (!closeBtn || !header) {
            return { ok: false, reason: 'missing-elements' };
        }

        const winRect = win.getBoundingClientRect();
        const closeRect = closeBtn.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();

        const closeInsideWindow = closeRect.right <= winRect.right + 1
            && closeRect.left >= winRect.left - 1
            && closeRect.width > 4
            && closeRect.height > 4;
        const closeInsideHeader = closeRect.right <= headerRect.right + 1
            && closeRect.left >= headerRect.left - 1;
        const closeVerticallyVisible = closeRect.top >= headerRect.top - 1
            && closeRect.bottom <= headerRect.bottom + 1;

        return {
            ok: closeInsideWindow && closeInsideHeader && closeVerticallyVisible,
            reason: closeInsideWindow && closeInsideHeader && closeVerticallyVisible ? 'ok' : 'clipped',
            closeVerticallyVisible,
            headerH: Math.round(headerRect.height),
            headerWidth: Math.round(headerRect.width),
            closeRight: Math.round(closeRect.right),
            winRight: Math.round(winRect.right),
        };
    }, { slot: target.slot, csd: target.csd });

    if (!result.ok) {
        console.error(`✗ smoke-window-header-controls-visible — ${target.id}`, result);
        await browser.close();
        process.exit(1);
    }

    console.log(`  ✓ ${target.id} (${target.toolkit}) — close visible, header ${result.headerWidth}px`);
    await page.close();
}

await browser.close();
console.log(`✓ smoke-window-header-controls-visible OK — ${TARGETS.length} skin(s)`);
