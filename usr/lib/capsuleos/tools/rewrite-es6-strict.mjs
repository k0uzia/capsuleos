#!/usr/bin/env node
/**
 * @deprecated Codemod fragile (casse foo?.bar.method). Préférer corrections manuelles + validate-vanilla-js.
 * Réécrit ?. / ?? / spread objet → ES6 (usage interne uniquement).
 * node usr/lib/capsuleos/tools/rewrite-es6-strict.mjs [fichier.js ...]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SKIP = new Set(['node_modules', '.git', 'tools', 'capsule-app-embed.js', 'capsule-android-embed.js']);

const isIdentChar = (c) => /[\w$]/.test(c) || c === ']';

function skipString(code, i) {
  const q = code[i];
  i += 1;
  while (i < code.length) {
    if (code[i] === '\\') {
      i += 2;
      continue;
    }
    if (code[i] === q) return i + 1;
    i += 1;
  }
  return i;
}

function findExprStart(code, end) {
  let i = end - 1;
  while (i >= 0 && /\s/.test(code[i])) i -= 1;
  if (i < 0) return 0;

  let depth = 0;
  let j = i;
  while (j >= 0) {
    const c = code[j];
    if (c === ')' || c === ']' || c === '}') {
      depth += 1;
      j -= 1;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      if (depth > 0) {
        depth -= 1;
        j -= 1;
        continue;
      }
      return j + 1;
    }
    if (depth === 0 && /[=,;:(>{}&|+\-*%^!?]/.test(c) && !(c === '?' && code[j - 1] === ':')) {
      return j + 1;
    }
    j -= 1;
  }
  return 0;
}

function findExprEnd(code, start) {
  let i = start;
  while (i < code.length && /\s/.test(code[i])) i += 1;
  let depth = 0;
  let j = i;
  while (j < code.length) {
    const c = code[j];
    if (c === "'" || c === '"' || c === '`') {
      j = skipString(code, j);
      continue;
    }
    if (c === '(' || c === '[' || c === '{') {
      depth += 1;
      j += 1;
      continue;
    }
    if (c === ')' || c === ']' || c === '}') {
      if (depth > 0) {
        depth -= 1;
        j += 1;
        continue;
      }
      return j;
    }
    if (depth === 0 && /[,;)\]}]/.test(c)) return j;
    if (depth === 0 && c === '?' && code[j + 1] !== '.' && code[j - 1] !== '.') return j;
    j += 1;
  }
  return j;
}

function replaceNullish(code) {
  let out = code;
  let guard = 0;
  while (out.includes('??') && guard < 500) {
    guard += 1;
    const idx = out.indexOf('??');
    if (idx > 0 && out[idx - 1] === '?') break;
    const start = findExprStart(out, idx);
    const left = out.slice(start, idx).trim();
    const rStart = idx + 2;
    const rEnd = findExprEnd(out, rStart);
    const right = out.slice(rStart, rEnd).trim();
    const rep = `(${left} != null ? ${left} : ${right})`;
    out = out.slice(0, start) + rep + out.slice(rEnd);
  }
  return out;
}

function replaceOptionalChains(code) {
  let out = code;
  let guard = 0;
  while (out.includes('?.') && guard < 2000) {
    guard += 1;
    const idx = out.indexOf('?.');
    const baseStart = findExprStart(out, idx);
    const base = out.slice(baseStart, idx).trim();
    let pos = idx + 2;
    while (pos < out.length && /\s/.test(out[pos])) pos += 1;

    let repl;
    let end;
    if (out[pos] === '[') {
      const close = out.indexOf(']', pos);
      const key = out.slice(pos, close + 1);
      end = close + 1;
      repl = `(${base} == null ? void 0 : ${base}${key})`;
    } else if (out[pos] === '(') {
      const close = findExprEnd(out, pos + 1);
      const args = out.slice(pos, close);
      end = close;
      repl = `(${base} == null ? void 0 : ${base}${args})`;
    } else {
      let j = pos;
      while (j < out.length && /[\w$]/.test(out[j])) j += 1;
      const prop = out.slice(pos, j);
      end = j;
      repl = `(${base} == null ? void 0 : ${base}.${prop})`;
    }
    out = out.slice(0, baseStart) + repl + out.slice(end);
  }
  return out;
}

function replaceObjectSpread(code) {
  let out = code;
  let guard = 0;
  while (/\{\s*\.\.\./.test(out) && guard < 300) {
    guard += 1;
    const m = out.match(/\{(\s*)\.\.\.([a-zA-Z_$][\w$]*)(\s*,\s*([^}]*))?\s*\}/);
    if (!m) break;
    const [full, sp, spreadVar, , tail] = m;
    const idx = out.indexOf(full);
    let rep;
    if (tail && tail.trim()) {
      const parts = tail.split(',').map((p) => p.trim()).filter(Boolean);
      const assigns = parts.map((p) => {
        if (/^[a-zA-Z_$][\w$]*$/.test(p)) return `{ ${p}: ${p} }`;
        return `{ ${p} }`;
      });
      rep = `Object.assign(${sp}{}${sp}, ${spreadVar}${assigns.length ? `, ${assigns.join(', ')}` : ''})`;
    } else {
      rep = `Object.assign(${sp}{}${sp}, ${spreadVar})`;
    }
    out = out.slice(0, idx) + rep + out.slice(idx + full.length);
  }
  return out;
}

function transformSource(code) {
  let out = code;
  if (!out.includes('?.') && !out.includes('??') && !/\{\s*\.\.\./.test(out)) {
    return out;
  }
  out = replaceNullish(out);
  out = replaceOptionalChains(out);
  out = replaceObjectSpread(out);
  return out;
}

function collectFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) collectFiles(full, acc);
    else if (name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

const args = process.argv.slice(2);
const files = args.length
  ? args.map((f) => path.resolve(process.cwd(), f))
  : [
    'usr/lib/capsuleos/common',
    'usr/lib/capsuleos/shells',
    'usr/lib/capsuleos/site',
    'OS',
    'home',
  ].flatMap((r) => collectFiles(path.join(ROOT, r)));

let changed = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (rel.includes('var/lib/capsuleos/generated')) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = transformSource(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
    console.log('rewrote', rel);
  }
}
console.log(`rewrite-es6-strict: ${changed} fichier(s) modifié(s)`);
