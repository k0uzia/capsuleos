#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate OWASP statique — vérifie les directives .htaccess sans Apache.
 * Usage : node usr/lib/capsuleos/tools/validate-owasp-static.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/owasp-htaccess.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const htaccessPath = path.join(ROOT, contract.htaccessPath || '.htaccess');

const errors = [];

if (!fs.existsSync(htaccessPath)) {
  console.error('  ✗ .htaccess absent');
  process.exit(1);
}

const body = fs.readFileSync(htaccessPath, 'utf8');

(contract.requiredOptions || []).forEach((needle) => {
  if (!body.includes(needle)) {
    errors.push(`.htaccess : option/directive manquante — ${needle}`);
  }
});

(contract.requiredRewritePatterns || []).forEach((pattern) => {
  const re = new RegExp(pattern);
  if (!re.test(body)) {
    errors.push(`.htaccess : règle rewrite manquante — /${pattern}/`);
  }
});

(contract.requiredHeaders || []).forEach((header) => {
  if (!body.includes(`Header always set ${header}`) && !body.includes(`Header set ${header}`)) {
    errors.push(`.htaccess : en-tête manquant — ${header}`);
  }
});

(contract.requiredFilesMatchDeny || []).forEach((needle) => {
  if (!body.includes(needle) || !body.includes('Require all denied')) {
    errors.push(`.htaccess : blocage FilesMatch manquant — ${needle}`);
  }
});

if (!body.includes('OWASP Top 10')) {
  errors.push('.htaccess : référence OWASP Top 10 absente (documentation inline)');
}

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ validate-owasp-static OK — ${contract.requiredHeaders.length} en-têtes, rewrite et accès vérifiés`);
