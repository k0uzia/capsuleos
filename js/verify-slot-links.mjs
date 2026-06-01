#!/usr/bin/env node
/**
 * Vérifie l’absence de branchements `nemo` obsolètes (slot courant : fileExplorer).
 * Usage : node js/verify-slot-links.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_ROOTS = [
    path.join(ROOT, 'OS/linux'),
    path.join(ROOT, 'modules/app')
];

const FILE_RE = /\.(html|js|mjs|css)$/i;

const PATTERNS = [
    { re: /data-link="nemo"/, label: 'data-link="nemo"' },
    { re: /data-overview-link="nemo"/, label: 'data-overview-link="nemo"' },
    { re: /data-quick-link="nemo"/, label: 'data-quick-link="nemo"' },
    { re: /data-cosmic-app-link="nemo"/, label: 'data-cosmic-app-link="nemo"' },
    { re: /openCapsuleApp\(\s*['"]nemo['"]\s*\)/, label: "openCapsuleApp('nemo')" },
    { re: /openWindowByDataLink\(\s*['"]nemo['"]\s*\)/, label: "openWindowByDataLink('nemo')" },
    { re: /document\.getFileExplorerWindowRoot\(\)/, label: 'document.getFileExplorerWindowRoot()' },
    { re: /mint-(image|pdf|media)-viewer/, label: 'mint-*-viewer (ids legacy visionneuses)' },
    { re: /CAPSULE_TEMPLATE_OVERRIDES.*mainMenu.*shared\/apps|CAPSULE_TEMPLATE_OVERRIDES.*mainMenu.*\/apps\/mainMenu/, label: 'override mainMenu vers shared/apps ou families/apps' }
];

const ALLOW_PATH = /capsule-file-manager-config\.js|verify-slot-links\.mjs|migrate-file-explorer-dom\.mjs/;

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) {
        return out;
    }
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            walk(full, out);
        } else if (FILE_RE.test(name)) {
            out.push(full);
        }
    }
    return out;
}

const issues = [];

for (const root of SCAN_ROOTS) {
    for (const file of walk(root)) {
        if (ALLOW_PATH.test(file)) {
            continue;
        }
        const text = fs.readFileSync(file, 'utf8');
        const lines = text.split('\n');
        PATTERNS.forEach(({ re, label }) => {
            lines.forEach((line, index) => {
                if (re.test(line)) {
                    issues.push(`${path.relative(ROOT, file)}:${index + 1} — ${label}`);
                }
            });
        });
    }
}

if (issues.length) {
    console.error('Branchements obsolètes détectés :\n' + issues.join('\n'));
    process.exit(1);
}

console.log('verify-slot-links: OK (aucun branchement nemo / document.getFileExplorerWindowRoot suspect)');
