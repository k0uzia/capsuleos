#!/usr/bin/env node
/**
 * Fusionne l'inventaire VM catégories → discover-catalog.json (browseApps + categoryFilters).
 *
 *   node root/tools/lab/merge-discover-catalog-categories.mjs
 *   node root/tools/lab/merge-discover-catalog-categories.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-discover-category-apps.json');
const CATALOG = path.join(ROOT, 'home/Debian/KDE-Neon/content/discover-catalog.json');
const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(INVENTORY)) {
  console.error('Inventaire absent — vm-kde-neon-discover-category-apps-inventory.sh');
  process.exit(1);
}

const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));

/** Apps accueil VM — assignation catégories (complète l'inventaire desktop). */
const HOME_CATEGORY_SEED = {
  accessibility: [],
  office: ['kolourpaint', 'kate'],
  development: ['kate', 'kdenlive', 'libreoffice'],
  education: ['kpat'],
  graphics: ['gimp', 'kolourpaint', 'krita'],
  internet: ['firefox', 'wine', 'steam'],
  games: ['steam', 'kpat', 'wine'],
  multimedia: ['vlc', 'kdenlive', 'rhythmbox', 'lecteur-multimedia'],
  science: [],
  system: ['discover', 'systemsettings'],
  utilities: ['wine', 'kpat'],
  addons: [],
};

const homeIds = new Set();
(catalog.homeSections || []).forEach((section) => {
  (section.apps || []).forEach((app) => {
    if (app.id) homeIds.add(app.id);
  });
});

const INSTALLED_CATEGORY_SEED = {
  internet: ['firefox'],
  multimedia: ['vlc'],
  graphics: ['gwenview', 'okular'],
  development: ['kate'],
  system: ['dolphin', 'discover', 'systemsettings', 'spectacle', 'systemmonitor', 'konsole'],
  utilities: ['ark', 'spectacle'],
  office: ['okular'],
};

/** Catalogue magasin CapsuleOS — apps « À découvrir » par catégorie sidebar. */
const STORE_CATEGORY_SEED = {
  internet: ['thunderbird', 'transmission', 'warpinator'],
  multimedia: ['rhythmbox', 'lecteur-multimedia'],
  office: ['libreoffice', 'calendar'],
  graphics: ['drawing', 'simple-scan'],
  utilities: ['file-roller', 'simple-scan'],
  system: ['timeshift'],
  education: ['calendar'],
  science: ['drawing', 'simple-scan'],
};

const SKIP_BROWSE_IDS = new Set(['nonplasma', 'sms', 'app']);

const installedIds = new Set();
(catalog.installed || []).forEach((app) => {
  if (app.id) installedIds.add(app.id);
});

const browseIndex = new Map();
(catalog.browseApps || []).forEach((app) => {
  if (app.id) browseIndex.set(app.id, { ...app });
});

for (const app of inv.browseApps || []) {
  if (!app.id || homeIds.has(app.id) || installedIds.has(app.id) || SKIP_BROWSE_IDS.has(app.id)) {
    continue;
  }
  browseIndex.set(app.id, {
    id: app.id,
    name: app.name,
    desc: app.desc || '',
    icon: app.icon,
    componentId: app.componentId,
  });
}

// Installé(s) référencé par catégorie mais absent de browseApps
(catalog.installed || []).forEach((app) => {
  if (!app.id || browseIndex.has(app.id) || homeIds.has(app.id)) {
    return;
  }
  browseIndex.set(app.id, {
    id: app.id,
    name: app.name,
    desc: app.desc || '',
    icon: app.icon,
    iconBase: app.iconBase,
  });
});

const categoryFilters = { ...(catalog.categoryFilters || {}) };
categoryFilters.all = categoryFilters.all || { label: 'Toutes les applications' };

for (const [catId, block] of Object.entries(inv.categories || {})) {
  const vmIds = block.appIds || [];
  const homeForCat = (HOME_CATEGORY_SEED[catId] || []).filter((id) => homeIds.has(id));
  const installedForCat = (INSTALLED_CATEGORY_SEED[catId] || []).filter((id) => installedIds.has(id));
  if (categoryFilters[catId]?.appIds) {
    categoryFilters[catId].appIds.forEach((id) => {
      if (homeIds.has(id) && !homeForCat.includes(id)) homeForCat.push(id);
    });
  }
  const storeForCat = (STORE_CATEGORY_SEED[catId] || []);
  const vmFiltered = vmIds.filter((id) => !SKIP_BROWSE_IDS.has(id));
  const merged = [...new Set([...homeForCat, ...installedForCat, ...vmFiltered, ...storeForCat])];
  categoryFilters[catId] = {
    label: block.label || categoryFilters[catId]?.label || catId,
    appIds: merged,
  };
}

const next = {
  ...catalog,
  browseApps: [...browseIndex.values()],
  categoryFilters,
  categoryAppsMeta: {
    source: 'vm-kde-neon-discover-category-apps-inventory.sh',
    collectedAt: inv.collectedAt,
    vm: inv.vm,
    maxPerCategory: inv.maxPerCategory,
  },
};

if (dryRun) {
  console.log(JSON.stringify({
    browseApps: next.browseApps.length,
    categoryFilters: Object.keys(next.categoryFilters).length,
    sample: next.categoryFilters.internet,
  }, null, 2));
  process.exit(0);
}

fs.writeFileSync(CATALOG, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(`merge-discover-catalog-categories — OK (${next.browseApps.length} browseApps, ${Object.keys(categoryFilters).length} catégories)`);
