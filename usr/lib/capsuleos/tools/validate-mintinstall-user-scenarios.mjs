#!/usr/bin/env node
/**
 * Gate ScΣ cinnamon — contrat mintinstall-user-scenarios + kernel Logithèque.
 * Usage : node usr/lib/capsuleos/tools/validate-mintinstall-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const errors = [];

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/mintinstall-user-scenarios.json');
if (!fs.existsSync(contractPath)) {
    console.error('✗ mintinstall-user-scenarios.json manquant');
    process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const html = fs.readFileSync(
    path.join(ROOT, 'usr/share/capsuleos/linux/apps/mintinstall.html'),
    'utf8'
);
const kernel = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mintinstall.js'),
    'utf8'
);
const storeKernel = fs.readFileSync(
    path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mint-store-catalog.js'),
    'utf8'
);
const catalogPath = path.join(ROOT, 'home/Debian/Mint/content/mintinstall-catalog.json');
if (!fs.existsSync(catalogPath)) {
    errors.push('mintinstall-catalog.json manquant');
}

const requiredSelectors = [
    'data-mi-discover-grid',
    'data-mi-install',
    'data-mi-open',
    'data-mi-cat',
    '#mi-search',
    'data-mi-detail-install',
    'data-mi-page',
];

requiredSelectors.forEach((sel) => {
    if (!html.includes(sel) && !kernel.includes(sel)) {
        errors.push(`Sélecteur ScΣ manquant: ${sel}`);
    }
});

if (!kernel.includes('CapsuleMintStore')) {
    errors.push('mintinstall.js ne consomme pas CapsuleMintStore');
}
if (!kernel.includes('CAPSULE_MINTINSTALL_CATALOG') && !kernel.includes('getSkinCatalog')) {
    errors.push('mintinstall.js ne consomme pas CAPSULE_MINTINSTALL_CATALOG');
}
if (!kernel.includes('openWindowByDataLink')) {
    errors.push('mintinstall.js : récursion openWindowByDataLink absente');
}
if (!kernel.includes('dataset.miScenario')) {
    errors.push('mintinstall.js : dataset.miScenario absent');
}
if (!kernel.includes('dataset.miInstalling')) {
    errors.push('mintinstall.js : dataset.miInstalling absent');
}
if (!storeKernel.includes('CapsuleMintStore')) {
    errors.push('mint-store-catalog.js : CapsuleMintStore absent');
}

const scenarios = contract.scenarios || [];
const ids = scenarios.map((s) => s.id);
['Mi1', 'Mi2', 'Mi3', 'Mi4', 'Mi5', 'Mi6', 'Mi7', 'Mi8', 'Mi9', 'Mi10', 'Mi11', 'Mi12'].forEach((id) => {
    if (!ids.includes(id)) {
        errors.push(`Scénario ${id} absent du contrat`);
    }
});

scenarios.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
        errors.push(`${scenario.id} : proofs.smoke absent`);
    }
    (scenario.steps || []).forEach((step) => {
        if (step.predicate === 'dataset.miInstalling' && !kernel.includes('miInstalling')) {
            errors.push(`${scenario.id}: predicate miInstalling non implémenté`);
        }
        if (step.predicate === 'dataset.miScenario' && !kernel.includes('miScenario')) {
            errors.push(`${scenario.id}: predicate miScenario non implémenté`);
        }
    });
});

if (errors.length) {
    console.error(`✗ validate-mintinstall-user-scenarios — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log(`✓ validate-mintinstall-user-scenarios OK — ${scenarios.length} scénarios`);
process.exit(0);
