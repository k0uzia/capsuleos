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

function walkScenarioFiles() {
  const out = [];
  walkModuleJsonFiles().forEach((modulePath) => {
    const moduleDir = path.dirname(modulePath);
    const mod = readJson(modulePath);
    (mod.scenarios || []).forEach((rel) => {
      const abs = path.join(moduleDir, rel);
      if (fs.existsSync(abs)) {
        out.push(abs);
      }
    });
  });
  return out;
}

function computeSourceHash() {
  const moduleFiles = walkModuleJsonFiles();
  const scenarioFiles = walkScenarioFiles();
  return {
    osRegistry: sha256File(OS_REGISTRY),
    mntCatalog: fs.existsSync(MNT_CATALOG) ? sha256File(MNT_CATALOG) : '',
    mntModules: moduleFiles.map((f) => sha256File(f)).sort().join('|'),
    mntScenarios: scenarioFiles.map((f) => sha256File(f)).sort().join('|'),
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
    const moduleDir = path.dirname(abs);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const scenarios = [];
    (mod.scenarios || []).forEach((scenarioRel) => {
      const scenarioPath = path.join(moduleDir, scenarioRel);
      if (fs.existsSync(scenarioPath)) {
        scenarios.push({
          data: readJson(scenarioPath),
          rel: path.relative(ROOT, scenarioPath).replace(/\\/g, '/'),
        });
      }
    });
    modules.push({ mod, rel, moduleDir, scenarios });
  });
  return modules;
}

function softwareApplicationItem(baseUrl, entry, position) {
  return {
    '@type': 'ListItem',
    position,
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
  };
}

function buildPortalGraph(site, registry) {
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

  const osItems = entries.map((entry, index) => softwareApplicationItem(baseUrl, entry, index + 1));

  const osList = {
    '@type': 'ItemList',
    name: 'Catalogue OS CapsuleOS (/OS)',
    numberOfItems: osItems.length,
    itemListElement: osItems,
  };

  const mntModules = loadMntModules();
  const learningItems = mntModules.map(({ mod, rel }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: buildModuleResource(baseUrl, mod, rel),
  }));

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

function buildModuleResource(baseUrl, mod, moduleRel, scenarios = []) {
  const modulePath = moduleRel.replace(/\/module\.json$/, '');
  const resource = {
    '@type': 'LearningResource',
    name: mod.title || mod.id,
    description: mod.description || '',
    identifier: mod.id,
    inLanguage: mod.locale || 'fr-FR',
    learningResourceType: 'module',
    url: joinUrl(baseUrl, modulePath),
  };
  if (scenarios.length) {
    resource.hasPart = scenarios.map((s, i) => ({
      '@type': 'Course',
      name: s.data.title || s.data.id,
      identifier: s.data.id,
      position: i + 1,
      url: joinUrl(baseUrl, s.rel),
      inLanguage: s.data.locale || mod.locale || 'fr-FR',
    }));
  }
  return resource;
}

function buildOsLinuxHubGraph(site, registry) {
  const baseUrl = site.baseUrl;
  const statuses = new Set(site.catalogStatuses || ['active']);
  const entries = (registry.entries || []).filter(
    (e) => statuses.has(e.status) && e.family === 'linux',
  );

  const collectionPage = {
    '@type': 'CollectionPage',
    name: 'Catalogue Linux — CapsuleOS',
    url: joinUrl(baseUrl, 'OS/linux/index.html'),
    description: 'Simulations de bureaux Linux (GNOME, Cinnamon, KDE, Cosmic…).',
    inLanguage: 'fr-FR',
  };

  const osItems = entries.map((entry, index) => softwareApplicationItem(baseUrl, entry, index + 1));

  const osList = {
    '@type': 'ItemList',
    name: 'Distributions Linux actives',
    numberOfItems: osItems.length,
    itemListElement: osItems,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [collectionPage, osList],
  };
}

