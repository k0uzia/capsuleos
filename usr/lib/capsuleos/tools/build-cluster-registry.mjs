#!/usr/bin/env node
/**
 * Génère var/lib/capsuleos/generated/capsule-cluster-registry.js depuis cluster-registry.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const SRC = path.join(ROOT, 'etc/capsuleos/cluster-registry.json');
const OUT = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-cluster-registry.js');

const doc = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const byId = Object.fromEntries(doc.clusters.map((c) => [c.id, c]));
const byTemplate = {};
doc.clusters.forEach((c) => {
  if (c.templateId) {
    byTemplate[c.templateId] = c;
  }
});

const out = `/**
 * Registre clusters CapsuleOS (généré).
 * Source : etc/capsuleos/cluster-registry.json
 * Regénérer : node usr/lib/capsuleos/tools/build-cluster-registry.mjs
 */
(function (global) {
    'use strict';
    const REGISTRY = ${JSON.stringify(doc, null, 2)};
    const BY_ID = ${JSON.stringify(byId, null, 2)};
    const BY_TEMPLATE = ${JSON.stringify(byTemplate, null, 2)};

    global.CapsuleClusterRegistry = {
        version: REGISTRY.version,
        get(id) { return BY_ID[id] || null; },
        byTemplateId(templateId) { return BY_TEMPLATE[templateId] || null; },
        resolveHtmlPath(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths || !cluster.paths.html) {
                return null;
            }
            const html = cluster.paths.html;
            if (html.startsWith('usr/share/')) {
                const rel = appsBase.replace(/\\/apps$/, '').replace(/\\/linux\\/apps$/, '');
                if (appsBase.includes('linux/apps')) {
                    return html.replace('usr/share/capsuleos/linux/', appsBase.replace(/\\/apps$/, '/') );
                }
                return html;
            }
            return html;
        },
        resolveCssStack(templateId) {
            const cluster = BY_TEMPLATE[templateId];
            return cluster && cluster.paths && cluster.paths.css ? cluster.paths.css : [];
        },
        all() { return REGISTRY.clusters.slice(); }
    };
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log(`Écrit ${OUT} — ${doc.clusters.length} clusters`);
