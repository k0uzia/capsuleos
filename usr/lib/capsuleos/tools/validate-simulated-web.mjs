#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate corpus web simulé + index généré.
 * Usage : node usr/lib/capsuleos/tools/validate-simulated-web.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/simulated-web-index.json');
const WEB_DIR = path.join(ROOT, 'usr/share/capsuleos/web');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-simulated-web-index.js');
const REQUIRED_SITES = ['lacapsule', 'search-google', 'linuxmint', 'neterror', 'amazon-fr', 'temu', 'youtube', 'reddit', 'wikipedia-fr'];
const REQUIRED_SHORTCUTS = ['amazon', 'temu', 'wikipedia', 'youtube', 'reddit'];

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('simulated-web-index.json absent');
}

REQUIRED_SITES.forEach((siteId) => {
  const dir = path.join(WEB_DIR, siteId);
  const html = path.join(dir, 'index.html');
  const meta = path.join(dir, 'site.json');
  if (!fs.existsSync(html)) {
    errors.push(`web/${siteId}/index.html manquant`);
  }
  if (!fs.existsSync(meta)) {
    errors.push(`web/${siteId}/site.json manquant`);
  }
});

const indexContract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
REQUIRED_SHORTCUTS.forEach((key) => {
  const entry = (indexContract.shortcuts || {})[key];
  if (!entry || !entry.siteId) {
    errors.push(`simulated-web-index shortcuts.${key} manquant ou sans siteId`);
  }
});

const newtabPath = path.join(ROOT, 'usr/share/capsuleos/contrib/internet/browser/mozilla/firefox/newtab-shortcuts.json');
if (!fs.existsSync(newtabPath)) {
  errors.push('contrib firefox newtab-shortcuts.json absent');
} else {
  const newtab = JSON.parse(fs.readFileSync(newtabPath, 'utf8'));
  (newtab.shortcuts || []).forEach((sc) => {
    if (!sc.key || !sc.siteId) {
      errors.push(`newtab-shortcuts : entrée invalide ${JSON.stringify(sc)}`);
    }
  });
}

const build = spawnSync(process.execPath, [path.join(__dirname, 'build-simulated-web-index.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (build.status !== 0) {
  errors.push('build-simulated-web-index.mjs a échoué');
} else if (!fs.existsSync(OUT)) {
  errors.push('capsule-simulated-web-index.js non généré');
}

const resolverPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/simulatedWebResolver.js');
if (!fs.existsSync(resolverPath)) {
  errors.push('simulatedWebResolver.js absent');
} else {
  const text = fs.readFileSync(resolverPath, 'utf8');
  if (!text.includes('CapsuleSimulatedWebResolver')) {
    errors.push('CapsuleSimulatedWebResolver non exporté');
  }
}

const bridgePath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/capsule-mnt-bridge.js');
if (!fs.existsSync(bridgePath)) {
  errors.push('capsule-mnt-bridge.js absent');
}

const schemaPath = path.join(ROOT, 'etc/capsuleos/contracts/simulated-web-index.schema.json');
if (!fs.existsSync(schemaPath)) {
  errors.push('simulated-web-index.schema.json absent');
}

const modules = indexContract.modules || {};
if (!modules['linux-bases'] || modules['linux-bases'].type !== 'mnt') {
  errors.push('simulated-web-index modules.linux-bases (mnt) manquant');
}

const templateDir = path.join(WEB_DIR, '_template');
if (!fs.existsSync(path.join(templateDir, 'index.html')) || !fs.existsSync(path.join(templateDir, 'site.json'))) {
  errors.push('web/_template/ incomplet');
}

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ validate-simulated-web OK — corpus web + index généré');
