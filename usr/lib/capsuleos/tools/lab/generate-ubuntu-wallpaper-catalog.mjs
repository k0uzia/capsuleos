#!/usr/bin/env node
/**
 * Catalogue fonds d'écran Ubuntu — assets VM sous vendors/ubuntu/wallpaper/.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-ubuntu-wallpaper-catalog.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const WALL_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/ubuntu/wallpaper');
const THUMB_DIR = path.join(WALL_DIR, 'thumbnails');
const OUT_JS = path.join(ROOT, 'var/lib/capsuleos/generated/ubuntu-wallpaper-catalog.js');

const parseArgs = () => ({ write: process.argv.includes('--write') });

const GRAPHITE = {
  id: 'solid-graphite',
  label: 'Graphite',
  type: 'color',
  dark: 'linear-gradient(165deg, #2e2e32 0%, #1c1c1f 100%)',
  light: 'linear-gradient(165deg, #ececf0 0%, #d4d4da 100%)',
};

const stem = (file) => file.replace(/\.[^.]+$/, '');

const slugId = (name) => stem(name)
  .replace(/_Very_Dark$/i, '-very-dark')
  .replace(/_Dimmed_3840x2160$/i, '')
  .replace(/_3840x2160$/i, '')
  .replace(/[-_](Dark|Light)$/i, '')
  .replace(/[-_]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const humanLabel = (name) => {
  let s = stem(name)
    .replace(/_Very_Dark$/i, '')
    .replace(/_Dimmed_3840x2160$/i, '')
    .replace(/_3840x2160$/i, '')
    .replace(/[-_](Dark|Light)$/i, '');
  const dash = s.indexOf('-');
  if (dash > 0 && dash < 18) {
    s = s.slice(dash + 1);
  }
  return s
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isDarkName = (file) => /(?:^|[-_])(dark|night|dimmed|very[-_]dark)(?:\.|[-_]|$)/i.test(file);
const isLightName = (file) => /(?:^|[-_])(light|day)(?:\.|[-_]|$)/i.test(file);

const pickWeb = (files, prefer) => {
  const webp = files.find((f) => f.endsWith('.webp'));
  const png = files.find((f) => f.endsWith('.png'));
  const jpg = files.find((f) => /\.jpe?g$/i.test(f));
  return prefer === 'webp' ? (webp || png || jpg) : (webp || png || jpg);
};

const thumbFor = (file) => {
  if (!file) return null;
  const base = stem(file);
  const thumb = path.join(THUMB_DIR, `${base}-thumb.webp`);
  if (fs.existsSync(thumb)) {
    return `vendors/ubuntu/wallpaper/thumbnails/${base}-thumb.webp`;
  }
  return null;
};

const relWall = (file) => `vendors/ubuntu/wallpaper/${file}`;

const featuredEntries = (files) => {
  const thumbs = `${'vendors/ubuntu/wallpaper'}/thumbnails`;
  const pick = (...names) => {
    for (const n of names) {
      const stemN = stem(n);
      const hit = files.find((f) => f === n)
        || files.find((f) => stem(f) === stemN && f.endsWith('.webp'))
        || files.find((f) => stem(f) === stemN);
      if (hit) {
        return hit;
      }
    }
    return null;
  };
  const adwaitaDark = pick('wallpaper-adwaita-dark.webp', 'ubuntu-wallpaper-d.webp');
  const racoonDark = pick('wallpaper-racoon.webp', 'Resolute_Raccoon_Wallpaper_Dimmed_3840x2160.webp');
  const racoonLight = pick('wallpaper-racoon-light.webp', 'Resolute_Raccoon_Wallpaper_Light_3840x2160.webp');
  const entries = [];
  if (adwaitaDark) {
    entries.push({
      id: 'adwaita',
      label: 'Adwaita',
      type: 'image',
      dark: relWall(adwaitaDark),
      light: relWall(adwaitaDark),
      thumbDark: thumbFor(adwaitaDark) || `${thumbs}/wallpaper-adwaita-dark-thumb.webp`,
      thumbLight: thumbFor(adwaitaDark) || `${thumbs}/wallpaper-adwaita-dark-thumb.webp`,
      gsettingsDark: 'ubuntu-wallpaper-d.png',
      gsettingsLight: 'gnome/adwaita-l.jxl',
    });
  }
  if (racoonDark) {
    entries.push({
      id: 'racoon',
      label: 'Resolute Raccoon',
      type: 'image',
      dark: relWall(racoonDark),
      light: relWall(racoonLight || racoonDark),
      thumbDark: thumbFor(racoonDark) || `${thumbs}/wallpaper-racoon-thumb.webp`,
      thumbLight: thumbFor(racoonLight || racoonDark) || `${thumbs}/wallpaper-racoon-light-thumb.webp`,
      default: true,
    });
  }
  entries.push(GRAPHITE);
  return entries;
};

const buildExtendedCatalog = () => {
  if (!fs.existsSync(WALL_DIR)) {
    return [];
  }
  const files = fs.readdirSync(WALL_DIR)
    .filter((f) => /\.(webp|png|jpe?g)$/i.test(f) && !f.startsWith('wallpaper-racoon') && !f.startsWith('wallpaper-adwaita'))
    .sort((a, b) => a.localeCompare(b, 'fr'));

  const groups = new Map();
  for (const file of files) {
    const key = slugId(file);
    if (!groups.has(key)) {
      groups.set(key, { dark: [], light: [], neutral: [] });
    }
    const bucket = groups.get(key);
    if (isDarkName(file)) {
      bucket.dark.push(file);
    } else if (isLightName(file)) {
      bucket.light.push(file);
    } else {
      bucket.neutral.push(file);
    }
  }

  const featured = featuredEntries(
    fs.readdirSync(WALL_DIR).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)),
  );
  const featuredIds = new Set(featured.map((e) => e.id));
  const entries = [...featured];

  for (const [key, bucket] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))) {
    if (featuredIds.has(key)) {
      continue;
    }
    const darkFile = pickWeb(bucket.dark, 'webp') || pickWeb(bucket.neutral, 'webp');
    const lightFile = pickWeb(bucket.light, 'webp') || darkFile;
    if (!darkFile) {
      continue;
    }
    const label = humanLabel(darkFile);
    if (!label) {
      continue;
    }
    entries.push({
      id: key,
      label,
      type: 'image',
      dark: relWall(darkFile),
      light: relWall(lightFile),
      thumbDark: thumbFor(darkFile),
      thumbLight: thumbFor(lightFile || darkFile),
    });
  }
  return entries;
};

const renderJs = (entries) => `/* Généré par generate-ubuntu-wallpaper-catalog.mjs — ne pas éditer à la main */
(function (global) {
    'use strict';
    global.CAPSULE_UBUNTU_WALLPAPER_CATALOG = ${JSON.stringify(entries, null, 4)};
}(typeof window !== 'undefined' ? window : globalThis));
`;

const main = () => {
  const opts = parseArgs();
  const entries = buildExtendedCatalog();
  if (!entries.length) {
    console.error('Aucun fond sous', WALL_DIR.replace(`${ROOT}/`, ''));
    process.exit(1);
  }
  const js = renderJs(entries);
  if (opts.write) {
    fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });
    fs.writeFileSync(OUT_JS, `${js}\n`);
    console.log(`✓ ${OUT_JS.replace(`${ROOT}/`, '')} (${entries.length} fonds)`);
  } else {
    process.stdout.write(`${js}\n`);
  }
};

main();
