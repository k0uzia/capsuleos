import fs from 'fs';
import path from 'path';

export function readJson(root, rel) {
    const full = path.join(root, rel);
    return JSON.parse(fs.readFileSync(full, 'utf8'));
}

export function walkFiles(dir, filterFn, results = []) {
    if (!fs.existsSync(dir)) {
        return results;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') {
                continue;
            }
            walkFiles(full, filterFn, results);
        } else if (filterFn(full, entry.name)) {
            results.push(full);
        }
    }
    return results;
}

export function globToRegex(glob) {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/{{GLOBSTAR}}/g, '.*');
    return new RegExp(`^${pattern}$`);
}

export function collectByGlobs(root, globs) {
    const files = new Set();
    const all = walkFiles(root, (p) => p.endsWith('.css'));
    for (const file of all) {
        const rel = path.relative(root, file).replace(/\\/g, '/');
        if (globs.some((g) => globToRegex(g).test(rel))) {
            files.add(file);
        }
    }
    return [...files];
}

export function extractCssVarDefinitions(cssText) {
    const defined = new Set();
    const re = /--([a-zA-Z0-9_-]+)\s*:/g;
    let m;
    while ((m = re.exec(cssText)) !== null) {
        defined.add(`--${m[1]}`);
    }
    return defined;
}

export function extractCssVarUses(cssText) {
    const used = new Set();
    const re = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
    let m;
    while ((m = re.exec(cssText)) !== null) {
        used.add(m[1]);
    }
    return used;
}

export function extractHtmlIds(html) {
    const ids = new Set();
    const re = /\bid\s*=\s*["']([a-zA-Z][\w-]*)["']/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        ids.add(m[1]);
    }
    return ids;
}

export function extractJsSelectorLiterals(jsText) {
    const ids = new Set();
    const classes = new Set();
    const idRe = /(?:getElementById|querySelector|querySelectorAll)\(\s*['"]#([\w-]+)/g;
    const classRe = /querySelector(?:All)?\(\s*['"]([\w.#\s\[\]=^$*~>+-]+)['"]/g;
    let m;
    while ((m = idRe.exec(jsText)) !== null) {
        ids.add(m[1]);
    }
    while ((m = classRe.exec(jsText)) !== null) {
        const sel = m[1];
        if (sel.startsWith('#')) {
            ids.add(sel.slice(1).split(/[\s.[>+~]/)[0]);
        }
        const compoundId = /#([\w-]+)/g;
        let idm;
        while ((idm = compoundId.exec(sel)) !== null) {
            ids.add(idm[1]);
        }
        sel.split(/[\s,[>+~]/).forEach((part) => {
            const c = part.match(/^\.([a-zA-Z][\w-]*)/);
            if (c) {
                classes.add(c[1]);
            }
        });
    }
    const createIdRe = /\.id\s*=\s*['"]([\w-]+)['"]/g;
    while ((m = createIdRe.exec(jsText)) !== null) {
        ids.add(m[1]);
    }
    return { ids, classes };
}
