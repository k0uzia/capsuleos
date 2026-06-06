#!/usr/bin/env node
/**
 * Smoke Paramètres GNOME — parité contrôles ↔ gnome-settings-parity.js.
 * Statique : toujours. Playwright : si CAPSULE_HTTP_BASE défini ou serveur local détecté.
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gnome-settings-interactions.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-settings-interactions.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

function read(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        errors.push(`Fichier manquant: ${rel}`);
        return '';
    }
    return fs.readFileSync(abs, 'utf8');
}

function extractIds(html, attr) {
    const re = new RegExp(`${attr}="([^"]+)"`, 'g');
    const ids = new Set();
    let m;
    while ((m = re.exec(html)) !== null) {
        ids.add(m[1]);
    }
    return ids;
}

function extractHandlerKeys(js, objectName) {
    const block = js.match(new RegExp(`const ${objectName} = \\{([\\s\\S]*?)\\n    \\};`));
    if (!block) {
        return new Set();
    }
    const keys = new Set();
    const re = /^\s{8}(?:'([^']+)'|([a-z][a-z0-9-]*)):\s*\{/gm;
    let m;
    while ((m = re.exec(block[1])) !== null) {
        keys.add(m[1] || m[2]);
    }
    return keys;
}

const parityJs = read('usr/lib/capsuleos/shells/linux/gnome-settings-parity.js');
const themesHtml = read('usr/share/capsuleos/linux/apps/themes_gnome.html');
const themesJs = read('usr/lib/capsuleos/shells/linux/themes.js');
const rockyIndex = read('home/RedHat/Rocky/index.html');

if (!parityJs.includes('CapsuleGnomeSettingsParity')) {
    errors.push('gnome-settings-parity.js : API CapsuleGnomeSettingsParity absente');
}
if (!parityJs.includes('filterSettingsSearch')) {
    errors.push('gnome-settings-parity.js : filterSettingsSearch absent');
}
if (!parityJs.includes('cycleSelectById')) {
    errors.push('gnome-settings-parity.js : cycleSelectById absent');
}
if (!themesJs.includes('CapsuleGnomeSettingsParity')) {
    errors.push('themes.js : délégation vers CapsuleGnomeSettingsParity absente');
}
if (!rockyIndex.includes('gnome-gsettings-bindings.js')) {
    errors.push('Rocky index.html : script gnome-gsettings-bindings.js absent');
}
if (!rockyIndex.includes('gnome-gsettings-store.js')) {
    errors.push('Rocky index.html : script gnome-gsettings-store.js absent');
}
const bindingsPos = rockyIndex.indexOf('gnome-gsettings-bindings.js');
const storePos = rockyIndex.indexOf('gnome-gsettings-store.js');
if (bindingsPos >= 0 && storePos >= 0 && bindingsPos > storePos) {
    errors.push('Rocky index.html : gnome-gsettings-bindings.js doit précéder gnome-gsettings-store.js');
}
if (!rockyIndex.includes('gnome-settings-parity.js')) {
    errors.push('Rocky index.html : script gnome-settings-parity.js absent');
}
const gsettingsJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js');
if (!gsettingsJs.includes('CapsuleGnomeGSettings')) {
    errors.push('gnome-gsettings-store.js : API CapsuleGnomeGSettings absente');
}
if (!parityJs.includes('CapsuleGnomeGSettings')) {
    errors.push('gnome-settings-parity.js : délégation gsettings absente');
}
if (!themesHtml.includes('data-settings-apply="network-identity"')) {
    errors.push('themes_gnome.html : network-identity non câblé');
}

const switchHandlers = extractHandlerKeys(parityJs, 'SWITCH_HANDLERS');
const selectHandlers = extractHandlerKeys(parityJs, 'SELECT_HANDLERS');
const sliderHandlers = extractHandlerKeys(parityJs, 'SLIDER_HANDLERS');
const htmlSwitches = extractIds(themesHtml, 'data-settings-switch');
const htmlSelects = extractIds(themesHtml, 'data-settings-apply');
const htmlSliders = extractIds(themesHtml, 'data-settings-slider');

for (const id of switchHandlers) {
    if (!htmlSwitches.has(id)) {
        errors.push(`Switch handler "${id}" sans contrôle HTML`);
    }
}
for (const id of htmlSwitches) {
    if (!switchHandlers.has(id)) {
        errors.push(`Switch HTML "${id}" sans handler parity`);
    }
}
for (const id of selectHandlers) {
    if (!htmlSelects.has(id) && !['display-resolution', 'display-scale', 'display-orientation'].includes(id)) {
        const hasValueEl = themesHtml.includes(`data-settings-value="${id}"`);
        if (!hasValueEl && !htmlSelects.has(id)) {
            errors.push(`Select handler "${id}" sans contrôle HTML`);
        }
    }
}
for (const id of htmlSliders) {
    if (!sliderHandlers.has(id)) {
        errors.push(`Slider HTML "${id}" sans handler parity`);
    }
}

const panelCount = (themesHtml.match(/data-gnome-settings-panel="/g) || []).length;
const navCount = (themesHtml.match(/class="gnome-settings__navitem"/g) || []).length;
if (navCount < 17) {
    errors.push(`themes_gnome.html : ${navCount} entrées nav (attendu ≥ 17)`);
}
if (panelCount < 17) {
    errors.push(`themes_gnome.html : ${panelCount} panneaux (attendu ≥ 17)`);
}

const GNOME_INDEX = [
    'home/RedHat/Rocky/index.html',
    'home/RedHat/Fedora/index.html',
    'home/RedHat/Alma/index.html',
    'home/Debian/Ubuntu/index.html',
];
for (const rel of GNOME_INDEX) {
    const html = read(rel);
    if (!html.includes('gnome-settings-parity.js')) {
        errors.push(`${rel} : gnome-settings-parity.js absent`);
    }
}

async function runPlaywright() {
    const base = (process.env.CAPSULE_HTTP_BASE || '').replace(/\/$/, '');
    if (!base) {
        return;
    }
    let chromium;
    try {
        ({ chromium } = await import('playwright'));
    } catch {
        errors.push('Playwright indisponible pour tests interactifs');
        return;
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(`${base}/home/RedHat/Rocky/index.html`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForFunction(() => typeof window.CapsuleGnomeSettingsParity === 'object', null, { timeout: 30000 });

        await page.evaluate(() => {
            if (typeof window.openWindowByDataLink === 'function') {
                window.openWindowByDataLink('themes');
            }
        });
        await page.waitForTimeout(1200);

        const panels = await page.evaluate(() => {
            const root = document.querySelector('#themes #themesApp');
            if (!root) {
                return { error: 'themesApp absent' };
            }
            const navItems = [...root.querySelectorAll('[data-gnome-settings-panel]')].filter((el) => el.classList.contains('gnome-settings__navitem'));
            const results = [];
            for (const nav of navItems) {
                const panelId = nav.getAttribute('data-gnome-settings-panel');
                nav.click();
                const panel = root.querySelector(`.gnome-settings__panel[data-gnome-settings-panel="${panelId}"]`);
                const switches = [...(panel || root).querySelectorAll('[data-settings-switch]')];
                const selects = [...(panel || root).querySelectorAll('[data-settings-apply]')];
                const sliders = [...(panel || root).querySelectorAll('[data-settings-slider]')];
                for (const sw of switches) {
                    const id = sw.getAttribute('data-settings-switch');
                    const before = sw.getAttribute('aria-checked');
                    sw.click();
                    const after = sw.getAttribute('aria-checked');
                    const lsKey = window.CapsuleGnomeSettingsParity.SWITCH_HANDLERS[id]?.key;
                    const persisted = lsKey ? localStorage.getItem(lsKey) : null;
                    results.push({ panelId, type: 'switch', id, toggled: before !== after, persisted });
                }
                for (const row of selects) {
                    const id = row.getAttribute('data-settings-apply');
                    const valueEl = row.querySelector('.adw-row__value');
                    const before = valueEl ? valueEl.textContent.trim() : '';
                    row.click();
                    const after = valueEl ? valueEl.textContent.trim() : '';
                    results.push({ panelId, type: 'select', id, changed: before !== after, after });
                }
                for (const slider of sliders) {
                    const id = slider.getAttribute('data-settings-slider');
                    const next = slider.value === '0' ? '40' : '0';
                    slider.value = next;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    const lsKey = window.CapsuleGnomeSettingsParity.SLIDER_HANDLERS[id]?.key;
                    const persisted = lsKey ? localStorage.getItem(lsKey) : null;
                    results.push({ panelId, type: 'slider', id, persisted, value: next });
                }
            }
            return { results, datasets: { ...document.documentElement.dataset } };
        });

        if (panels.error) {
            errors.push(`Playwright : ${panels.error}`);
        } else {
            const failedSwitches = panels.results.filter((r) => r.type === 'switch' && !r.toggled);
            if (failedSwitches.length) {
                errors.push(`Playwright : ${failedSwitches.length} switch(es) sans bascule`);
            }
            const failedSelects = panels.results.filter((r) => r.type === 'select' && !r.changed);
            if (failedSelects.length > 3) {
                errors.push(`Playwright : ${failedSelects.length} select(s) sans changement`);
            }
        }

        const qsBtn = await page.$('#tray-quick-settings-btn');
        if (qsBtn) {
            await qsBtn.click();
            await page.waitForTimeout(400);
        }
        const searchTest = await page.evaluate(() => {
            const root = document.querySelector('#themes #themesApp');
            const parity = window.CapsuleGnomeSettingsParity;
            if (!root || !parity || typeof parity.filterSettingsSearch !== 'function') {
                return { error: 'recherche paramètres indisponible' };
            }
            const panel = parity.filterSettingsSearch(root, 'éclairage');
            const hit = root.querySelector('.adw-row.is-search-hit');
            return { panel, hasHit: !!hit, panelIsDisplays: panel === 'displays' };
        });
        if (searchTest.error) {
            errors.push(`Playwright : ${searchTest.error}`);
        } else if (!searchTest.hasHit || !searchTest.panelIsDisplays) {
            errors.push('Playwright : recherche profonde Paramètres (éclairage → Écrans) échouée');
        }

        const dndTest = await page.evaluate(() => {
            const icon = document.querySelector('.quick-settings__tile-icon--dnd');
            const btn = icon ? icon.closest('.quick-settings__tile') : null;
            if (!btn) {
                return { error: 'tuile DND absente' };
            }
            const before = document.documentElement.dataset.dndEnabled || 'off';
            btn.click();
            const after = document.documentElement.dataset.dndEnabled || 'off';
            const gs = window.CapsuleGnomeGSettings;
            const ls = gs && gs.hasBinding('gnome-dnd-enabled')
                ? gs.getRaw('org.capsuleos.gnome.shell', 'dnd-enabled')
                : localStorage.getItem('gnome-dnd-enabled');
            const settingsSwitch = document.querySelector('#themes #themesApp [data-settings-switch="dnd"]');
            const switchChecked = settingsSwitch ? settingsSwitch.getAttribute('aria-checked') : null;
            return { before, after, ls, toggled: before !== after, switchChecked };
        });
        const perfTest = await page.evaluate(() => {
            const parity = window.CapsuleGnomeSettingsParity;
            const icon = document.querySelector('.quick-settings__tile-icon--performance');
            const btn = icon ? icon.closest('.quick-settings__tile') : null;
            if (!btn || !parity || typeof parity.cycleSelectById !== 'function') {
                return { error: 'tuile performance absente' };
            }
            const gs = window.CapsuleGnomeGSettings;
            const before = gs && gs.hasBinding('gnome-power-mode')
                ? gs.getCapsule('gnome-power-mode', 'Équilibré')
                : (localStorage.getItem('gnome-power-mode') || 'Équilibré');
            btn.click();
            const after = gs && gs.hasBinding('gnome-power-mode')
                ? gs.getCapsule('gnome-power-mode', 'Équilibré')
                : localStorage.getItem('gnome-power-mode');
            return { before, after, changed: before !== after };
        });
        if (perfTest.error) {
            errors.push(`Playwright : ${perfTest.error}`);
        } else if (!perfTest.changed) {
            errors.push('Playwright : tuile QS performance ne cycle pas power-mode');
        }

        await page.reload({ waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForFunction(() => typeof window.CapsuleGnomeSettingsParity === 'object', null, { timeout: 30000 });
        const persistTest = await page.evaluate(() => {
            const checks = [];
            const parity = window.CapsuleGnomeSettingsParity;
            const dynamic = localStorage.getItem('gnome-dynamic-workspaces');
            const dim = localStorage.getItem('gnome-power-dim-screen');
            checks.push({
                id: 'dynamic-workspaces',
                ok: dynamic != null && dynamic.length > 0,
                value: dynamic,
            });
            checks.push({
                id: 'dataset-dynamic',
                ok: document.documentElement.dataset.dynamicWorkspaces === 'on'
                    || document.documentElement.dataset.dynamicWorkspaces === 'off',
            });
            checks.push({
                id: 'power-dim',
                ok: dim != null && dim.length > 0,
                value: dim,
            });
            const baseline = window.CAPSULE_VM_SETTINGS_BASELINE;
            checks.push({
                id: 'vm-baseline',
                ok: baseline && Object.keys(baseline).length >= 20,
            });
            const merged = parity && parity.SELECT_HANDLERS
                ? parity.SELECT_HANDLERS['dynamic-workspaces']?.default
                : null;
            checks.push({
                id: 'parity-baseline-merge',
                ok: merged === 'Activé' || merged === 'Désactivé',
                value: merged,
            });
            return { checks, failed: checks.filter((c) => !c.ok).map((c) => c.id) };
        });
        if (persistTest.failed.length) {
            errors.push(`Playwright persistance : ${persistTest.failed.join(', ')}`);
        }

        if (dndTest.error) {
            errors.push(`Playwright : ${dndTest.error}`);
        } else if (!dndTest.toggled) {
            errors.push('Playwright : tuile QS DND ne bascule pas dataset.dndEnabled');
        } else {
            const expectedChecked = dndTest.after === 'on' ? 'true' : 'false';
            if (dndTest.switchChecked !== expectedChecked) {
                errors.push('Playwright : tuile QS DND désynchronisée du switch Paramètres');
            }
        }
    } catch (error) {
        errors.push(`Playwright : ${error.message}`);
    } finally {
        await browser.close();
    }
}

await runPlaywright();

if (errors.length) {
    console.error('smoke-gnome-settings-interactions — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

const mode = process.env.CAPSULE_HTTP_BASE ? 'statique + Playwright' : 'statique';
console.log(`✓ smoke-gnome-settings-interactions OK (${mode}) — ${switchHandlers.size} switches, ${selectHandlers.size} selects, ${sliderHandlers.size} sliders`);
