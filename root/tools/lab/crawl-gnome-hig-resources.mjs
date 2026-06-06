#!/usr/bin/env node
/**
 * Crawl récursif GNOME HIG depuis resources.html → inventaire JSON.
 * Usage : node root/tools/lab/crawl-gnome-hig-resources.mjs [out-json]
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const OUT = process.argv[2] || path.join(ROOT, 'root/docs/inventaires/gnome-hig-resources.json');

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

const isContentPage = (url) => {
  const { pathname } = new URL(url);
  return pathname.startsWith('/hig/')
    && !pathname.includes('/_static/')
    && !pathname.endsWith('.css')
    && !pathname.endsWith('.svg');
};

const START = [
  'https://developer.gnome.org/hig/resources.html',
  'https://developer.gnome.org/hig/',
];

const queue = [...START];
const seen = new Set();
const pages = [];
const libadwaita = new Set();
const gitlab = new Set();
const assets = new Set();
const apps = new Set();
const outbound = new Set();

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
    ?.replace(/&amp;/g, '&')
    .trim() || '';

  if (isContentPage(url)) {
    pages.push({ url, title });
  }

  for (const match of res.data.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const abs = new URL(match[1], url).href.split('#')[0];
      const host = new URL(abs);

      if (host.hostname === 'developer.gnome.org' && host.pathname.startsWith('/hig')) {
        if (isContentPage(abs) && !seen.has(abs)) queue.push(abs);
      } else if (host.hostname === 'developer.gnome.org') {
        outbound.add(abs);
      }

      if (host.hostname === 'gnome.pages.gitlab.gnome.org' && host.pathname.includes('/libadwaita/')) {
        libadwaita.add(abs);
      }

      if (host.hostname === 'gitlab.gnome.org') {
        if (/\.(svg|png|jpg|xml|gpl)$/i.test(host.pathname)) assets.add(abs);
        else gitlab.add(abs);
      }

      if (host.hostname === 'apps.gnome.org' || host.hostname === 'flathub.org') {
        apps.add(abs);
      }
    } catch {
      /* ignore malformed */
    }
  }
}

pages.sort((a, b) => a.url.localeCompare(b.url));

const inventory = {
  version: 1,
  crawledAt: new Date().toISOString(),
  source: 'https://developer.gnome.org/hig/resources.html',
  method: 'recursive crawl developer.gnome.org/hig/* + outbound links from each page',
  contentPageCount: pages.length,
  pages,
  outboundTools: {
    designApps: [...apps].sort(),
    libadwaitaApi: [...libadwaita].sort(),
    gitlabSources: [...gitlab].sort(),
    assets: [...assets].sort(),
    other: [...outbound].filter((u) => !u.startsWith('https://developer.gnome.org/hig')).sort(),
  },
  capsuleMapping: {
    shell: [
      'https://developer.gnome.org/hig/principles.html',
      'https://developer.gnome.org/hig/patterns/nav/search.html',
      'https://developer.gnome.org/hig/reference/keyboard.html',
    ],
    topBar: [
      'https://developer.gnome.org/hig/guidelines/typography.html',
      'https://developer.gnome.org/hig/guidelines/ui-icons.html',
      'https://developer.gnome.org/hig/patterns/containers/popovers.html',
    ],
    overview: [
      'https://developer.gnome.org/hig/patterns/nav/search.html',
      'https://developer.gnome.org/hig/guidelines/writing-style.html',
    ],
    apps: [
      'https://developer.gnome.org/hig/patterns/containers/header-bars.html',
      'https://developer.gnome.org/hig/patterns/containers/windows.html',
      'https://developer.gnome.org/hig/patterns/nav/sidebars.html',
      'https://developer.gnome.org/hig/patterns/nav/tabs.html',
    ],
    settings: [
      'https://developer.gnome.org/hig/patterns/containers/utility-panes.html',
      'https://developer.gnome.org/hig/patterns/controls/switches.html',
      'https://developer.gnome.org/hig/patterns/nav/view-switchers.html',
    ],
    a11y: [
      'https://developer.gnome.org/hig/guidelines/accessibility.html',
      'https://developer.gnome.org/hig/guidelines/keyboard.html',
      'https://developer.gnome.org/hig/guidelines/pointer-touch.html',
    ],
    visual: [
      'https://developer.gnome.org/hig/reference/palette.html',
      'https://developer.gnome.org/hig/reference/backgrounds.html',
      'https://developer.gnome.org/hig/guidelines/typography.html',
      'https://developer.gnome.org/hig/guidelines/ui-styling.html',
      'https://developer.gnome.org/hig/guidelines/app-icons.html',
    ],
  },
  internalDocs: {
    human: 'root/docs/gnome-hig-ressources.md',
    skill: 'root/skills/gnome-hig-replication/SKILL.md',
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(inventory, null, 2)}\n`);
process.stdout.write(`OK ${OUT} (${pages.length} pages HIG)\n`);
