#!/usr/bin/env node
/**
 * Contrôle vanilla JS runtime CapsuleOS — ES6 strict (sans npm).
 * Usage : node usr/lib/capsuleos/tools/validate-vanilla-js.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const RUNTIME_ROOTS = [
  'usr/lib/capsuleos/common',
  'usr/lib/capsuleos/shells',
  'usr/lib/capsuleos/site',
  'OS',
  'home',
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.cursor', 'tools']);
const SKIP_FILES = new Set([
  'capsule-app-embed.js',
  'capsule-android-embed.js',
]);

const GENERATED_PREFIX = path.join('var', 'lib', 'capsuleos', 'generated');

const errors = [];
const warnings = [];

const ERROR_RULES = [
  { id: 'es-module-import', re: /^\s*import\s+/m, msg: 'import ES module interdit (ES6 strict)' },
  { id: 'es-module-export', re: /^\s*export\s+(default\s+)?(class|function|const|let|var)\b/m, msg: 'export ES module interdit' },
  { id: 'require-external', re: /\brequire\s*\(\s*['"](?!\.|\/) /m, msg: 'require() package externe interdit' },
  {
    id: 'framework',
    re: /\b(from\s+['"]react|from\s+['"]vue|from\s+['"]@angular|jquery|\bReact\.createElement\b)/i,
    msg: 'référence framework UI interdite',
  },
  { id: 'eval', re: /\beval\s*\(/, msg: 'eval() interdit dans le runtime' },
  { id: 'new-function', re: /\bnew\s+Function\s*\(/, msg: 'new Function() interdit dans le runtime' },
  { id: 'optional-chaining', re: /\?\./, msg: 'optional chaining (?.) interdit (ES6 strict)' },
  { id: 'nullish-coalescing', re: /(^|[^?])\?\?(?!=)/, msg: 'nullish coalescing (??) interdit (ES6 strict)' },
  {
    id: 'object-spread',
    re: /\{\s*\.\.\./,
    msg: 'object spread ({...x}) interdit (ES6 strict ; [...arr] et fn(...args) autorisés)',
  },
];

const WARNING_RULES = [
  {
    id: 'use-strict-missing',
    re: /^(?!.*['"]use strict['"])/s,
    msg: "'use strict' absent",
    onlyIfNoStrict: true,
  },
];

const rel = (abs) => path.relative(ROOT, abs).replace(/\\/g, '/');

const shouldScanFile = (abs) => {
  const r = rel(abs);
  if (!r.endsWith('.js')) return false;
  if (SKIP_FILES.has(path.basename(abs))) return false;
  if (r.startsWith(GENERATED_PREFIX + '/') || r === GENERATED_PREFIX) return false;
  if (r.includes('/usr/lib/capsuleos/tools/')) return false;
  return true;
};

const walkRuntime = (absDir) => {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      if (rel(full).startsWith(GENERATED_PREFIX)) continue;
      walkRuntime(full);
    } else if (shouldScanFile(full)) {
      scanFile(full);
    }
  }
};

const scanFile = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  const label = rel(file);
  ERROR_RULES.forEach((rule) => {
    if (rule.re.test(content)) errors.push(`${label}: ${rule.msg}`);
    rule.re.lastIndex = 0;
  });
  WARNING_RULES.forEach((rule) => {
    if (rule.onlyIfNoStrict && /['"]use strict['"]/.test(content)) return;
    if (rule.re.test(content)) warnings.push(`${label}: ${rule.msg}`);
    rule.re.lastIndex = 0;
  });
};

RUNTIME_ROOTS.forEach((rootRel) => {
  const abs = path.join(ROOT, rootRel);
  if (fs.existsSync(abs)) walkRuntime(abs);
});

if (warnings.length) {
  console.warn(`Avertissements (${warnings.length}) — voir root/docs/passe-vanilla-json.md`);
  const byFile = new Map();
  warnings.forEach((w) => {
    const file = w.split(':')[0];
    byFile.set(file, (byFile.get(file) || 0) + 1);
  });
  [...byFile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .forEach(([file, n]) => console.warn(`  ⚠ ${file} (${n})`));
  if (byFile.size > 12) console.warn(`  ... ${byFile.size - 12} autre(s) fichier(s)`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} erreur(s) vanilla JS`);
  errors.forEach((e) => console.error(' ', e));
  process.exit(1);
}

console.log('✓ validate-vanilla-js OK — runtime ES6 strict');
