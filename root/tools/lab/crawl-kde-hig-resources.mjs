#!/usr/bin/env node
/**
 * Crawl récursif KDE HIG depuis develop.kde.org/hig/ → inventaire JSON.
 * Usage : node root/tools/lab/crawl-kde-hig-resources.mjs [out-json]
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const OUT = process.argv[2] || path.join(ROOT, 'root/docs/inventaires/kde-hig-resources.json');
const BASE = 'https://develop.kde.org';

const fetchText = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': 'CapsuleOS-doc-crawler/1.0' }, timeout: 25000 }, (res) => {
    if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
      const next = new URL(res.headers.location, url).href;
      res.resume();
      return resolve(fetchText(next));
    }
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => resolve({ url, status: res.statusCode, data }));
  }).on('error', reject);
});

const normalizeUrl = (href, base) => {
  try {
    const abs = new URL(href, base).href.split('#')[0];
    if (abs.endsWith('/') === false && !abs.includes('.')) return `${abs}/`;
    return abs;
  } catch {
    return null;
  }
};

const isContentPage = (url) => {
  const { pathname, hostname } = new URL(url);
  return hostname === 'develop.kde.org'
    && pathname.startsWith('/hig/')
    && pathname !== '/hig/'
    && !pathname.endsWith('.xml')
    && !pathname.endsWith('.css')
    && !pathname.endsWith('.svg')
    && !pathname.endsWith('.png');
};

const START = [
  `${BASE}/hig/`,
  `${BASE}/hig/kde_app_design/`,
];

const queue = [...START];
const seen = new Set();
const pages = [];
const kirigami = new Set();
const inventKde = new Set();
const breeze = new Set();
const qtDocs = new Set();
const other = new Set();

while (queue.length) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);

  const res = await fetchText(url).catch((err) => {
    process.stderr.write(`  skip ${url} (${err.message})\n`);
    return null;
  });
  if (!res?.data || res.status >= 400) continue;

  const title = (res.data.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]
    ?.replace(/\s*\|\s*Developer\s*$/i, '')
    .replace(/&amp;/g, '&')
    .trim() || '';

  if (isContentPage(url)) {
    pages.push({ url, title });
  }

  for (const match of res.data.matchAll(/href=["']?(\/hig\/[^"'>\s]+)["']?/gi)) {
    const abs = normalizeUrl(match[1], url);
    if (abs && isContentPage(abs) && !seen.has(abs)) queue.push(abs);
  }

  for (const match of res.data.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const abs = normalizeUrl(match[1], url);
      if (!abs) continue;
      const host = new URL(abs);

      if (host.hostname === 'develop.kde.org' && host.pathname.startsWith('/hig')) {
        if (isContentPage(abs) && !seen.has(abs)) queue.push(abs);
        continue;
      }

      if (host.hostname === 'develop.kde.org' && host.pathname.includes('/docs/')) {
        if (/kirigami|plasma|frameworks/i.test(abs)) kirigami.add(abs);
        else other.add(abs);
      } else if (host.hostname === 'invent.kde.org') {
        inventKde.add(abs);
      } else if (/breeze|icon.*theme|visualdesigngroup/i.test(abs)) {
        breeze.add(abs);
      } else if (host.hostname === 'doc.qt.io' || host.hostname === 'api.kde.org') {
        qtDocs.add(abs);
      } else if (host.hostname !== 'develop.kde.org') {
        other.add(abs);
      }
    } catch {
      /* ignore malformed */
    }
  }
}

pages.sort((a, b) => a.url.localeCompare(b.url));

const pageUrl = (slug) => `${BASE}/hig/${slug}/`;

const inventory = {
  version: 1,
  crawledAt: new Date().toISOString(),
  source: `${BASE}/hig/`,
  method: 'recursive crawl develop.kde.org/hig/* (Hugo sidebar + href) + outbound links',
  contentPageCount: pages.length,
  pages,
  outboundTools: {
    kirigamiAndPlasma: [...kirigami].sort(),
    inventKde: [...inventKde].sort(),
    breeze: [...breeze].sort(),
    qtDocs: [...qtDocs].sort(),
    other: [...other].sort(),
  },
  capsuleMapping: {
    plasmaPanel: [
      pageUrl('layout_and_nav'),
      pageUrl('status_changes'),
      pageUrl('icons/monochrome/status'),
      pageUrl('text_and_labels'),
    ],
    kickoff: [
      pageUrl('layout_and_nav'),
      pageUrl('simple_by_default'),
      pageUrl('icons/monochrome/action'),
      pageUrl('icons/colorful/application'),
    ],
    tray: [
      pageUrl('status_changes'),
      pageUrl('getting_input'),
      pageUrl('icons/monochrome/status'),
      pageUrl('icons/monochrome/action'),
    ],
    discover: [
      pageUrl('displaying_content'),
      pageUrl('layout_and_nav'),
      pageUrl('icons/colorful/application'),
      pageUrl('icons/colorful/category_preferences'),
    ],
    dolphin: [
      pageUrl('displaying_content'),
      pageUrl('getting_input'),
      pageUrl('layout_and_nav'),
      pageUrl('icons/colorful/places'),
      pageUrl('icons/monochrome/places'),
      pageUrl('icons/colorful/mimetype'),
    ],
    a11y: [
      pageUrl('accessibility'),
      pageUrl('text_and_labels'),
      pageUrl('icons/localization'),
    ],
    visual: [
      pageUrl('kde_app_design'),
      pageUrl('text_and_labels'),
      pageUrl('icons'),
      pageUrl('icons/colorful'),
      pageUrl('icons/monochrome'),
    ],
  },
  internalDocs: {
    human: 'root/docs/kde-hig-ressources.md',
    skill: 'root/skills/kde-hig-replication/SKILL.md',
    branch: 'root/docs/branche-plasma-kde.md',
    reference: 'root/docs/reference-kde-expert.md',
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(inventory, null, 2)}\n`);
process.stdout.write(`OK ${OUT} (${pages.length} pages HIG)\n`);
