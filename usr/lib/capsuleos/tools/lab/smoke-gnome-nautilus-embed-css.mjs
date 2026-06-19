#!/usr/bin/env node
/**
 * file:// — resolveEmbeddedCssBase doit charger la pile nemo-gnome (header-gnome.css),
 * pas l'alias Cinnamon apps/style/nemo.base.css seul.
 *
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-embed-css.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const EMBED_PATH = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');

const resolveEmbeddedCssBase = (embed, templateId) => {
  const cssBaseTemplateId = templateId === 'nemo-gnome' || templateId === 'nemo-cosmic' ? 'nemo' : templateId;
  if (embed.templates[templateId]?.cssBase) {
    return embed.templates[templateId].cssBase;
  }
  if (embed.templates[cssBaseTemplateId]?.cssBase) {
    return embed.templates[cssBaseTemplateId].cssBase;
  }
  return '';
};

const raw = fs.readFileSync(EMBED_PATH, 'utf8');
const json = raw.match(/window\.CAPSULE_APP_EMBED = (\{[\s\S]*\});\nwindow\.CAPSULE_EMBED/);
if (!json) {
  console.error('smoke-gnome-nautilus-embed-css — embed JSON introuvable');
  process.exit(1);
}

const embed = JSON.parse(json[1]);
const cssBase = resolveEmbeddedCssBase(embed, 'nemo-gnome');
const legacyNemo = embed.templates.nemo?.cssBase || '';

const errors = [];
if (!cssBase.includes('nautilus-app__head-plate')) {
  errors.push('cssBase nemo-gnome sans header-gnome.css');
}
if (!cssBase.includes('main.nautilus-app--n47#gestionnaire')) {
  errors.push('cssBase nemo-gnome sans garde-fous N47');
}
if (cssBase.length <= legacyNemo.length) {
  errors.push(`cssBase trop court (${cssBase.length} ≤ nemo legacy ${legacyNemo.length})`);
}
if (legacyNemo.includes('nautilus-app__head-plate')) {
  errors.push('templates.nemo ne doit pas contenir header-gnome (alias legacy seul)');
}

if (errors.length) {
  console.error('smoke-gnome-nautilus-embed-css — échec');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log(`✓ smoke-gnome-nautilus-embed-css OK — pile ${cssBase.length} octets (legacy nemo ${legacyNemo.length})`);