function buildMntHubGraph(site) {
  const baseUrl = site.baseUrl;
  const mntModules = loadMntModules();

  const collectionPage = {
    '@type': 'CollectionPage',
    name: 'Modules pédagogiques — CapsuleOS',
    url: joinUrl(baseUrl, 'mnt/index.html'),
    description: 'Parcours et scénarios montables sur les bureaux simulés.',
    inLanguage: 'fr-FR',
  };

  const learningItems = mntModules.map(({ mod, rel, scenarios }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: buildModuleResource(baseUrl, mod, rel, scenarios),
  }));

  const mntList = {
    '@type': 'ItemList',
    name: 'Modules /mnt',
    numberOfItems: learningItems.length,
    itemListElement: learningItems,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [collectionPage, mntList],
  };
}

function buildAllGraphs(site, registry) {
  const portal = buildPortalGraph(site, registry);
  const osLinuxHub = buildOsLinuxHubGraph(site, registry);
  const mntHub = buildMntHubGraph(site);

  return {
    portal,
    'os-linux-hub': osLinuxHub,
    'mnt-hub': mntHub,
  };
}

function normalizeHtmlPages(site) {
  const raw = site.htmlPages || [{ path: 'index.html', graphKey: 'portal' }];
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      return { path: entry, graphKey: entry === 'index.html' ? 'portal' : entry };
    }
    return entry;
  });
}

function injectHtmlPage(relPage, graphJson) {
  const pagePath = path.join(ROOT, relPage);
  if (!fs.existsSync(pagePath)) {
    throw new Error(`Page HTML introuvable : ${relPage}`);
  }
  const scriptBlock = [
    MARKER_BEGIN,
    `<script type="application/ld+json">${JSON.stringify(graphJson)}</script>`,
    MARKER_END,
  ].join('\n    ');

  let html = fs.readFileSync(pagePath, 'utf8');
  const re = new RegExp(`${MARKER_BEGIN}[\\s\\S]*?${MARKER_END}`, 'm');
  if (re.test(html)) {
    html = html.replace(re, scriptBlock);
  } else {
    html = html.replace('</head>', `    ${scriptBlock}\n</head>`);
  }
  fs.writeFileSync(pagePath, html);
}

function writeOutputs(graphs) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(GRAPH_FILE, `${JSON.stringify(graphs.portal, null, 2)}\n`);
  fs.writeFileSync(
    path.join(OUT_DIR, 'os-linux-hub.json'),
    `${JSON.stringify(graphs['os-linux-hub'], null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'mnt-hub.json'),
    `${JSON.stringify(graphs['mnt-hub'], null, 2)}\n`,
  );

  const portalGraph = graphs.portal;
  const mntGraph = graphs['mnt-hub'];
  const scenarioCount = (mntGraph['@graph'][1]?.itemListElement || [])
    .reduce((n, li) => n + (li.item?.hasPart?.length || 0), 0);

  const sourceHash = computeSourceHash();
  fs.writeFileSync(HASH_FILE, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceHash,
    osCount: portalGraph['@graph'][1]?.numberOfItems || 0,
    linuxCount: graphs['os-linux-hub']['@graph'][1]?.numberOfItems || 0,
    mntCount: mntGraph['@graph'][1]?.numberOfItems || 0,
    scenarioCount,
  }, null, 2)}\n`);
  return sourceHash;
}

function main() {
  const site = readJson(SITE_CONTRACT);
  const registry = readJson(OS_REGISTRY);
  const graphs = buildAllGraphs(site, registry);
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
      `✓ schema.org à jour — ${stored.osCount} OS, ${stored.mntCount} module(s), `
      + `${stored.scenarioCount || 0} scénario(s)`,
    );
    return;
  }

  writeOutputs(graphs);
  normalizeHtmlPages(site).forEach(({ path: relPage, graphKey }) => {
    const graph = graphs[graphKey];
    if (!graph) {
      throw new Error(`Graphe inconnu : ${graphKey} pour ${relPage}`);
    }
    injectHtmlPage(relPage, graph);
  });

  console.log(
    `✓ schema.org généré — ${graphs.portal['@graph'][1].numberOfItems} OS, `
    + `${graphs['mnt-hub']['@graph'][1].numberOfItems} module(s) /mnt → ${GRAPH_FILE}`,
  );
}

main();
