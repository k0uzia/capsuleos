#!/usr/bin/env node
/**
 * Gate Pm_Σ — modules pédagogiques sous mnt/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/pedagogical-modules.json');
const MNT = path.join(ROOT, 'mnt');
const CATALOG = path.join(MNT, 'catalog.json');

const errors = [];

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const levels = new Set(contract.levels.map((level) => level.id));
const required = contract.moduleSchema.required;

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        errors.push(`${filePath}: JSON invalide (${error.message})`);
        return null;
    }
}

if (!fs.existsSync(CATALOG)) {
    errors.push('mnt/catalog.json manquant');
} else {
    const catalog = readJson(CATALOG);
    if (catalog && Array.isArray(catalog.levels)) {
        catalog.levels.forEach((entry) => {
            if (!levels.has(entry.id)) {
                errors.push(`catalog: niveau inconnu ${entry.id}`);
            }
            (entry.modules || []).forEach((moduleId) => {
                const manifestPath = path.join(MNT, entry.path || entry.id, moduleId, 'module.json');
                if (!fs.existsSync(manifestPath)) {
                    errors.push(`Pm: module catalogue absent ${entry.id}/${moduleId}`);
                    return;
                }
                const manifest = readJson(manifestPath);
                if (!manifest) {
                    return;
                }
                required.forEach((key) => {
                    if (manifest[key] === undefined || manifest[key] === '') {
                        errors.push(`${manifestPath}: champ requis manquant ${key}`);
                    }
                });
                if (manifest.level && manifest.level !== entry.id) {
                    errors.push(`${manifestPath}: level ${manifest.level} ≠ catalogue ${entry.id}`);
                }
                (manifest.scenarios || []).forEach((scenarioRel) => {
                    const scenarioPath = path.join(path.dirname(manifestPath), scenarioRel);
                    if (!fs.existsSync(scenarioPath)) {
                        errors.push(`${manifestPath}: scénario manquant ${scenarioRel}`);
                    } else {
                        const scenario = readJson(scenarioPath);
                        if (scenario && scenario.moduleId && scenario.moduleId !== manifest.id) {
                            errors.push(`${scenarioPath}: moduleId ${scenario.moduleId} ≠ ${manifest.id}`);
                        }
                    }
                });
            });
        });
    }
}

if (errors.length) {
    console.error('validate-pedagogical-modules: ÉCHEC');
    errors.forEach((message) => console.error(`  - ${message}`));
    process.exitCode = 1;
} else {
    console.log('✓ validate-pedagogical-modules OK');
}
