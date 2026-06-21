#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate schema.org — graphe généré, fraîcheur, injection index.html.
 * Usage : node usr/lib/capsuleos/tools/validate-schema-org.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const GRAPH_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/schema-org/graph.json');
const SITE_CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/schema-org-site.json');
const MARKER_BEGIN = '<!-- CAPSULE_SCHEMA_ORG:BEGIN -->';
const MARKER_END = '<!-- CAPSULE_SCHEMA_ORG:END -->';

const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const check = spawnSync(process.execPath, [
  path.join(__dirname, 'build-schema-org.mjs'),
  '--check',
], { cwd: ROOT, encoding: 'utf8' });

if (check.status !== 0) {
  console.error((check.stderr || check.stdout || '').trim());
  process.exit(1);
}

if (!fs.existsSync(GRAPH_FILE)) {
  errors.push('graph.json absent');
} else {
  const graph = readJson(GRAPH_FILE);
  if (graph['@context'] !== 'https://schema.org') {
    errors.push('@context schema.org manquant');
  }
  if (!Array.isArray(graph['@graph']) || graph['@graph'].length < 3) {
    errors.push('@graph incomplet (WebSite + 2 ItemList attendus)');
  } else {
    const types = graph['@graph'].map((n) => n['@type']);
    if (!types.includes('WebSite')) {
      errors.push('WebSite absent du graphe');
    }
    const lists = graph['@graph'].filter((n) => n['@type'] === 'ItemList');
    if (lists.length < 2) {
      errors.push('ItemList OS ou /mnt absent');
    }
  }
}

const site = readJson(SITE_CONTRACT);
(site.htmlPages || ['index.html']).forEach((relPage) => {
  const pagePath = path.join(ROOT, relPage);
  if (!fs.existsSync(pagePath)) {
    errors.push(`Page absente : ${relPage}`);
    return;
  }
  const html = fs.readFileSync(pagePath, 'utf8');
  if (!html.includes(MARKER_BEGIN) || !html.includes(MARKER_END)) {
    errors.push(`${relPage} : marqueurs CAPSULE_SCHEMA_ORG manquants`);
    return;
  }
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    errors.push(`${relPage} : script application/ld+json absent`);
    return;
  }
  try {
    const embedded = JSON.parse(match[1]);
    if (!embedded['@graph']) {
      errors.push(`${relPage} : JSON-LD embarqué sans @graph`);
    }
  } catch (e) {
    errors.push(`${relPage} : JSON-LD invalide — ${e.message}`);
  }
});

if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const stored = readJson(path.join(ROOT, 'var/lib/capsuleos/generated/schema-org.hash.json'));
console.log(
  `✓ validate-schema-org OK — ${stored.osCount} OS, ${stored.mntCount} module(s) /mnt`,
);
