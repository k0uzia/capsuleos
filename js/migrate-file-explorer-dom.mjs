#!/usr/bin/env node
/**
 * Applique la table de renommage DOM fileExplorer (plan séparation + renommage).
 * Usage: node js/migrate-file-explorer-dom.mjs <fichier|dossier>
 */
import fs from 'fs';
import path from 'path';

export function applyFileExplorerDomRename(text) {
    let s = text;
    s = s.replace(/#voletnemo\b/g, '#fileExplorerSidebar');
    s = s.replace(/#nemoHeaderContainer\b/g, '#fileExplorerHeader');
    s = s.replace(/#nemoMainContainer\b/g, '#fileExplorerMain');
    s = s.replace(/#nemoFooterContainer\b/g, '#fileExplorerFooter');
    s = s.replace(/id="voletnemo"/g, 'id="fileExplorerSidebar"');
    s = s.replace(/id="nemoHeaderContainer"/g, 'id="fileExplorerHeader"');
    s = s.replace(/id="nemoMainContainer"/g, 'id="fileExplorerMain"');
    s = s.replace(/id="nemoFooterContainer"/g, 'id="fileExplorerFooter"');
    s = s.replace(/nemo-app__/g, 'file-explorer-app__');
    s = s.replace(/nemo-app/g, 'file-explorer-app');
    s = s.replace(/#nemo\b/g, '#fileExplorer');
    s = s.replace(/id="nemo"/g, 'id="fileExplorer"');
    s = s.replace(/data-link="nemo"/g, 'data-link="fileExplorer"');
    s = s.replace(/data-overview-link="nemo"/g, 'data-overview-link="fileExplorer"');
    s = s.replace(/data-quick-link="nemo"/g, 'data-quick-link="fileExplorer"');
    s = s.replace(/data-cosmic-app-link="nemo"/g, 'data-cosmic-app-link="fileExplorer"');
    s = s.replace(/dataLink:\s*'nemo'/g, "dataLink: 'fileExplorer'");
    s = s.replace(/document\.getFileExplorerWindowRoot\(\)/g, 'window.getFileExplorerWindowRoot()');
    s = s.replace(/data-task-id="open-nemo"/g, 'data-task-id="open-fileExplorer"');
    s = s.replace(/open-nemo/g, 'open-fileExplorer');
    s = s.replace(/dataset\.nemoInit/g, 'dataset.fileExplorerInit');
    s = s.replace(/data-nemo-init/g, 'data-file-explorer-init');
    s = s.replace(/getElementById\('nemo'\)/g, 'window.getFileExplorerWindowRoot()');
    s = s.replace(/getElementById\("nemo"\)/g, 'window.getFileExplorerWindowRoot()');
    s = s.replace(/document\.getFileExplorerWindowRoot\(\)/g, 'window.getFileExplorerWindowRoot()');
    s = s.replace(/querySelector\('div\[data-link="nemo"\]'\)/g, 'querySelector(\'div[data-link="fileExplorer"]\')');
    s = s.replace(/querySelector\("div\[data-link=\"nemo\"\]"\)/g, 'querySelector("div[data-link=\\"fileExplorer\\"]")');
    s = s.replace(/\[data-link="nemo"\]/g, '[data-link="fileExplorer"]');
    s = s.replace(/'#nemo /g, "'#fileExplorer ");
    s = s.replace(/"#nemo /g, '"#fileExplorer ');
    s = s.replace(/'#nemo'/g, "'#fileExplorer'");
    s = s.replace(/"#nemo"/g, '"#fileExplorer"');
    s = s.replace(/openCapsuleApp\('nemo'\)/g, "openCapsuleApp('fileExplorer')");
    s = s.replace(/nemo:\s*'open-nemo'/g, "fileExplorer: 'open-fileExplorer'");
    s = s.replace(/'open-nemo'/g, "'open-fileExplorer'");
    s = s.replace(/CAPSULE_FILE_MANAGER_APP_ID = 'nemo'/g, "CAPSULE_FILE_MANAGER_APP_ID = 'fileExplorer'");
    return s;
}

function processFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.html', '.css', '.js'].includes(ext)) {
        return;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const next = applyFileExplorerDomRename(raw);
    if (next !== raw) {
        fs.writeFileSync(filePath, next, 'utf8');
        console.log('updated', filePath);
    }
}

function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) {
            walk(p);
        } else {
            processFile(p);
        }
    }
}

const target = process.argv[2];
if (!target) {
    console.error('Usage: node js/migrate-file-explorer-dom.mjs <path>');
    process.exit(1);
}
const abs = path.resolve(target);
if (fs.statSync(abs).isDirectory()) {
    walk(abs);
} else {
    processFile(abs);
}
