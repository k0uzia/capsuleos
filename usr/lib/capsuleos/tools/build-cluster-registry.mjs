#!/usr/bin/env node
/**
 * Génère le runtime cluster-registry depuis etc/capsuleos/cluster-registry.json :
 *   - usr/lib/capsuleos/core/cluster-registry.js (résolution contentLoader)
 *   - var/lib/capsuleos/generated/capsule-cluster-registry.js (registre complet)
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/build-cluster-registry.mjs
 *   node usr/lib/capsuleos/tools/build-cluster-registry.mjs --check
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const SRC = path.join(ROOT, 'etc/capsuleos/cluster-registry.json');
const CORE_OUT = path.join(ROOT, 'usr/lib/capsuleos/core/cluster-registry.js');
const GEN_OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-cluster-registry.js');

const CHECK_ONLY = process.argv.includes('--check');

const EXPLORERS_PREFIX = 'usr/share/capsuleos/linux/explorers/';
const APPS_PREFIX = 'usr/share/capsuleos/linux/apps/';

/** Alias runtime (explorer-registry.js) absents du JSON. */
const TEMPLATE_ALIASES = {
  'nautilus-cosmic': 'nemo-cosmic',
};

const doc = JSON.parse(fs.readFileSync(SRC, 'utf8'));

function stripExplorersCss(relPath) {
  if (relPath.startsWith(EXPLORERS_PREFIX)) {
    return relPath.slice(EXPLORERS_PREFIX.length);
  }
  return relPath;
}

function toCoreEntry(cluster) {
  const html = cluster.paths.html;
  const cssList = cluster.paths.css || [];
  if (html.startsWith(EXPLORERS_PREFIX)) {
    return {
      explorersBase: true,
      paths: {
        html: html.slice(EXPLORERS_PREFIX.length),
        css: cssList.map(stripExplorersCss),
      },
    };
  }
  if (html.startsWith(APPS_PREFIX)) {
    return {
      explorersBase: false,
      paths: {
        html: html.slice(APPS_PREFIX.length),
        css: cssList.map((c) => {
          if (c.startsWith(APPS_PREFIX)) {
            return c.slice(APPS_PREFIX.length);
          }
          return c;
        }),
      },
    };
  }
  return null;
}

function buildByTemplate() {
  const byTemplate = {};
  doc.clusters.forEach((cluster) => {
    if (!cluster.templateId || !cluster.paths || !cluster.paths.html) {
      return;
    }
    const entry = toCoreEntry(cluster);
    if (entry) {
      byTemplate[cluster.templateId] = entry;
    }
  });
  Object.keys(TEMPLATE_ALIASES).forEach((aliasId) => {
    const sourceId = TEMPLATE_ALIASES[aliasId];
    if (byTemplate[sourceId] && !byTemplate[aliasId]) {
      byTemplate[aliasId] = byTemplate[sourceId];
    }
  });
  return byTemplate;
}

const byTemplate = buildByTemplate();
const byId = Object.fromEntries(doc.clusters.map((c) => [c.id, c]));

function formatCoreEntry(id, entry) {
  const key = /^[a-z][a-z0-9-]*$/i.test(id) && id.indexOf('-') >= 0 ? `'${id}'` : id;
  const css = entry.paths.css.map((c) => `'${c}'`).join(', ');
  return `        ${key}: { paths: { html: '${entry.paths.html}', css: [${css}] }, explorersBase: ${entry.explorersBase} }`;
}

const templateKeys = Object.keys(byTemplate).sort((a, b) => a.localeCompare(b));
const coreBody = `/**
 * CapsuleClusterRegistry — résolution gabarits par cluster (runtime).
 * Données embarquées ; source JSON : etc/capsuleos/cluster-registry.json
 * Regénérer : node usr/lib/capsuleos/tools/build-cluster-registry.mjs
 */
(function (global) {
    'use strict';

    /** @type {Record<string, object>} */
    const BY_TEMPLATE = {
${templateKeys.map((id) => formatCoreEntry(id, byTemplate[id])).join(',\n')}
    };

    function explorersBaseFromApps(appsBase) {
        return String(appsBase).replace(/\\/apps\\/?$/, '/explorers/');
    }

    global.CapsuleClusterRegistry = {
        byTemplateId(templateId) {
            return BY_TEMPLATE[templateId] || null;
        },
        resolveHtmlPath(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths) {
                return null;
            }
            if (cluster.explorersBase) {
                return explorersBaseFromApps(appsBase) + cluster.paths.html;
            }
            return \`\${appsBase}/\${cluster.paths.html}\`;
        },
        resolveCssStack(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths || !cluster.paths.css) {
                return [];
            }
            const base = cluster.explorersBase ? explorersBaseFromApps(appsBase) : appsBase;
            return cluster.paths.css.map((c) => \`\${base}/\${c}\`);
        },
        isClusterTemplate(templateId) {
            return !!BY_TEMPLATE[templateId];
        }
    };
}(typeof window !== 'undefined' ? window : globalThis));
`;

const genBody = `/**
 * Registre clusters CapsuleOS (généré).
 * Source : etc/capsuleos/cluster-registry.json
 * Regénérer : node usr/lib/capsuleos/tools/build-cluster-registry.mjs
 */
(function (global) {
    'use strict';
    const REGISTRY = ${JSON.stringify(doc, null, 2)};
    const BY_ID = ${JSON.stringify(byId, null, 2)};
    const BY_TEMPLATE = ${JSON.stringify(byTemplate, null, 2)};

    function explorersBaseFromApps(appsBase) {
        return String(appsBase).replace(/\\/apps\\/?$/, '/explorers/');
    }

    global.CapsuleClusterRegistry = {
        version: REGISTRY.version,
        get(id) { return BY_ID[id] || null; },
        byTemplateId(templateId) { return BY_TEMPLATE[templateId] || null; },
        resolveHtmlPath(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths) {
                return null;
            }
            if (cluster.explorersBase) {
                return explorersBaseFromApps(appsBase) + cluster.paths.html;
            }
            return \`\${appsBase}/\${cluster.paths.html}\`;
        },
        resolveCssStack(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths || !cluster.paths.css) {
                return [];
            }
            const base = cluster.explorersBase ? explorersBaseFromApps(appsBase) : appsBase;
            return cluster.paths.css.map((c) => \`\${base}/\${c}\`);
        },
        isClusterTemplate(templateId) {
            return !!BY_TEMPLATE[templateId];
        },
        all() { return REGISTRY.clusters.slice(); }
    };
}(typeof window !== 'undefined' ? window : globalThis));
`;

if (CHECK_ONLY) {
  let ok = true;
  if (!fs.existsSync(CORE_OUT) || fs.readFileSync(CORE_OUT, 'utf8') !== coreBody) {
    console.error('✗ cluster-registry.js désynchronisé — exécuter build-cluster-registry.mjs');
    ok = false;
  }
  if (!fs.existsSync(GEN_OUT) || fs.readFileSync(GEN_OUT, 'utf8') !== genBody) {
    console.error('✗ capsule-cluster-registry.js désynchronisé — exécuter build-cluster-registry.mjs');
    ok = false;
  }
  process.exit(ok ? 0 : 1);
}

fs.mkdirSync(path.dirname(GEN_OUT), { recursive: true });
fs.writeFileSync(CORE_OUT, coreBody, 'utf8');
fs.writeFileSync(GEN_OUT, genBody, 'utf8');
console.log(`Écrit ${CORE_OUT} — ${templateKeys.length} templates`);
console.log(`Écrit ${GEN_OUT} — ${doc.clusters.length} clusters`);
