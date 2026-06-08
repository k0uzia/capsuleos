#!/usr/bin/env node
/**
 * Smoke T1–T8 — synchronisation terminal ↔ explorateur (CapsuleUserFs).
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fs-terminal-explorer-sync.mjs
 *   CAPSULE_HTTP_BASE=... node ... --profile=linux-ubuntu
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const profileArg = process.argv.find((a) => a.startsWith('--profile=') || a.startsWith('--id='));
const PROFILE = profileArg
  ? profileArg.split('=')[1]
  : (process.env.CAPSULE_SKIN_PROFILE || 'linux-rocky');
const SKIN = { id: PROFILE };

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

function gridNames(items) {
    return items.map((name) => String(name || ''));
}

try {
    await page.goto(resolveCapsuleOsUrl(SKIN.id, BASE), { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);

    const stamp = Date.now();
    await page.evaluate((ts) => {
        window.__smokeFsStamp = ts;
    }, stamp);

    await page.evaluate(() => window.openWindowByDataLink('nemo'));
    await page.waitForSelector('div[data-link="nemo"] .nautilus-app--n47', { timeout: 15000 });
    await page.waitForTimeout(800);

    const docsReady = await page.evaluate(async () => {
        if (!window.CapsuleUserFs || !window.CapsuleExplorerVfs) {
            return { ok: false, reason: 'CapsuleUserFs ou CapsuleExplorerVfs absent' };
        }
        await window.loadManifestForFileExplorer();
        const root = window.getFileExplorerRoot();
        const docsPath = `${root}/Documents`;
        await window.navigateToFileExplorerDirectory(docsPath);
        window.__smokeDocsPath = docsPath;
        return { ok: true, docsPath, current: window.getExplorerCurrentPath('nemo') };
    });

    if (!docsReady.ok) {
        errors.push(docsReady.reason || 'préparation Documents échouée');
        throw new Error('préparation explorateur — arrêt smoke');
    }
    if (!docsReady.current.endsWith('/Documents')) {
        errors.push(`navigation Documents: path=${docsReady.current}`);
        throw new Error('navigation Documents — arrêt smoke');
    }

    const runTerminalInDocs = async (command) => {
        const result = await page.evaluate(async (cmd) => {
            const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
            let fs = baseFs;
            let fileContents = {};
            let fileHrefs = {};
            if (window.CapsuleVirtualShell && typeof window.CapsuleVirtualShell.prepareTerminalFilesystem === 'function') {
                const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
                fs = hydration.fs || baseFs;
                fileContents = hydration.fileContents || fileContents;
                fileHrefs = hydration.fileHrefs || fileHrefs;
            }
            const docsTerminal = window.CapsuleExplorerVfs.manifestPathToTerminalPath(window.__smokeDocsPath);
            const state = {
                cwd: docsTerminal,
                home: window.CAPSULE_TERMINAL_HOME || window.CapsuleExplorerVfs.getTerminalLogicalHome(),
                user: 'user',
                host: 'host',
                fs,
                fileContents,
                fileHrefs,
                history: []
            };
            const helpers = {
                resolvePath: (cwd, target) => window.CapsuleTerminal.resolvePath(cwd, target, state.home),
                formatPrompt: () => '',
                normalizePath: window.CapsuleTerminal.normalizePath
            };
            const output = window.executeTerminalCommand(state, cmd, helpers);
            if (window.CapsuleUserFs && typeof window.CapsuleUserFs.syncFromTerminal === 'function') {
                await new Promise((resolve) => setTimeout(resolve, 80));
            }
            return {
                error: Boolean(output && output.error),
                lines: output && output.lines ? output.lines : []
            };
        }, command);
        await page.waitForTimeout(200);
        return result;
    };

    const readGridNames = () => page.evaluate(() => (
        [...document.querySelectorAll('div[data-link="nemo"] .nemoElement a[data-item-name]')]
            .map((link) => link.getAttribute('data-item-name'))
    ));

    const prefix = `smoke-sync-${stamp}`;

    // T3 — touch
    const touchName = `${prefix}-nouveau.txt`;
    const t3 = await runTerminalInDocs(`touch ${touchName}`);
    if (t3.error) {
        errors.push(`T3 touch: ${t3.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (!names.includes(touchName)) {
            errors.push(`T3 touch: ${touchName} absent de la grille`);
        }
    }

    // T4 — mkdir
    const dirName = `${prefix}-dossier`;
    const t4 = await runTerminalInDocs(`mkdir ${dirName}`);
    if (t4.error) {
        errors.push(`T4 mkdir: ${t4.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (!names.includes(dirName)) {
            errors.push(`T4 mkdir: ${dirName} absent de la grille`);
        }
    }

    // T5 — mv rename
    const oldName = `${prefix}-ancien.txt`;
    const newName = `${prefix}-renomme.txt`;
    await runTerminalInDocs(`touch ${oldName}`);
    await page.waitForTimeout(150);
    const t5 = await runTerminalInDocs(`mv ${oldName} ${newName}`);
    if (t5.error) {
        errors.push(`T5 mv: ${t5.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (names.includes(oldName)) {
            errors.push(`T5 mv: ancien nom ${oldName} encore visible`);
        }
        if (!names.includes(newName)) {
            errors.push(`T5 mv: nouveau nom ${newName} absent`);
        }
    }

    // T1 — rm fichier
    const rmName = `${prefix}-a-supprimer.txt`;
    await runTerminalInDocs(`touch ${rmName}`);
    await page.waitForTimeout(150);
    const t1 = await runTerminalInDocs(`rm ${rmName}`);
    if (t1.error) {
        errors.push(`T1 rm: ${t1.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (names.includes(rmName)) {
            errors.push(`T1 rm: ${rmName} encore visible`);
        }
    }

    // T2 — rmdir dossier vide
    const rmdirName = `${prefix}-vide`;
    await runTerminalInDocs(`mkdir ${rmdirName}`);
    await page.waitForTimeout(150);
    const t2 = await runTerminalInDocs(`rmdir ${rmdirName}`);
    if (t2.error) {
        errors.push(`T2 rmdir: ${t2.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (names.includes(rmdirName)) {
            errors.push(`T2 rmdir: ${rmdirName} encore visible`);
        }
    }

    // T6 — cp
    const cpSource = `${prefix}-source.txt`;
    const cpCopy = `${prefix}-copie.txt`;
    await runTerminalInDocs(`touch ${cpSource}`);
    await page.waitForTimeout(150);
    const t6 = await runTerminalInDocs(`cp ${cpSource} ${cpCopy}`);
    if (t6.error) {
        errors.push(`T6 cp: ${t6.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (!names.includes(cpSource) || !names.includes(cpCopy)) {
            errors.push(`T6 cp: source ou copie absente (${cpSource}, ${cpCopy})`);
        }
    }

    // T7 — echo >
    const redirectName = `${prefix}-redirect.txt`;
    const t7 = await runTerminalInDocs(`echo contenu-sync > ${redirectName}`);
    if (t7.error) {
        errors.push(`T7 echo>: ${t7.lines.join(' ')}`);
    } else {
        const names = gridNames(await readGridNames());
        if (!names.includes(redirectName)) {
            errors.push(`T7 echo>: ${redirectName} absent de la grille`);
        }
    }

    // T8 — pipeline echo | grep
    const t8 = await runTerminalInDocs('echo pipeline-capsule | grep pipeline');
    if (t8.error || !t8.lines.some((line) => String(line).includes('pipeline-capsule'))) {
        errors.push(`T8 pipe: ${t8.lines.join(' ')}`);
    }

    if (errors.length) {
        console.error('smoke-fs-terminal-explorer-sync: ÉCHEC');
        errors.forEach((message) => console.error(`  - ${message}`));
        process.exitCode = 1;
    } else {
        console.log(`smoke-fs-terminal-explorer-sync: OK (T1–T8) — ${PROFILE}`);
    }
} catch (error) {
    console.error('smoke-fs-terminal-explorer-sync: erreur fatale', error);
    process.exitCode = 1;
} finally {
    await browser.close();
}
