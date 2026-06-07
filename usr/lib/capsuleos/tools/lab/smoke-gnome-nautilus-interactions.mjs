#!/usr/bin/env node
/**
 * Smoke interactions — Nautilus GNOME (sidebar, nouveau dossier, raccourcis, menu contextuel).
 * Usage : CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const SKIN = { id: 'linux-rocky' };

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    await page.goto(resolveCapsuleOsUrl(SKIN.id, BASE), { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
        window.__smokeFolderName = `Smoke-${Date.now()}`;
        window.prompt = () => window.__smokeFolderName;
    });

    await page.evaluate(() => window.openWindowByDataLink('nemo'));
    await page.waitForSelector('div[data-link="nemo"] .nautilus-app--n47', { timeout: 15000 });
    await page.waitForTimeout(800);

    const boot = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        return {
            nautilusBind: win?.dataset?.nautilusKeyboardInit === 'true'
                || typeof window.bindFileExplorerNautilusFeatures === 'function',
            contextMenu: !!win?.querySelector('#nemo-context-menu'),
            contextInit: win?.dataset?.nemoContextMenuInit === 'true',
            recentLink: !!win?.querySelector('#voletnemo a[data-link="Récent"]'),
            trashLink: !!win?.querySelector('#voletnemo a[data-link="Corbeille"]'),
            bureauLink: !!win?.querySelector('#voletnemo a[data-link="Bureau"]'),
            favorisLink: !!win?.querySelector('#voletnemo a[data-link="Favoris"]'),
            newFolderBtn: !!win?.querySelector('.nautilus-app__new-folder-btn'),
        };
    });

    if (!boot.recentLink) errors.push('sidebar Récent sans data-link');
    if (!boot.trashLink) errors.push('sidebar Corbeille sans data-link');
    if (!boot.bureauLink) errors.push('sidebar Bureau absent');
    if (!boot.favorisLink) errors.push('sidebar Favoris sans data-link');
    if (!boot.contextMenu) errors.push('#nemo-context-menu absent');
    if (!boot.newFolderBtn) errors.push('bouton nouveau dossier absent');

    const headerbar = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        const crumb = win?.querySelector('#nautilus-path-crumbbar');
        const search = win?.querySelector('#nemo-search-wrap');
        return {
            headerbarInit: win?.dataset?.nautilusHeaderbarInit === 'true',
            mainMenu: !!win?.querySelector('#nautilus-main-menu'),
            pathMenu: !!win?.querySelector('#nautilus-path-menu'),
            filterMenu: !!win?.querySelector('#nautilus-search-filter-menu'),
            viewMenu: !!win?.querySelector('#nautilus-view-menu'),
            breadcrumbDefault: crumb && !crumb.hidden && search && search.hidden,
            chromeMode: window.fileExplorerState?.nautilusChromeMode,
        };
    });
    if (!headerbar.mainMenu) errors.push('#nautilus-main-menu absent');
    if (!headerbar.pathMenu) errors.push('#nautilus-path-menu absent');
    if (!headerbar.filterMenu) errors.push('#nautilus-search-filter-menu absent');
    if (!headerbar.viewMenu) errors.push('#nautilus-view-menu absent');
    if (!headerbar.breadcrumbDefault) errors.push('fil d’Ariane non visible par défaut');

    await page.click('div[data-link="nemo"] .nautilus-app__sidebar-menu-btn');
    await page.waitForTimeout(200);
    const mainMenuOpen = await page.evaluate(() => {
        const menu = document.querySelector('#nautilus-main-menu');
        return menu && !menu.hidden;
    });
    if (!mainMenuOpen) errors.push('menu principal ☰ ne s’ouvre pas');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    await page.click('div[data-link="nemo"] .nautilus-app__plate-search');
    await page.waitForTimeout(150);
    const searchEverywhere = await page.evaluate(() => {
        const empty = document.querySelector('#nautilus-search-empty');
        const input = document.querySelector('#nemo-search-input');
        return {
            mode: window.fileExplorerState?.nautilusChromeMode,
            emptyVisible: empty && !empty.hidden,
            focused: document.activeElement && document.activeElement.id === 'nemo-search-input',
        };
    });
    if (searchEverywhere.mode !== 'search-everywhere') {
        errors.push(`loupe plateau: mode=${searchEverywhere.mode} (attendu search-everywhere)`);
    }
    if (!searchEverywhere.emptyVisible) errors.push('empty state Rechercher partout absent');
    if (!searchEverywhere.focused) errors.push('loupe plateau titre ne focus pas la recherche');

    await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
    await page.waitForTimeout(500);

    const docs = await page.evaluate(() => ({
        path: window.getExplorerCurrentPath('nemo'),
        active: !!document.querySelector('#voletnemo a[data-link="Documents"].nemo-sidebar__link--active'),
    }));
    if (!docs.path.endsWith('/Documents')) {
        errors.push(`navigation Documents: path=${docs.path}`);
    }

    const docsPath = docs.path;
    await page.keyboard.press('Control+t');
    await page.waitForTimeout(500);
    const tabIsolation = await page.evaluate((expectedDocs) => {
        const tabs = [...document.querySelectorAll('#nautilus-tabstrip .nautilus-app__tab')];
        const activePath = window.getExplorerCurrentPath('nemo');
        const firstTabId = tabs[0]?.dataset?.tabId;
        return { count: tabs.length, firstTabId, activePath, expectedDocs };
    }, docsPath);
    if (tabIsolation.count < 2) {
        errors.push(`onglets isolés: count=${tabIsolation.count}`);
    } else if (!tabIsolation.activePath.endsWith('/Documents') && !tabIsolation.activePath.includes('Dossier')) {
        /* nouvel onglet = home */
    }
    if (tabIsolation.firstTabId) {
        await page.click(`#nautilus-tabstrip .nautilus-app__tab[data-tab-id="${tabIsolation.firstTabId}"]`);
        await page.waitForTimeout(500);
        const restored = await page.evaluate(() => window.getExplorerCurrentPath('nemo'));
        if (!restored.endsWith('/Documents')) {
            errors.push(`onglet 1 restauré: path=${restored} (attendu Documents)`);
        }
        const stored = await page.evaluate(() => {
            const key = `capsule-nautilus-tabs:${document.body.id}:${window.getFileExplorerRoot()}`;
            const raw = localStorage.getItem(key);
            if (!raw) return { ok: false };
            const data = JSON.parse(raw);
            return { ok: Array.isArray(data.tabs) && data.tabs.length >= 2 };
        });
        if (!stored.ok) errors.push('localStorage onglets absent ou incomplet');
    }

    await page.click('div[data-link="nemo"] #voletnemo a[data-link="Dossier Personnel"]');
    await page.waitForTimeout(350);
    await page.click('div[data-link="nemo"] #precedent');
    await page.waitForTimeout(350);
    const backNav = await page.evaluate(() => window.getExplorerCurrentPath('nemo'));
    if (!backNav.endsWith('/Documents')) {
        errors.push(`bouton Précédent: path=${backNav}`);
    }

    await page.click('div[data-link="nemo"] a[data-view-mode="icons"]');
    await page.waitForTimeout(250);
    const iconsViewBtn = await page.evaluate(() => {
        const btn = document.querySelector('div[data-link="nemo"] a[data-view-mode="icons"]');
        const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
        return {
            ariaCurrent: btn?.getAttribute('aria-current') === 'true',
            icons: grid?.classList.contains('nemo-app__content-grid--icons'),
        };
    });
    if (!iconsViewBtn.ariaCurrent || !iconsViewBtn.icons) {
        errors.push('bouton vue icônes inactif');
    }

    await page.click('div[data-link="nemo"] .nautilus-app__view-menu-btn');
    await page.waitForTimeout(200);
    const viewMenuOpen = await page.evaluate(() => {
        const menu = document.querySelector('#nautilus-view-menu');
        return menu && !menu.hidden;
    });
    if (!viewMenuOpen) errors.push('menu autres vues ne s’ouvre pas');

    await page.click('div[data-link="nemo"] .nautilus-app__new-folder-btn');
    await page.waitForTimeout(600);

    const created = await page.evaluate(() => {
        const name = window.__smokeFolderName;
        const win = document.querySelector('div[data-link="nemo"]');
        const link = win?.querySelector(`.nemoElement a[data-item-name="${name}"]`);
        return { name, created: !!link };
    });
    if (!created.created) {
        errors.push('nouveau dossier non créé via bouton header');
    }

    await page.click('div[data-link="nemo"] #voletnemo a[data-link="Favoris"]');
    await page.waitForTimeout(400);
    const favorisEmpty = await page.evaluate(() => ({
        path: window.getExplorerCurrentPath('nemo'),
        expected: window.CAPSULE_PLACE_STARRED,
        empty: !!document.querySelector('.nautilus-folder-empty--star'),
    }));
    if (favorisEmpty.path !== favorisEmpty.expected) {
        errors.push(`Favoris: path=${favorisEmpty.path}`);
    }
    if (!favorisEmpty.empty) errors.push('empty state Favoris absent');

    await page.click('div[data-link="nemo"] #voletnemo a[data-link="Réseau"]');
    await page.waitForTimeout(400);
    const networkUi = await page.evaluate(() => ({
        path: window.getExplorerCurrentPath('nemo'),
        expected: window.CAPSULE_PLACE_NETWORK,
        empty: !!document.querySelector('.nautilus-folder-empty--network'),
        bar: !!document.querySelector('#nautilus-network-bar:not([hidden])'),
    }));
    if (networkUi.path !== networkUi.expected) {
        errors.push(`Réseau: path=${networkUi.path}`);
    }
    if (!networkUi.empty) errors.push('empty state Réseau absent');
    if (!networkUi.bar) errors.push('barre réseau absente');

    await page.click('div[data-link="nemo"] #voletnemo a[data-link="Corbeille"]');
    await page.waitForTimeout(400);
    const trash = await page.evaluate(() => ({
        path: window.getExplorerCurrentPath('nemo'),
        expected: window.CAPSULE_PLACE_TRASH,
    }));
    if (trash.path !== trash.expected) {
        errors.push(`Corbeille: path=${trash.path}`);
    }

    await page.keyboard.press('Control+h');
    await page.waitForTimeout(300);
    const hiddenOn = await page.evaluate(() => window.fileExplorerState?.showHiddenFiles === true);
    if (!hiddenOn) {
        errors.push('Ctrl+H n’active pas showHiddenFiles');
    }

    await page.keyboard.press('Control+2');
    await page.waitForTimeout(300);
    const listView = await page.evaluate(() => {
        const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
        return grid?.classList.contains('nemo-app__content-grid--list');
    });
    if (!listView) {
        errors.push('Ctrl+2 n’active pas la vue liste');
    }

    await page.evaluate(() => {
        const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
        grid?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 320, clientY: 280 }));
    });
    await page.waitForTimeout(200);
    const menuOpen = await page.evaluate(() => {
        const menu = document.querySelector('#nemo-context-menu');
        return menu && !menu.hidden;
    });
    if (!menuOpen) {
        errors.push('menu contextuel zone fichiers ne s’ouvre pas');
    }

    await page.evaluate(() => {
        document.documentElement.dataset.theme = 'light';
        document.dispatchEvent(new CustomEvent('capsule:gnome-theme-changed', { detail: { theme: 'light' } }));
    });
    await page.waitForTimeout(200);
    const lightTheme = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        const bg = win && getComputedStyle(win).backgroundColor;
        return { theme: document.documentElement.dataset.theme, bg };
    });
    if (lightTheme.theme !== 'light') {
        errors.push('bascule thème clair non appliquée');
    }

    await page.evaluate(() => {
        document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(150);
    const darkBg = await page.evaluate(() => {
        const win = document.querySelector('div[data-link="nemo"]');
        return win ? getComputedStyle(win).backgroundColor : '';
    });
    if (darkBg === lightTheme.bg) {
        errors.push('Nautilus inchangé entre thème clair et sombre');
    }

    await page.evaluate(() => {
        if (typeof window.openExplorerProperties === 'function') {
            window.openExplorerProperties(null);
        }
    });
    await page.waitForTimeout(150);
    const propsOpen = await page.evaluate(() => {
        const dialog = document.querySelector('#nemo-properties-dialog');
        return !!(dialog && dialog.open);
    });
    if (!propsOpen) {
        errors.push('dialogue Propriétés ne s’ouvre pas');
    }
} catch (error) {
    errors.push(error.message);
} finally {
    await page.close();
    await browser.close();
}

if (errors.length) {
    console.error('smoke-gnome-nautilus-interactions — échec\n');
    errors.forEach((e) => console.error(`  • ${e}`));
    process.exit(1);
}

console.log('✓ smoke-gnome-nautilus-interactions OK — Rocky GNOME Nautilus');
