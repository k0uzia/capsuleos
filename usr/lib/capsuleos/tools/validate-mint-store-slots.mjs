#!/usr/bin/env node
/**
 * Vérifie que chaque app linux-mint storeInstallable possède un slot data-link dans Mint index.html.
 * Usage : node usr/lib/capsuleos/tools/validate-mint-store-slots.mjs
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];
const verified = [];

const generatedPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-store-catalog.js');
const indexPath = path.join(ROOT, 'home/Debian/Mint/index.html');

if (!fs.existsSync(generatedPath)) {
    console.error('✗ capsule-store-catalog.js manquant');
    process.exit(1);
}
if (!fs.existsSync(indexPath)) {
    console.error('✗ home/Debian/Mint/index.html manquant');
    process.exit(1);
}

const generatedRaw = fs.readFileSync(generatedPath, 'utf8');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const sandbox = { globalThis: {} };
try {
    vm.runInNewContext(generatedRaw, sandbox);
} catch (e) {
    console.error('✗ exécution capsule-store-catalog.js échouée');
    process.exit(1);
}

const mintApps = sandbox.globalThis.CAPSULE_STORE_APPS_BY_REGISTRY
    ? sandbox.globalThis.CAPSULE_STORE_APPS_BY_REGISTRY['linux-mint']
    : null;
if (!mintApps || !mintApps.length) {
    console.error('✗ catalogue linux-mint vide ou absent');
    process.exit(1);
}

const discoverApps = mintApps.filter((entry) => entry.storeInstallable === true);
const slotPattern = /data-link="([^"]+)"/g;
const slots = new Set();
let slotMatch;
while ((slotMatch = slotPattern.exec(indexHtml)) !== null) {
    slots.add(slotMatch[1]);
}

discoverApps.forEach((entry) => {
    const slot = entry.storeSlot || entry.slot || entry.postInstallSlot;
    if (!slot) {
        errors.push(`${entry.id} : storeSlot manquant`);
        return;
    }
    if (!slots.has(slot)) {
        errors.push(`${entry.id} → slot "${slot}" absent de Mint index.html`);
        return;
    }
    verified.push({ appId: entry.id, slot });
});

const requiredRecursionSlots = [
    'thunderbird', 'transmission', 'warpinator', 'librewriter',
    'rhythmbox', 'drawing', 'simple_scan', 'lecteur_multimedia', 'calendar', 'file_roller',
];
requiredRecursionSlots.forEach((slot) => {
    if (!slots.has(slot)) {
        errors.push(`slot récursion "${slot}" absent de Mint index.html`);
    }
});

if (errors.length) {
    console.error(`✗ validate-mint-store-slots — ${errors.length} erreur(s), ${verified.length} OK`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-mint-store-slots OK — ${verified.length} apps discover, ${requiredRecursionSlots.length} slots récursion`);
process.exit(0);
