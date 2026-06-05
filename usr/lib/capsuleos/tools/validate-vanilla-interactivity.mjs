#!/usr/bin/env node
/**
 * Interactivité vanilla — init slots, chemins home/public, handlers explorateur.
 * Usage : node usr/lib/capsuleos/tools/validate-vanilla-interactivity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];

function must(rel, needles) {
    const full = path.join(ROOT, rel);
    const text = fs.readFileSync(full, 'utf8');
    needles.forEach((n) => {
        if (!text.includes(n)) {
            errors.push(`${rel}: attendu « ${n} »`);
        }
    });
}

must('usr/lib/capsuleos/shells/linux/contentLoader.js', [
    'SLOT_INIT_HANDLERS',
    'resolveRelative()',
    'ensureWindowChromeAfterSlotInject',
    'capsule:slot-injected',
]);
must('usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js', [
    'resolveRelative()',
    'bindFileExplorerNavigationControls',
    'bindNemoNavigationControls',
]);
must('usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerContainer.js', [
    'resolveRelative()',
    'initFileExplorerContainer',
]);
must('usr/lib/capsuleos/shells/linux/explorers/commons/explorer-home.js', [
    'resolveRelative()',
    'CapsuleExplorerHome',
]);

const loader = fs.readFileSync(path.join(ROOT, 'usr/lib/capsuleos/shells/linux/contentLoader.js'), 'utf8');
const slotBlock = loader.match(/nemo:\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},/);
if (slotBlock && slotBlock[0].includes('fromRepoDepth(3)')) {
    errors.push('contentLoader nemo: encore fromRepoDepth(3)');
}

const badPaths = [
    'usr/lib/capsuleos/shells/linux/terminal/virtual-shell.js',
];
badPaths.forEach((rel) => {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
        return;
    }
    const text = fs.readFileSync(full, 'utf8');
    if (text.includes('fromRepoDepth(3)') && !text.includes('resolveRelative()')) {
        errors.push(`${rel}: préférer resolveRelative() pour façades profondes`);
    }
});

if (errors.length) {
    console.error(`✗ validate-vanilla-interactivity — ${errors.length} erreur(s)`);
    errors.forEach((e) => console.error('  ', e));
    process.exit(1);
}

console.log('✓ validate-vanilla-interactivity OK');
process.exit(0);
