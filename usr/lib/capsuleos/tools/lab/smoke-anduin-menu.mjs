#!/usr/bin/env node
/**
 * Smoke — menu Démarrer AnduinOS (favoris VM, câblage, icônes).
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './replication-chain-lib.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const errors = [];
const index = read('home/Debian/AnduinOS/index.html');
const menuData = read('home/Debian/AnduinOS/content/mainMenu-data.js');
const inventory = JSON.parse(read('root/docs/inventaires/linux-anduinos-menu-entries-vm.json'));

if (!index.includes('content/mainMenu-data.js')) {
  errors.push('index.html : mainMenu-data.js non chargé');
}
if (!index.includes('shells/linux/mainMenu.js')) {
  errors.push('index.html : mainMenu.js non chargé');
}
if (!/CAPSULE_MAIN_MENU_TEMPLATE/.test(index) && !read('etc/capsuleos/profiles/linux-anduinos.json').includes('CAPSULE_MAIN_MENU_TEMPLATE')) {
  errors.push('profil : CAPSULE_MAIN_MENU_TEMPLATE manquant');
}
if (!menuData.includes('const ANDUIN_MENU_FAVORITES')) {
  errors.push('mainMenu-data.js : ANDUIN_MENU_FAVORITES absent');
}
if (menuData.includes('toolkits/cinnamon')) {
  errors.push('mainMenu-data.js : fuite toolkits/cinnamon');
}
if (menuData.includes('org.gnome.Characters') || menuData.includes('org.gnome.Boxes') || menuData.includes('org.gnome.Yelp')) {
  errors.push('mainMenu-data.js : icônes incorrectes (Characters/Boxes/Yelp)');
}

const favMatch = menuData.match(/const ANDUIN_MENU_FAVORITES = (\[[\s\S]*?\]);/);
if (!favMatch) {
  errors.push('mainMenu-data.js : parse ANDUIN_MENU_FAVORITES impossible');
} else {
  const favorites = Function(`"use strict"; return (${favMatch[1]});`)();
  if (favorites.length !== inventory.favorites.length) {
    errors.push(`mainMenu-data.js : ${favorites.length} favoris ≠ ${inventory.favorites.length} VM`);
  }
  const nullLinks = favorites.filter((f) => !f.dataLink);
  if (nullLinks.length) {
    errors.push(`mainMenu-data.js : ${nullLinks.length} favori(s) sans dataLink (${nullLinks.map((f) => f.name).join(', ')})`);
  }
  for (const spec of inventory.favorites) {
    const row = favorites.find((f) => f.name === spec.name);
    if (!row) {
      errors.push(`mainMenu-data.js : favori VM absent « ${spec.name} »`);
      continue;
    }
    if (spec.slot && row.dataLink !== spec.slot) {
      errors.push(`mainMenu-data.js : ${spec.name} → slot ${row.dataLink} (attendu ${spec.slot})`);
    }
    if (!row.icon || !row.icon.startsWith('./assets/images/')) {
      errors.push(`mainMenu-data.js : ${spec.name} sans icône asset`);
    }
    if (spec.slot && !index.includes(`data-link="${spec.slot}"`)) {
      errors.push(`index.html : windowElement manquant pour slot ${spec.slot} (${spec.name})`);
    }
  }
}

const result = { ok: errors.length === 0, registryId: 'linux-anduinos', errors };
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
