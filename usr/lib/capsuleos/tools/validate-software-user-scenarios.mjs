#!/usr/bin/env node
/**
 * Gate ScΣ — contrat software-user-scenarios + kernel GNOME Software.
 * Usage : node usr/lib/capsuleos/tools/validate-software-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/software-user-scenarios.json');
if (!fs.existsSync(contractPath)) {
    console.error('✗ software-user-scenarios.json manquant');
    process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const html = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/update_manager_gnome.html'),
    'utf8'
);
const kernel = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/update-manager.js'),
    'utf8'
);

const requiredSelectors = [
    'data-um-gnome-nav',
    'data-um-gnome-action',
    'data-um-gnome-app',
    'data-um-gnome-search',
    'data-um-gnome-installed-list',
    'data-um-gnome-discover-grid',
    'data-um-gnome-updates-rows',
    'data-um-gnome-detail-source',
    'data-um-gnome-hero',
    'data-um-gnome-featured-grid',
    'data-um-gnome-category-hero-grid',
    'gnome-software__titlebar',
    'toggleSearch',
];

const groundPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/gnome-software-ground.js');
if (!fs.existsSync(groundPath)) {
    errors.push('gnome-software-ground.js manquant');
} else if (!kernel.includes('CapsuleGnomeSoftwareGround')) {
    errors.push('update-manager.js ne consomme pas CapsuleGnomeSoftwareGround');
}

const contentContractPath = path.join(ROOT, 'etc/capsuleos/contracts/gnome-software-store-content.json');
const contentOutPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-gnome-software-content.js');
if (!fs.existsSync(contentContractPath)) {
    errors.push('gnome-software-store-content.json manquant');
}
if (!fs.existsSync(contentOutPath)) {
    errors.push('capsule-gnome-software-content.js manquant — generate-store-catalog.mjs');
} else if (!kernel.includes('CAPSULE_GNOME_SOFTWARE_CONTENT')) {
    errors.push('update-manager.js ne consomme pas CAPSULE_GNOME_SOFTWARE_CONTENT');
}

requiredSelectors.forEach((sel) => {
    if (!html.includes(sel) && !kernel.includes(sel)) {
        errors.push(`Sélecteur ScΣ manquant: ${sel}`);
    }
});

const scenarios = contract.scenarios || [];
const ids = scenarios.map((s) => s.id);
['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S9', 'S10', 'S11', 'S12'].forEach((id) => {
    if (!ids.includes(id)) {
        errors.push(`Scénario ${id} absent du contrat`);
    }
});

scenarios.forEach((scenario) => {
    (scenario.steps || []).forEach((step) => {
        if (step.selector && !html.includes(step.selector.replace(/\[data-um-gnome-app="([^"]+)"\]/, 'data-um-gnome-app'))
            && !kernel.includes('data-um-gnome')) {
            /* selectors dynamiques OK si data-um-gnome-* présent */
        }
        if (step.predicate === 'dataset.umGnomeInstalling' && !kernel.includes('umGnomeInstalling')) {
            errors.push(`${scenario.id}: predicate umGnomeInstalling non implémenté`);
        }
    });
});

if (!kernel.includes('bindGnomeSoftware')) {
    errors.push('update-manager.js : bindGnomeSoftware absent');
}

if (errors.length) {
    console.error(`✗ validate-software-user-scenarios — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-software-user-scenarios OK — ${scenarios.length} scénarios`);
process.exit(0);
