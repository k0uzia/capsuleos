#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate sécurité dépôt — fichiers sensibles non versionnés, node_modules hors Git.
 * Usage : node usr/lib/capsuleos/tools/validate-git-security.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];
const warnings = [];

function gitLsFiles() {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'buffer' });
  if (r.status !== 0) {
    errors.push('git ls-files a échoué');
    return [];
  }
  return r.stdout.toString('utf8').split('\0').filter(Boolean);
}

const tracked = gitLsFiles();

const FORBIDDEN_PREFIXES = [
  'node_modules/',
  'etc/capsuleos/lab-inventory.json',
  'etc/capsuleos/git-push-token',
];

const FORBIDDEN_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.pem$/,
  /\.p12$/,
  /\.pfx$/,
  /(^|\/)id_rsa$/,
  /(^|\/)id_ed25519$/,
];

tracked.forEach((rel) => {
  if (FORBIDDEN_PREFIXES.some((p) => rel === p || rel.startsWith(p))) {
    errors.push(`Fichier sensible versionné : ${rel}`);
  }
  FORBIDDEN_PATTERNS.forEach((re) => {
    if (re.test(rel)) {
      errors.push(`Fichier sensible versionné : ${rel}`);
    }
  });
});

const gitignorePath = path.join(ROOT, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  errors.push('.gitignore absent');
} else {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  ['node_modules/', 'etc/capsuleos/lab-inventory.json', 'etc/capsuleos/git-push-token'].forEach((needle) => {
    if (!gitignore.includes(needle)) {
      errors.push(`.gitignore ne contient pas : ${needle}`);
    }
  });
}

const nodeModulesTracked = tracked.filter((rel) => rel.startsWith('node_modules/')).length;
if (nodeModulesTracked > 0) {
  errors.push(`${nodeModulesTracked} fichier(s) sous node_modules/ encore versionné(s) — git rm -r --cached node_modules`);
}

const exampleInventory = path.join(ROOT, 'etc/capsuleos/lab-inventory.example.json');
if (fs.existsSync(exampleInventory)) {
  const example = fs.readFileSync(exampleInventory, 'utf8');
  if (/192\.168\.(1\.|122\.|123\.)\d+/.test(example)) {
    warnings.push(
      'lab-inventory.example.json contient des IP lab plausibles — préférer 203.0.113.x (TEST-NET-3)',
    );
  }
}

const PRIVATE_IP = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/;
const IP_SCAN_SKIP = [
  'etc/capsuleos/lab-inventory.json',
  'usr/lib/capsuleos/shells/linux/terminal/terminal-network.js',
  'usr/lib/capsuleos/tools/lab/patch-lab-shell-ssh.mjs',
  'usr/lib/capsuleos/tools/lab/patch-lab-mjs-ssh.mjs',
  'usr/lib/capsuleos/tools/lab/redact-lab-network-metadata.mjs',
];

tracked.forEach((rel) => {
  if (IP_SCAN_SKIP.some((p) => rel === p || rel.startsWith(`${p}/`))) {
    return;
  }
  if (!/\.(json|txt|md|mjs|js|sh|html|css|xml|yaml|yml)$/i.test(rel)) {
    return;
  }
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).size > 512_000) {
    return;
  }
  const body = fs.readFileSync(abs, 'utf8');
  if (PRIVATE_IP.test(body)) {
    errors.push(`IP privée versionnée : ${rel} — anonymiser ou gitignore`);
  }
});

if (warnings.length) {
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ validate-git-security OK — ${tracked.length} fichiers versionnés, node_modules exclu`);
