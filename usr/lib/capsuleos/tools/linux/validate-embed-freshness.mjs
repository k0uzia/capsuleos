#!/usr/bin/env node
/**
 * Gate fraîcheur embed — échec si capsule-app-embed.js est périmé par rapport
 * à ses sources (gabarits apps, styles base, skins CSS, strings, manifeste).
 *
 * Usage : node usr/lib/capsuleos/tools/linux/validate-embed-freshness.mjs
 * Correctif : node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
 */
import fs from 'fs';
import {
  EMBED_FILE,
  EMBED_HASH_FILE,
  computeEmbedSourcesHash,
  readEmbedSourcesHash,
  ROOT,
} from './embed-sources-hash.mjs';

const errors = [];

if (!fs.existsSync(EMBED_FILE)) {
  errors.push('capsule-app-embed.js absent — lancer sync-linux-skin-closure.mjs');
} else {
  const recorded = readEmbedSourcesHash();
  if (!recorded) {
    errors.push('capsule-app-embed.hash.json absent — relancer build-linux-embed.mjs (sync-linux-skin-closure)');
  } else {
    const current = computeEmbedSourcesHash();
    if (current.hash !== recorded.hash) {
      errors.push(
        'Embed périmé : les sources (gabarits/skins/strings) ont changé depuis le dernier build '
        + `(${recorded.generatedAt}) — lancer node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`,
      );
    }
  }
}

if (errors.length) {
  errors.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}
console.log('✓ validate-embed-freshness OK — capsule-app-embed.js aligné sur ses sources');
