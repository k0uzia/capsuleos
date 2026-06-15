#!/usr/bin/env node
/**
 * Gate référentiel commandes terminal — noyau, familles, vendor, registre, executeCommand.
 * Usage : node usr/lib/capsuleos/tools/validate-terminal-commands.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/terminal-commands.json');
const CORE_PATH = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/terminal/config/command-core.js');
const REGISTRY_PATH = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/terminal/config/command-registry.js');
const EXECUTOR_PATH = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/terminal/executeCommand.js');
const VENDOR_PATH = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/terminal/config/terminal-vendor-extensions.js');

const errors = [];

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function extractCoreFromJs(source) {
    const match = source.match(/const\s+CORE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
    if (!match) {
        return null;
    }
    return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractRegistryKeys(source) {
    const keys = new Set();
    const re = /^\s{8}([a-z][a-z0-9_-]*|'[^']+'):\s*\{/gm;
    let m;
    while ((m = re.exec(source)) !== null) {
        const raw = m[1];
        keys.add(raw.startsWith("'") ? raw.slice(1, -1) : raw);
    }
    return keys;
}

function extractExecutorCases(source) {
    const keys = new Set();
    const re = /case\s+'([^']+)':/g;
    let m;
    while ((m = re.exec(source)) !== null) {
        keys.add(m[1]);
    }
    return keys;
}

function extractVendorFromJs(source) {
    const vendors = {};
    const re = /registerVendorCommands\(\s*'([^']+)'\s*,\s*\[([\s\S]*?)\]\s*\)/g;
    let m;
    while ((m = re.exec(source)) !== null) {
        vendors[m[1]] = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    }
    return vendors;
}

function assertDisjoint(label, base, extra) {
    const overlap = extra.filter((c) => base.includes(c));
    if (overlap.length) {
        errors.push(`${label}: commandes en double avec le noyau — ${overlap.join(', ')}`);
    }
}

function assertSubset(label, commands, registry, executor) {
    commands.forEach((cmd) => {
        if (!registry.has(cmd)) {
            errors.push(`${label}: "${cmd}" absente du command-registry.js`);
        }
        if (!executor.has(cmd)) {
            errors.push(`${label}: "${cmd}" sans case dans executeCommand.js`);
        }
    });
}

if (!fs.existsSync(CONTRACT_PATH)) {
    errors.push('Contrat manquant: etc/capsuleos/contracts/terminal-commands.json');
    console.error(errors.join('\n'));
    process.exit(1);
}

const contract = JSON.parse(read(CONTRACT_PATH));
const coreJs = extractCoreFromJs(read(CORE_PATH));
const coreContract = contract.layers.core.commands;

if (!coreJs) {
    errors.push('command-core.js : liste CORE illisible');
} else if (coreJs.join(',') !== coreContract.join(',')) {
    errors.push('command-core.js diverge du contrat (layers.core.commands)');
}

const registry = extractRegistryKeys(read(REGISTRY_PATH));
const executor = extractExecutorCases(read(EXECUTOR_PATH));
const vendorJs = extractVendorFromJs(read(VENDOR_PATH));

assertSubset('core', coreContract, registry, executor);

Object.entries(contract.layers.families).forEach(([familyId, family]) => {
    assertDisjoint(`famille:${familyId}`, coreContract, family.commands);
    assertSubset(`famille:${familyId}`, family.commands, registry, executor);
    const profilePath = path.join(ROOT, family.profileScript);
    if (!fs.existsSync(profilePath)) {
        errors.push(`Profil famille manquant: ${family.profileScript}`);
    }
});

Object.entries(contract.layers.vendorExtensions || {}).forEach(([vendor, ext]) => {
    assertDisjoint(`vendor:${vendor}`, coreContract, ext.commands);
    assertSubset(`vendor:${vendor}`, ext.commands, registry, executor);
    const jsCommands = vendorJs[vendor];
    if (!jsCommands || jsCommands.join(',') !== ext.commands.join(',')) {
        errors.push(`vendor:${vendor} — terminal-vendor-extensions.js diverge du contrat`);
    }
});

[...registry].forEach((cmd) => {
    if (!executor.has(cmd)) {
        errors.push(`Registre "${cmd}" sans implémentation executeCommand`);
    }
});

const htmlFiles = [];
function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            if (name === 'node_modules' || name === '.git') continue;
            walk(full);
        } else if (name === 'index.html' && read(full).includes('command-registry.js')) {
            htmlFiles.push(full);
        }
    }
}
walk(path.join(ROOT, 'home'));
walk(path.join(ROOT, 'OS'));

const requiredSnippets = [
    'command-core.js',
    'terminal-profile-builder.js',
    'terminal-vendor-extensions.js',
    'terminal-package-managers.js',
    'terminal-shell-parse.js',
    'terminal-fs-ops.js',
    'terminal-processes.js',
    'terminal-network.js',
    'terminal-users.js',
];

Object.entries(contract.implementation?.modules || {}).forEach(([key, relPath]) => {
    const modulePath = path.join(ROOT, relPath);
    if (!fs.existsSync(modulePath)) {
        errors.push(`Module ${key} manquant: ${relPath}`);
    }
});

const coveragePath = contract.implementation?.coverageMatrix
    ? path.join(ROOT, contract.implementation.coverageMatrix)
    : null;
if (coveragePath && !fs.existsSync(coveragePath)) {
    errors.push(`Matrice couverture manquante: ${contract.implementation.coverageMatrix}`);
}

htmlFiles.forEach((filePath) => {
    const html = read(filePath);
    if (!html.includes('profiles/linux/')) return;
    requiredSnippets.forEach((snippet) => {
        if (!html.includes(snippet)) {
            errors.push(`${path.relative(ROOT, filePath)} : script ${snippet} non chargé`);
        }
    });
});

if (errors.length) {
    console.error('validate-terminal-commands — ÉCHEC\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}

console.log('✓ validate-terminal-commands OK');
console.log(`  noyau: ${coreContract.length} commandes`);
console.log(`  familles: ${Object.keys(contract.layers.families).length}`);
console.log(`  vendors: ${Object.keys(contract.layers.vendorExtensions || {}).length}`);
console.log(`  registre: ${registry.size} · exécuteur: ${executor.size}`);
