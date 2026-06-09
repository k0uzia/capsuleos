#!/usr/bin/env node
/**
 * Validation légère CapsuleOS (registre, façades, scripts kernel).
 * Usage : node usr/lib/capsuleos/tools/validate-capsule.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

const registryPath = path.join(ROOT, 'etc/capsuleos/os-registry.json');
if (!fs.existsSync(registryPath)) {
    errors.push('etc/capsuleos/os-registry.json manquant');
} else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const active = registry.entries.filter((e) => e.status === 'active');

    const strictTiers = new Set(['P0', 'P1']);

    active.forEach((entry) => {
        if (entry.facade) {
            const facadePath = path.join(ROOT, entry.facade);
            if (!fs.existsSync(facadePath)) {
                errors.push(`Façade introuvable: ${entry.facade} (${entry.id})`);
            } else {
                const html = fs.readFileSync(facadePath, 'utf8');
                const needsCapsuleWindow = ['linux', 'windows', 'macos'].includes(entry.family);
                if (needsCapsuleWindow && !html.includes('capsule-window.js')) {
                    const msg = `${entry.id}: capsule-window.js absent de la façade`;
                    if (strictTiers.has(entry.tier)) errors.push(msg);
                    else warnings.push(msg);
                }
                if (
                    entry.family === 'linux' &&
                    (!html.includes('capsule-resource.js') || !html.includes('capsule-skin-boot.js'))
                ) {
                    errors.push(`${entry.id}: boot assets manquant sur la façade Linux`);
                }
            }
        }
        if (entry.skin) {
            const skinPath = path.join(ROOT, entry.skin);
            if (!fs.existsSync(skinPath)) {
                warnings.push(`Skin miroir introuvable: ${entry.skin} (${entry.id})`);
            }
        }
    });

    console.log(`Registre: ${registry.entries.length} entrées, ${active.length} actives`);
}

const assetsManifest = path.join(ROOT, 'usr/share/capsuleos/assets/manifest.json');
if (!fs.existsSync(assetsManifest)) {
    warnings.push('usr/share/capsuleos/assets/manifest.json manquant');
}

const deadPatterns = ['site/windowDrag.js', 'site/windowContainer.js', 'kernel/js/windowDrag.js'];
const indexFiles = [];
function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, name.name);
        if (name.isDirectory() && name.name !== 'node_modules' && name.name !== '.git') {
            walk(p);
        } else if (name.name === 'index.html') {
            indexFiles.push(p);
        }
    }
}
walk(ROOT);

indexFiles.forEach((file) => {
    const html = fs.readFileSync(file, 'utf8');
    deadPatterns.forEach((pat) => {
        if (html.includes(pat)) {
            errors.push(`Référence morte ${pat} dans ${path.relative(ROOT, file)}`);
        }
    });
});

console.log(`Index HTML scannés: ${indexFiles.length}`);

const winBoot = spawnSync(process.execPath, ['usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
});
if (winBoot.status !== 0) {
    const out = (winBoot.stdout || '') + (winBoot.stderr || '');
    out.split('\n').filter(Boolean).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
}

const agentSkills = spawnSync(process.execPath, ['usr/lib/capsuleos/tools/validate-agent-skills.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
});
if (agentSkills.status !== 0) {
    const out = (agentSkills.stdout || '') + (agentSkills.stderr || '');
    out.split('\n').filter(Boolean).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
}

const toolkitBoot = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/validate-linux-toolkit-boot.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (toolkitBoot.status !== 0) {
    const out = (toolkitBoot.stdout || '') + (toolkitBoot.stderr || '');
    out.split('\n').filter((line) => line.trim()).forEach((line) => errors.push(line.replace(/^  ✗\s*/, '').replace(/^✗\s*/, '')));
}

const taxonomy = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/validate-taxonomy.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (taxonomy.status !== 0) {
    const out = (taxonomy.stdout || '') + (taxonomy.stderr || '');
    out.split('\n')
        .filter((line) => line.indexOf('✗') >= 0)
        .forEach((line) => errors.push(line.replace(/^  ✗\s*/, '').replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('Taxonomie — validate-taxonomy.mjs');
    }
}

const terminalInventory = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/validate-terminal-inventory.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (terminalInventory.status !== 0) {
    const out = (terminalInventory.stdout || '') + (terminalInventory.stderr || '');
    out.split('\n').filter((line) => line.trim()).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('terminal-inventory — validate-terminal-inventory.mjs');
    }
}

const gnomeSettingsPbSigma = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/validate-gnome-settings-pbsigma.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (gnomeSettingsPbSigma.status !== 0) {
    const out = (gnomeSettingsPbSigma.stdout || '') + (gnomeSettingsPbSigma.stderr || '');
    out.split('\n').filter((line) => line.trim()).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('gnome-settings-pbsigma — validate-gnome-settings-pbsigma.mjs');
    }
}

const fsRouting = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/validate-fs-routing.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (fsRouting.status !== 0) {
    const out = (fsRouting.stdout || '') + (fsRouting.stderr || '');
    out.split('\n').filter((line) => line.trim()).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('FS routing — validate-fs-routing.mjs');
    }
}

const clusterRegistry = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/build-cluster-registry.mjs', '--check'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (clusterRegistry.status !== 0) {
    const out = (clusterRegistry.stdout || '') + (clusterRegistry.stderr || '');
    out.split('\n').filter((line) => line.trim()).forEach((line) => errors.push(line.replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('cluster-registry — build-cluster-registry.mjs --check');
    }
}

const linuxFacades = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/linux/validate-linux-facades.mjs'],
    { cwd: ROOT, encoding: 'utf8' }
);
const osFacadeFidelity = spawnSync(
    process.execPath,
    ['usr/lib/capsuleos/tools/linux/validate-os-facade-fidelity.mjs', '--id', 'linux-rocky'],
    { cwd: ROOT, encoding: 'utf8' }
);
if (osFacadeFidelity.status !== 0) {
    const out = (osFacadeFidelity.stdout || '') + (osFacadeFidelity.stderr || '');
    out.split('\n')
        .filter((line) => line.indexOf('✗') >= 0)
        .forEach((line) => errors.push(line.replace(/^  ✗\s*/, '').replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('Façade OS Rocky — validate-os-facade-fidelity.mjs');
    }
}
if (linuxFacades.status !== 0) {
    const out = (linuxFacades.stdout || '') + (linuxFacades.stderr || '');
    out.split('\n')
        .filter((line) => line.indexOf('✗') === 0 || line.indexOf('désynchronisée') >= 0 || line.indexOf('Façade') >= 0)
        .forEach((line) => errors.push(line.replace(/^  ✗\s*/, '').replace(/^✗\s*/, '')));
    if (!errors.length) {
        errors.push('Façades Linux désynchronisées — node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs');
    }
}

if (warnings.length) {
    console.warn('\nAvertissements:');
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}
if (errors.length) {
    console.error('\nErreurs:');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}
console.log('\n✓ validate-capsule OK');
