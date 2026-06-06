#!/usr/bin/env node
/**
 * Smoke navigateur — gabarit Nautilus (nautilus-app--n47) sur skins GNOME actifs.
 * Prérequis : serveur HTTP à la racine du dépôt (ex. python3 -m http.server 8765).
 * Usage : CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-routing.mjs
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const GNOME_SKINS = [
    { id: 'linux-rocky' },
    { id: 'linux-fedora' },
    { id: 'linux-ubuntu' },
];

const errors = [];
const browser = await chromium.launch({ headless: true });

for (const skin of GNOME_SKINS) {
    const page = await browser.newPage();
    try {
        await page.goto(resolveCapsuleOsUrl(skin.id, BASE), { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        const state = await page.evaluate(() => ({
            template: window.CAPSULE_EXPLORER_TEMPLATE,
            skinKey: window.CAPSULE_EXPLORER_SKIN_KEY,
            applied: window.CAPSULE_SKIN_PROFILE_APPLIED,
            isNemoTemplate: typeof window.isNemoTemplate === 'function' ? window.isNemoTemplate() : null,
            isNautilusGnome: typeof window.isNautilusGnomeTemplate === 'function' ? window.isNautilusGnomeTemplate() : null,
            hasNautilus47: !!document.querySelector('.nautilus-app--n47'),
            hasLegacyNemoOnly: !!document.querySelector('#nemo .nemo-app:not(.nautilus-app)'),
            hasLegacyNemoToolbar: !!document.querySelector('#nemo .nemo-app__toolbar:not(.nautilus-app__headerbar)'),
            hasNemoMenubar: !!document.querySelector('#nemo .nemo-app__menubar'),
            windowHeaderHidden: (() => {
                const wh = document.querySelector('#nemo > #windowHeader');
                return !wh || getComputedStyle(wh).display === 'none';
            })(),
            loadError: document.getElementById('nemo')?.textContent?.includes('Impossible de charger'),
        }));
        if (!state.applied) {
            errors.push(`${skin.id}: profil skin non appliqué`);
        }
        if (state.template !== 'nemo-gnome') {
            errors.push(`${skin.id}: CAPSULE_EXPLORER_TEMPLATE=${state.template} (attendu nemo-gnome)`);
        }
        if (state.skinKey !== 'nautilus') {
            errors.push(`${skin.id}: CAPSULE_EXPLORER_SKIN_KEY=${state.skinKey} (attendu nautilus)`);
        }
        if (!state.hasNautilus47) {
            errors.push(`${skin.id}: gabarit Nautilus 47 absent dans #nemo`);
        }
        if (state.hasLegacyNemoOnly) {
            errors.push(`${skin.id}: gabarit Nemo legacy encore injecté`);
        }
        if (state.loadError) {
            errors.push(`${skin.id}: erreur de chargement du slot nemo`);
        }
        if (state.isNemoTemplate === true) {
            errors.push(`${skin.id}: isNemoTemplate() actif (Nemo réservé à Mint/Cinnamon)`);
        }
        if (state.isNautilusGnome !== true) {
            errors.push(`${skin.id}: isNautilusGnomeTemplate() attendu`);
        }
        if (state.hasLegacyNemoToolbar) {
            errors.push(`${skin.id}: toolbar Nemo legacy (hors headerbar Nautilus 47)`);
        }
        if (state.hasNemoMenubar) {
            errors.push(`${skin.id}: menubar Nemo présent (réservé Cinnamon/Mint)`);
        }
        if (!state.windowHeaderHidden) {
            errors.push(`${skin.id}: #windowHeader CSD séparé (attendu chrome intégré Nautilus 47)`);
        }
    } catch (error) {
        errors.push(`${skin.id}: ${error.message}`);
    } finally {
        await page.close();
    }
}

await browser.close();

if (errors.length) {
    console.error('smoke-gnome-nautilus-routing — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log(`✓ smoke-gnome-nautilus-routing OK — ${GNOME_SKINS.length} skin(s) GNOME`);
