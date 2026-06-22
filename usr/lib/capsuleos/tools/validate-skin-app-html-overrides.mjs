#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate R-CENTRAL-SLOT — gabarits fonctionnels Z1, pas d'override HTML skin hors allowlist.
 * Complète R-FF-SLOT (Firefox) : convention-contrib-apps.md §8.
 *
 * Usage : node usr/lib/capsuleos/tools/validate-skin-app-html-overrides.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const HOME = path.join(ROOT, 'home');

/** Overrides menu / kickoff légitimes (variant toolkit local au profil). */
const ALLOWED_SKIN_APP_HTML = new Set([
    'mainMenu.html',
    'mainMenu-gnome.html',
]);

const errors = [];

function walkSkinAppHtml(dir) {
    const found = [];
    if (!fs.existsSync(dir)) {
        return found;
    }
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            found.push(...walkSkinAppHtml(abs));
        } else if (ent.isFile() && ent.name.endsWith('.html')) {
            found.push(abs);
        }
    }
    return found;
}

for (const abs of walkSkinAppHtml(HOME)) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (!/\/apps\/[^/]+\.html$/.test(rel)) {
        continue;
    }
    const fileName = path.basename(abs);
    if (ALLOWED_SKIN_APP_HTML.has(fileName)) {
        continue;
    }
    errors.push(
        `${rel} : override HTML skin interdit (R-CENTRAL-SLOT) — `
        + 'promouvoir en usr/share/capsuleos/linux/apps/ + CAPSULE_TEMPLATE_OVERRIDES'
    );
}

if (errors.length) {
    console.error(`✗ validate-skin-app-html-overrides — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log('✓ validate-skin-app-html-overrides OK — aucun override HTML skin hors allowlist');
