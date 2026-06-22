#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Génère capsule-simulated-web-index.js depuis le contrat + site.json du corpus web.
 * Usage : node usr/lib/capsuleos/tools/build-simulated-web-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/simulated-web-index.json');
const WEB_DIR = path.join(ROOT, 'usr/share/capsuleos/web');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-simulated-web-index.js');
const HASH_OUT = path.join(ROOT, 'var/lib/capsuleos/generated/simulated-web-index.hash.json');

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const merged = JSON.parse(JSON.stringify(contract));

if (!merged.hosts) {
  merged.hosts = {};
}

fs.readdirSync(WEB_DIR, { withFileTypes: true }).forEach((entry) => {
  if (!entry.isDirectory() || entry.name.startsWith('_')) {
    return;
  }
  const siteJsonPath = path.join(WEB_DIR, entry.name, 'site.json');
  if (!fs.existsSync(siteJsonPath)) {
    return;
  }
  const site = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
  (site.hosts || []).forEach((host) => {
    if (!merged.hosts[host]) {
      merged.hosts[host] = { type: 'web', siteId: site.siteId || entry.name };
    }
  });
});

const banner = `/**
 * Index internet simulé CapsuleOS (généré).
 * Sources : etc/capsuleos/contracts/simulated-web-index.json · usr/share/capsuleos/web/<siteId>/site.json
 * Regénérer : node usr/lib/capsuleos/tools/build-simulated-web-index.mjs
 */
`;

const out = `${banner}(function initCapsuleSimulatedWebIndex(global) {
  'use strict';
  global.CAPSULE_SIMULATED_WEB_INDEX = ${JSON.stringify(merged, null, 2)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');

const hash = crypto.createHash('sha256').update(out).digest('hex');
fs.writeFileSync(HASH_OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), sha256: hash }, null, 2)}\n`, 'utf8');

console.log(`✓ capsule-simulated-web-index.js — ${Object.keys(merged.hosts).length} hosts, ${Object.keys(merged.modules || {}).length} module(s) mnt`);
