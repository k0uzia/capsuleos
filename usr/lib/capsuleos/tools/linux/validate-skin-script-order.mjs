#!/usr/bin/env node
/**
 * Gate câblage skins Linux — ordre de chargement des scripts + existence des artefacts.
 *
 * Règles :
 *   1. Tout script/CSS local référencé par home/<Vendor>/<Distro>/index.html existe sur disque
 *      (y compris les artefacts générés var/lib/capsuleos/generated/).
 *   2. Ordre catalogues magasin : capsule-store-catalog.js → <vendor>-store-catalog.js
 *      → ./content/*-catalog.js (chaque maillon présent doit précéder le suivant).
 *   3. capsule-app-embed.js précède windowContainer.js (l'embed doit être prêt avant le shell fenêtres).
 *
 * Usage : node usr/lib/capsuleos/tools/linux/validate-skin-script-order.mjs [--json]
 */
import fs from 'fs';
import path from 'path';
import { LINUX_SKIN_FACADES, ROOT } from './linux-skin-facade-lib.mjs';

const json = process.argv.includes('--json');
const errors = [];

function extractLocalRefs(html) {
  const refs = [];
  const re = /<(?:script[^>]+src|link[^>]+href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = m[1];
    if (/^(?:https?:)?\/\//.test(url) || url.startsWith('data:')) {
      continue;
    }
    refs.push(url);
  }
  return refs;
}

function resolveRef(homeRel, url) {
  const clean = url.split('?')[0].split('#')[0];
  return path.resolve(ROOT, homeRel, clean);
}

function checkOrder(homeRel, refs) {
  const scriptRefs = refs.filter((u) => u.split('?')[0].endsWith('.js'));
  const indexOfMatch = (re) => scriptRefs.findIndex((u) => re.test(u));

  const chain = [
    { id: 'capsule-store-catalog', re: /capsule-store-catalog\.js/ },
    { id: 'vendor-store-catalog', re: /[a-z0-9-]+-store-catalog\.js/ },
    { id: 'content-catalog', re: /\.\/content\/[a-z0-9-]+-catalog\.js/ },
  ];
  let prevIdx = -1;
  let prevId = null;
  for (const link of chain) {
    const idx = link.id === 'vendor-store-catalog'
      ? scriptRefs.findIndex((u) => link.re.test(u) && !/capsule-store-catalog\.js/.test(u))
      : indexOfMatch(link.re);
    if (idx === -1) {
      continue;
    }
    if (prevIdx !== -1 && idx < prevIdx) {
      errors.push(`${homeRel}/index.html — ordre catalogues : ${link.id} (#${idx}) précède ${prevId} (#${prevIdx})`);
    }
    prevIdx = idx;
    prevId = link.id;
  }

  const embedIdx = indexOfMatch(/capsule-app-embed\.js/);
  const containerIdx = indexOfMatch(/windowContainer\.js/);
  if (embedIdx !== -1 && containerIdx !== -1 && embedIdx > containerIdx) {
    errors.push(`${homeRel}/index.html — capsule-app-embed.js (#${embedIdx}) doit précéder windowContainer.js (#${containerIdx})`);
  }
}

for (const { home } of LINUX_SKIN_FACADES) {
  const indexPath = path.join(ROOT, home, 'index.html');
  if (!fs.existsSync(indexPath)) {
    errors.push(`${home}/index.html introuvable`);
    continue;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const refs = extractLocalRefs(html);
  for (const url of refs) {
    const abs = resolveRef(home, url);
    if (!fs.existsSync(abs)) {
      errors.push(`${home}/index.html — référence morte : ${url}`);
    }
  }
  checkOrder(home, refs);
}

if (json) {
  console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
} else if (errors.length) {
  errors.forEach((e) => console.error(`✗ ${e}`));
} else {
  console.log(`✓ validate-skin-script-order OK — ${LINUX_SKIN_FACADES.length} skins (ordre catalogues, artefacts présents)`);
}
process.exit(errors.length ? 1 : 0);
