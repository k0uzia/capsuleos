#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate packages contrib apps (manifest + slot référencé).
 * Usage : node usr/lib/capsuleos/tools/validate-contrib-packages.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRIB_ROOT = path.join(ROOT, 'usr/share/capsuleos/contrib');
const SLOTS = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-firefox-contrib.js');

const errors = [];
const slots = JSON.parse(fs.readFileSync(SLOTS, 'utf8'));
const slotIds = new Set(Object.keys(slots.slots || {}));

const firefoxManifest = path.join(CONTRIB_ROOT, 'internet/browser/mozilla/firefox/manifest.json');
if (!fs.existsSync(firefoxManifest)) {
  errors.push('contrib/internet/browser/mozilla/firefox/manifest.json absent');
} else {
  const manifest = JSON.parse(fs.readFileSync(firefoxManifest, 'utf8'));
  if (!manifest.slotId || !slotIds.has(manifest.slotId)) {
    errors.push(`manifest firefox : slotId « ${manifest.slotId} » invalide`);
  }
  ['search-engine.json', 'bookmarks.default.json', 'newtab-shortcuts.json'].forEach((file) => {
    const full = path.join(CONTRIB_ROOT, 'internet/browser/mozilla/firefox', file);
    if (!fs.existsSync(full)) {
      errors.push(`contrib firefox : ${file} manquant`);
    }
  });
}

const build = spawnSync(process.execPath, [path.join(__dirname, 'build-firefox-contrib-bundle.mjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (build.status !== 0) {
  errors.push('build-firefox-contrib-bundle.mjs a échoué');
} else if (!fs.existsSync(OUT)) {
  errors.push('capsule-firefox-contrib.js non généré');
} else if (!/CAPSULE_FIREFOX_CONTRIB/.test(fs.readFileSync(OUT, 'utf8'))) {
  errors.push('capsule-firefox-contrib.js : CAPSULE_FIREFOX_CONTRIB absent');
}

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ validate-contrib-packages OK — pack Firefox mozilla');