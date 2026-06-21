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
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRIB_ROOT = path.join(ROOT, 'usr/share/capsuleos/contrib');
const SLOTS = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');

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

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ validate-contrib-packages OK — pack Firefox mozilla');
