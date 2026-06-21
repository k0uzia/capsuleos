#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate schema.org — graphe généré, fraîcheur, injection multi-pages.
 * Usage : node usr/lib/capsuleos/tools/validate-schema-org.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const GRAPH_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/schema-org/graph.json');
const MNT_HUB_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/schema-org/mnt-hub.json');
const SITE_CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/schema-org-site.json');
const MARKER_BEGIN = '<!-- CAPSULE_SCHEMA_ORG:BEGIN -->';
const MARKER_END = '<!-- CAPSULE_SCHEMA_ORG:END -->';

const errors = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeHtmlPages(site) {
  const raw = site.htmlPages || [{ path: 'index.html', graphKey: 'portal' }];
  return raw.map((entry) => (typeof entry === 'string'
    ? { path: entry, graphKey: 'portal' }
    : entry));
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
    errors.push('@graph portail incomplet (WebSite + 2 ItemList attendus)');
  }
}

if (!fs.existsSync(MNT_HUB_FILE)) {
  errors.push('mnt-hub.json absent');
} else {
  const mntHub = readJson(MNT_HUB_FILE);
  const list = mntHub['@graph']?.find((n) => n['@type'] === 'ItemList');
  const hasScenarios = (list?.itemListElement || []).some(
    (li) => Array.isArray(li.item?.hasPart) && li.item.hasPart.length > 0,
  );
  if (!hasScenarios) {
    errors.push('mnt-hub : scénarios absents du graphe (hasPart attendu)');
  }
}

const site = readJson(SITE_CONTRACT);
normalizeHtmlPages(site).forEach(({ path: relPage }) => {
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
  `✓ validate-schema-org OK — ${stored.osCount} OS, ${stored.mntCount} module(s), `
  + `${stored.scenarioCount || 0} scénario(s)`,
);
