#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Génère le graphe schema.org (JSON-LD) depuis os-registry.json et /mnt.
 * Usage :
 *   node usr/lib/capsuleos/tools/build-schema-org.mjs [--check]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const SITE_CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/schema-org-site.json');
const OS_REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const MNT_CATALOG = path.join(ROOT, 'mnt/catalog.json');
const OUT_DIR = path.join(ROOT, 'var/lib/capsuleos/generated/schema-org');
const GRAPH_FILE = path.join(OUT_DIR, 'graph.json');
const HASH_FILE = path.join(ROOT, 'var/lib/capsuleos/generated/schema-org.hash.json');

const MARKER_BEGIN = '<!-- CAPSULE_SCHEMA_ORG:BEGIN -->';
const MARKER_END = '<!-- CAPSULE_SCHEMA_ORG:END -->';

const checkOnly = process.argv.includes('--check');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function walkModuleJsonFiles() {
  const out = [];
  const mntRoot = path.join(ROOT, 'mnt');
  if (!fs.existsSync(mntRoot)) {
    return out;
  }
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.startsWith('_')) {
          continue;
        }
        walk(abs);
      } else if (ent.name === 'module.json') {
        out.push(abs);
      }
    }
  };
  walk(mntRoot);
  return out;
}

function computeSourceHash() {
  const moduleFiles = walkModuleJsonFiles();
  return {
    osRegistry: sha256File(OS_REGISTRY),
    mntCatalog: fs.existsSync(MNT_CATALOG) ? sha256File(MNT_CATALOG) : '',
    mntModules: moduleFiles.map((f) => sha256File(f)).sort().join('|'),
    siteContract: sha256File(SITE_CONTRACT),
  };
}

function joinUrl(base, relPath) {
  const baseNorm = base.replace(/\/$/, '');
  const rel = relPath.replace(/^\.\//, '').replace(/^\//, '');
  return `${baseNorm}/${rel}`;
}

function loadMntModules() {
  const modules = [];
  walkModuleJsonFiles().forEach((abs) => {
    const mod = readJson(abs);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    modules.push({ mod, rel });
  });
  return modules;
}

function buildGraph(site, registry) {
  const baseUrl = site.baseUrl;
  const statuses = new Set(site.catalogStatuses || ['active']);
  const entries = (registry.entries || []).filter((e) => statuses.has(e.status));

  const website = {
    '@type': 'WebSite',
    name: site.siteName,
    url: joinUrl(baseUrl, '/'),
    description: site.siteDescription,
    inLanguage: 'fr-FR',
    publisher: {
      '@type': 'Organization',
      name: site.publisher.name,
      url: site.publisher.url,
    },
  };

  const osItems = entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'SoftwareApplication',
      name: entry.displayName || entry.id,
      identifier: entry.id,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web browser',
      url: entry.facade ? joinUrl(baseUrl, entry.facade) : undefined,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
    },
  }));

  const osList = {
    '@type': 'ItemList',
    name: 'Catalogue OS CapsuleOS (/OS)',
    numberOfItems: osItems.length,
    itemListElement: osItems,
  };

  const mntModules = loadMntModules();
  const learningItems = mntModules.map(({ mod, rel }, index) => {
    const modulePath = rel.replace(/\/module\.json$/, '');
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LearningResource',
        name: mod.title || mod.id,
        description: mod.description || '',
        identifier: mod.id,
        inLanguage: mod.locale || 'fr-FR',
        learningResourceType: 'module',
        url: joinUrl(baseUrl, modulePath),
        isPartOf: {
          '@type': 'ItemList',
          name: 'Modules pédagogiques /mnt',
        },
      },
    };
  });

  const mntList = {
    '@type': 'ItemList',
    name: 'Modules pédagogiques CapsuleOS (/mnt)',
    numberOfItems: learningItems.length,
    itemListElement: learningItems,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [website, osList, mntList],
  };
}

function injectHtmlPages(site, graphJson) {
  const scriptBlock = [
    MARKER_BEGIN,
    `<script type="application/ld+json">${JSON.stringify(graphJson)}</script>`,
    MARKER_END,
  ].join('\n    ');

  (site.htmlPages || ['index.html']).forEach((relPage) => {
    const pagePath = path.join(ROOT, relPage);
    if (!fs.existsSync(pagePath)) {
      throw new Error(`Page HTML introuvable : ${relPage}`);
    }
    let html = fs.readFileSync(pagePath, 'utf8');
    const re = new RegExp(
      `${MARKER_BEGIN}[\\s\\S]*?${MARKER_END}`,
      'm',
    );
    if (re.test(html)) {
      html = html.replace(re, scriptBlock);
    } else {
      html = html.replace('</head>', `    ${scriptBlock}\n</head>`);
    }
    fs.writeFileSync(pagePath, html);
  });
}

function writeOutputs(graph) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(GRAPH_FILE, `${JSON.stringify(graph, null, 2)}\n`);
  const sourceHash = computeSourceHash();
  fs.writeFileSync(HASH_FILE, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceHash,
    osCount: graph['@graph'][1]?.numberOfItems || 0,
    mntCount: graph['@graph'][2]?.numberOfItems || 0,
  }, null, 2)}\n`);
  return sourceHash;
}

function main() {
  const site = readJson(SITE_CONTRACT);
  const registry = readJson(OS_REGISTRY);
  const graph = buildGraph(site, registry);
  const sourceHash = computeSourceHash();

  if (checkOnly) {
    if (!fs.existsSync(GRAPH_FILE) || !fs.existsSync(HASH_FILE)) {
      console.error('  ✗ schema.org absent — lancer build-schema-org.mjs');
      process.exit(1);
    }
    const stored = readJson(HASH_FILE);
    if (JSON.stringify(stored.sourceHash) !== JSON.stringify(sourceHash)) {
      console.error('  ✗ schema.org périmé — regénérer avec build-schema-org.mjs');
      process.exit(1);
    }
    console.log(
      `✓ schema.org à jour — ${stored.osCount} OS, ${stored.mntCount} module(s) /mnt`,
    );
    return;
  }

  writeOutputs(graph);
  injectHtmlPages(site, graph);
  console.log(
    `✓ schema.org généré — ${graph['@graph'][1].numberOfItems} OS, `
    + `${graph['@graph'][2].numberOfItems} module(s) /mnt → ${GRAPH_FILE}`,
  );
}

main();
