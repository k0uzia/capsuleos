#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Génère capsule-firefox-contrib.js depuis le pack contrib Mozilla Firefox.
 * Usage : node usr/lib/capsuleos/tools/build-firefox-contrib-bundle.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PACK_DIR = path.join(ROOT, 'usr/share/capsuleos/contrib/internet/browser/mozilla/firefox');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-firefox-contrib.js');
const HASH_OUT = path.join(ROOT, 'var/lib/capsuleos/generated/firefox-contrib.hash.json');

function readJson(name) {
  const full = path.join(PACK_DIR, name);
  if (!fs.existsSync(full)) {
    throw new Error(`contrib firefox : ${name} manquant`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const manifest = readJson('manifest.json');
const searchEngine = readJson('search-engine.json');
const bookmarksFile = readJson('bookmarks.default.json');
const newtabFile = readJson('newtab-shortcuts.json');

const bundle = {
  manifest,
  searchEngine,
  bookmarks: bookmarksFile.bookmarks || [],
  newtabShortcuts: newtabFile.shortcuts || [],
  locale: newtabFile.locale || 'fr-FR',
};

const banner = `/**
 * Pack contrib Firefox Mozilla (généré).
 * Source : usr/share/capsuleos/contrib/internet/browser/mozilla/firefox/
 * Regénérer : node usr/lib/capsuleos/tools/build-firefox-contrib-bundle.mjs
 */
`;

const out = `${banner}(function initCapsuleFirefoxContrib(global) {
  'use strict';
  global.CAPSULE_FIREFOX_CONTRIB = ${JSON.stringify(bundle, null, 2)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');

const hash = crypto.createHash('sha256').update(out).digest('hex');
fs.writeFileSync(
  HASH_OUT,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), sha256: hash }, null, 2)}\n`,
  'utf8',
);

console.log(`✓ capsule-firefox-contrib.js — ${bundle.bookmarks.length} favori(s), ${bundle.newtabShortcuts.length} raccourci(s) newtab`);
