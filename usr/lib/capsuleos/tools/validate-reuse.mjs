#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate REUSE / SPDX — REUSE.toml, LICENSES/, en-têtes explicites sur fichiers sensibles.
 * Usage : node usr/lib/capsuleos/tools/validate-reuse.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];

const reuseToml = path.join(ROOT, 'REUSE.toml');
if (!fs.existsSync(reuseToml)) {
  errors.push('REUSE.toml absent à la racine');
}

const gplLicense = path.join(ROOT, 'LICENSES/GPL-3.0-or-later.txt');
if (!fs.existsSync(gplLicense)) {
  errors.push('LICENSES/GPL-3.0-or-later.txt absent');
} else if (fs.readFileSync(gplLicense, 'utf8').length < 500) {
  errors.push('LICENSES/GPL-3.0-or-later.txt trop court ou vide');
}

/** Fichiers récents / noyau : en-tête SPDX explicite requis (prioritaire sur aggregate). */
const SPDX_REQUIRED = [
  'usr/lib/capsuleos/core/capsule-a11y.js',
  'usr/lib/capsuleos/core/capsule-a11y-bootstrap.js',
  'usr/lib/capsuleos/site/a11y-panel.js',
  'usr/share/capsuleos/themes/global/a11y-site.css',
  'usr/share/capsuleos/themes/portal/a11y.css',
  'usr/lib/capsuleos/shells/linux/se-a11y-bus.js',
  'usr/lib/capsuleos/tools/generate-sbom.mjs',
  'usr/lib/capsuleos/tools/validate-sbom.mjs',
  'usr/lib/capsuleos/tools/validate-git-security.mjs',
  'usr/lib/capsuleos/tools/validate-reuse.mjs',
  'usr/lib/capsuleos/tools/build-schema-org.mjs',
  'usr/lib/capsuleos/tools/validate-schema-org.mjs',
  'usr/lib/capsuleos/tools/validate-owasp-static.mjs',
  'usr/lib/capsuleos/tools/run-reuse-lint.mjs',
  'usr/lib/capsuleos/tools/validate-reuse-full.mjs',
  'usr/lib/capsuleos/tools/validate-a11y.mjs',
  'usr/lib/capsuleos/tools/lab/smoke-a11y-portal.mjs',
];

const hasSpdxHeader = (content) =>
  /SPDX-FileCopyrightText:/.test(content) && /SPDX-License-Identifier:/.test(content);

SPDX_REQUIRED.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`${rel} : fichier manquant`);
    return;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!hasSpdxHeader(content)) {
    errors.push(`${rel} : en-têtes SPDX-FileCopyrightText et SPDX-License-Identifier requis`);
  }
});

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ validate-reuse OK — REUSE.toml, LICENSES/GPL-3.0-or-later.txt, ${SPDX_REQUIRED.length} fichiers SPDX`);
