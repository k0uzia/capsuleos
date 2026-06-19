#!/usr/bin/env node
/**
 * Régénère MENU_APPS Cinnamon depuis le manifeste VM (gridVisible).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-menu-data.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadManifest } from './vm-manifest-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';
import { resolveCsPanel, panelExists } from './mint-desktop-cs-panel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');

/**
 * Vérité VM : libellés/descriptions affichés par le menu Cinnamon (fr_FR, gettext
 * X-Ubuntu-Gettext-Domain) — root/docs/inventaires/linux-mint-menu-entries-vm.json.
 */
const VM_ENTRIES_PATH = path.join(ROOT, 'root/docs/inventaires/linux-mint-menu-entries-vm.json');
const VM_ENTRIES = fs.existsSync(VM_ENTRIES_PATH)
  ? new Map(JSON.parse(fs.readFileSync(VM_ENTRIES_PATH, 'utf8')).entries.map((e) => [e.file, e]))
  : new Map();

/** Favoris VM ordonnés (gsettings org.cinnamon favorite-apps) — sidebar + catégorie Favoris. */
const FAVORITE_DESKTOPS = [
  'org.gnome.Calculator.desktop',
  'org.gnome.Calendar.desktop',
  'org.x.editor.desktop',
  'mintinstall.desktop',
  'cinnamon-settings.desktop',
];

/** Mapping explicite .desktop → slot CapsuleOS (prioritaire sur les règles heuristiques). */
const DESKTOP_SLOT = {
  'nemo.desktop': { slot: 'nemo', catId: 'access' },
  'firefox.desktop': { slot: 'firefox', catId: 'internet' },
  'org.gnome.Terminal.desktop': { slot: 'terminal', catId: 'admin' },
  'org.gnome.Calculator.desktop': { slot: 'calculator', catId: 'access' },
  'org.gnome.Calendar.desktop': { slot: 'calendar', catId: 'access' },
  'org.x.editor.desktop': { slot: 'text_editor', catId: 'access' },
  'vim.desktop': { slot: 'text_editor', catId: 'access' },
  'mintinstall.desktop': { slot: 'mintinstall', catId: 'admin' },
  'mintupdate.desktop': { slot: 'update_manager', catId: 'admin' },
  'mintdrivers.desktop': { slot: 'mintdrivers', catId: 'admin' },
  'mintbackup.desktop': { slot: 'mintbackup', catId: 'admin' },
  'mintstick.desktop': { slot: 'mintstick', catId: 'admin' },
  'mintstick-format.desktop': { slot: 'mintstick_format', catId: 'admin' },
  'mintreport.desktop': { slot: 'themes', catId: 'admin' },
  'mintsources.desktop': { slot: 'themes', catId: 'prefs' },
  'system-config-printer.desktop': { slot: 'themes', catId: 'prefs' },
  'org.gnome.seahorse.Application.desktop': { slot: 'themes', catId: 'prefs' },
  'onboard.desktop': { slot: 'themes', catId: 'prefs' },
  'blueman-adapters.desktop': { slot: 'themes', catId: 'prefs' },
  'org.freedesktop.IBus.Setup.desktop': { slot: 'themes', catId: 'prefs' },
  'timeshift-gtk.desktop': { slot: 'timeshift', catId: 'admin' },
  'mintwelcome.desktop': { slot: 'mintwelcome', catId: 'prefs' },
  'gufw.desktop': { slot: 'themes', catId: 'prefs' },
  'blueman-manager.desktop': { slot: 'themes', catId: 'prefs' },
  'org.gnome.DiskUtility.desktop': { slot: 'gnome_disks', catId: 'prefs' },
  'org.gnome.baobab.desktop': { slot: 'baobab', catId: 'admin' },
  'org.gnome.SystemMonitor.desktop': { slot: 'system_monitor', catId: 'admin' },
  'org.gnome.PowerStats.desktop': { slot: 'power_stats', catId: 'prefs' },
  'org.gnome.font-viewer.desktop': { slot: 'font_viewer', catId: 'prefs' },
  'gucharmap.desktop': { slot: 'gucharmap', catId: 'access' },
  'simple-scan.desktop': { slot: 'simple_scan', catId: 'graph' },
  'org.gnome.Rhythmbox3.desktop': { slot: 'rhythmbox', catId: 'sonvideo' },
  'sticky.desktop': { slot: 'sticky', catId: 'access' },
  'hypnotix.desktop': { slot: 'hypnotix', catId: 'sonvideo' },
  'transmission-gtk.desktop': { slot: 'transmission', catId: 'internet' },
  'org.x.Warpinator.desktop': { slot: 'warpinator', catId: 'access' },
  'thingy.desktop': { slot: 'thingy', catId: 'bureau' },
  'bulky.desktop': { slot: 'bulky', catId: 'access' },
  'thunderbird.desktop': { slot: 'thunderbird', catId: 'internet' },
  'webapp-manager.desktop': { slot: 'webapp_manager', catId: 'internet' },
  'cinnamon-settings.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-settings-themes.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-settings-backgrounds.desktop': { slot: 'themes', catId: 'prefs' },
  'mintsysadm.desktop': { slot: 'themes', catId: 'prefs' },
  'nm-connection-editor.desktop': { slot: 'themes', catId: 'prefs' },
  'lightdm-settings.desktop': { slot: 'themes', catId: 'prefs' },
  'mintlocale.desktop': { slot: 'themes', catId: 'prefs' },
  'mintlocale-im.desktop': { slot: 'themes', catId: 'prefs' },
  'gnome-online-accounts-gtk.desktop': { slot: 'themes', catId: 'prefs' },
  'org.gnome.font-viewer.desktop': { slot: 'themes', catId: 'prefs' },
  'fingwit.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-onscreen-keyboard.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-display-panel.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-network-panel.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-color-panel.desktop': { slot: 'themes', catId: 'prefs' },
  'cinnamon-wacom-panel.desktop': { slot: 'themes', catId: 'prefs' },
  'libreoffice-writer.desktop': { slot: 'libreoffice_startcenter', catId: 'bureau' },
  'libreoffice-calc.desktop': { slot: 'librecalc', catId: 'bureau' },
  'libreoffice-impress.desktop': { slot: 'libreoffice_impress', catId: 'bureau' },
  'libreoffice-draw.desktop': { slot: 'libreoffice_draw', catId: 'bureau' },
  'libreoffice-startcenter.desktop': { slot: 'libreoffice_startcenter', catId: 'bureau' },
  'io.github.celluloid_player.Celluloid.desktop': { slot: 'lecteur_multimedia', catId: 'sonvideo' },
  'xviewer.desktop': { slot: 'visionneur_images', catId: 'graph' },
  'pix.desktop': { slot: 'visionneur_images', catId: 'graph' },
  'xreader.desktop': { slot: 'visionneur_pdf', catId: 'graph' },
  'org.gnome.FileRoller.desktop': { slot: 'file_roller', catId: 'access' },
  'org.gnome.Screenshot.desktop': { slot: 'screenshot', catId: 'access' },
  'com.github.maoschanz.drawing.desktop': { slot: 'drawing', catId: 'graph' },
};

/** Tous les sous-panneaux Paramètres Cinnamon → fenêtre themes (gabarit partagé). */
const THEMES_DESKTOP_PREFIXES = ['cinnamon-settings-', 'cinnamon-'];
const THEMES_DESKTOP_SUFFIX = '-panel.desktop';

/** Apps Mint / GNOME utilitaires sans .desktop dédié dans DESKTOP_SLOT → themes. */
const THEMES_APP_IDS = new Set([
  'cinnamon-settings',
  'mintsysadm',
  'nm-connection-editor',
  'lightdm-settings',
  'mintlocale',
  'mintlocale-im',
  'gnome-online-accounts-gtk',
  'org.gnome.font-viewer',
  'fingwit',
  'cinnamon-onscreen-keyboard',
  'cinnamon-display-panel',
  'cinnamon-network-panel',
  'cinnamon-color-panel',
  'cinnamon-wacom-panel',
]);

const catFromCategories = (categories, desktopPath) => {
  const mapped = DESKTOP_SLOT[desktopPath];
  if (mapped && mapped.catId) {
    return mapped.catId;
  }
  const c = String(categories || '').toLowerCase();
  if (c.includes('settings') || c.includes('x-cinnamon-settings')) return 'prefs';
  if (c.includes('system') || c.includes('admin')) return 'admin';
  if (c.includes('office') || c.includes('bureau')) return 'bureau';
  if (c.includes('graphics') || c.includes('graphic') || c.includes('2dgraphics')) return 'graph';
  if (c.includes('audiovideo') || c.includes('audio') || c.includes('video')) return 'sonvideo';
  if (c.includes('network') || c.includes('internet')) return 'internet';
  return 'access';
};

const isCinnamonSettingsDesktop = (desktop) => {
  if (desktop.startsWith('cinnamon-settings-')) {
    return true;
  }
  if (desktop.startsWith('cinnamon-') && desktop.endsWith(THEMES_DESKTOP_SUFFIX)) {
    return true;
  }
  return false;
};

const slotForEntry = (entry) => {
  const desktop = entry.desktopPath ? path.basename(entry.desktopPath) : `${entry.id}.desktop`;
  const appId = entry.normalizedId || entry.id;

  const mapped = DESKTOP_SLOT[desktop];
  if (mapped) {
    return mapped.slot;
  }

  if (isCinnamonSettingsDesktop(desktop) || THEMES_APP_IDS.has(appId)) {
    return 'themes';
  }

  if (desktop.startsWith('cinnamon-settings-')) {
    return 'themes';
  }

  if (desktop.startsWith('webapp-') && desktop.endsWith('.desktop')) {
    return 'firefox';
  }

  return null;
};

const resolveIcon = (appId, vmIcon) => {
  const cinnamonBare = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/cinnamon/apps', appId);
  if (fs.existsSync(cinnamonBare)) {
    return `./assets/images/toolkits/cinnamon/apps/${appId}`;
  }
  const exts = ['.png', '.svg', '.webp'];
  for (const ext of exts) {
    const cinnamon = path.join(ROOT, `usr/share/capsuleos/assets/images/toolkits/cinnamon/apps/${appId}${ext}`);
    if (fs.existsSync(cinnamon)) {
      return `./assets/images/toolkits/cinnamon/apps/${appId}${ext}`;
    }
  }
  if (vmIcon && !vmIcon.includes('/')) {
    for (const ext of exts) {
      const byIcon = path.join(ROOT, `usr/share/capsuleos/assets/images/toolkits/cinnamon/apps/${vmIcon}${ext}`);
      if (fs.existsSync(byIcon)) {
        return `./assets/images/toolkits/cinnamon/apps/${vmIcon}${ext}`;
      }
    }
    const cinnamonBareIcon = path.join(ROOT, 'usr/share/capsuleos/assets/images/toolkits/cinnamon/apps', vmIcon);
    if (fs.existsSync(cinnamonBareIcon)) {
      return `./assets/images/toolkits/cinnamon/apps/${vmIcon}`;
    }
  }
  return './assets/images/toolkits/cinnamon/apps/preferences-system.png';
};

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const buildMenuApps = () => {
  const manifest = loadManifest('linux-mint');
  const grid = manifest.applications?.gridVisible || [];
  const seen = new Set();
  const apps = [];

  grid.forEach((entry) => {
    const desktop = entry.desktopPath ? path.basename(entry.desktopPath) : entry.id;
    if (seen.has(desktop)) return;
    seen.add(desktop);
    const appId = entry.normalizedId || entry.id;
    const slot = slotForEntry({ ...entry, id: appId, desktopPath: entry.desktopPath });
    const dataLink = slot ? `'${esc(slot)}'` : 'null';
    const vmEntry = VM_ENTRIES.get(desktop);
    const name = (vmEntry && vmEntry.name) || entry.name || entry.nameEn || appId;
    const slotRaw = slot ? slot.replace(/^'|'$/g, '') : null;
    let csPanel = null;
    if (slotRaw === 'themes') {
      csPanel = resolveCsPanel({ desktopPath: entry.desktopPath || desktop, name });
      if (csPanel && !panelExists(csPanel)) {
        console.warn(`⚠ csPanel "${csPanel}" absent de cinnamon-settings PANELS (${name})`);
        csPanel = null;
      }
    }
    apps.push({
      catId: catFromCategories(entry.categories, desktop),
      icon: resolveIcon(appId, entry.icon),
      name,
      desc: (vmEntry && vmEntry.comment) || entry.comment || entry.nameEn || entry.name || 'Application Linux Mint',
      dataLink,
      csPanel,
      favoriteRank: FAVORITE_DESKTOPS.indexOf(desktop),
      desktop,
      sortKey: name.toLowerCase(),
    });
  });

  apps.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'fr'));
  return apps;
};

const renderFile = (apps) => {
  const lines = [];
  lines.push('/**');
  lines.push(' * Catalogue menu Cinnamon / Linux Mint — généré depuis proc/linux-mint (ManΣ).');
  lines.push(' * node usr/lib/capsuleos/tools/lab/generate-mint-menu-data.mjs --write');
  lines.push(' */');
  lines.push('// Catégories + icônes symboliques XApp (xsi-*) — vérité VM menu@cinnamon.org');
  lines.push("const MENU_CAT_ICON_BASE = './assets/images/toolkits/cinnamon/menu/symbolic/';");
  lines.push('const MENU_CATS = [');
  lines.push("    { id: 'all',       label: 'Toutes les applications', icon: MENU_CAT_ICON_BASE + 'cinnamon-all-applications-symbolic.svg' },");
  lines.push("    { id: 'access',    label: 'Accessoires', icon: MENU_CAT_ICON_BASE + 'xsi-applications-accessories-symbolic.svg' },");
  lines.push("    { id: 'bureau',    label: 'Bureautique', icon: MENU_CAT_ICON_BASE + 'xsi-applications-office-symbolic.svg' },");
  lines.push("    { id: 'graph',     label: 'Graphisme', icon: MENU_CAT_ICON_BASE + 'xsi-applications-graphics-symbolic.svg' },");
  lines.push("    { id: 'internet',  label: 'Internet', icon: MENU_CAT_ICON_BASE + 'xsi-applications-internet-symbolic.svg' },");
  lines.push("    { id: 'sonvideo',  label: 'Son et vidéo', icon: MENU_CAT_ICON_BASE + 'xsi-applications-multimedia-symbolic.svg' },");
  lines.push("    { id: 'prefs',     label: 'Préférences', icon: MENU_CAT_ICON_BASE + 'xsi-applications-preferences-symbolic.svg' },");
  lines.push("    { id: 'admin',     label: 'Administration', icon: MENU_CAT_ICON_BASE + 'xsi-applications-administration-symbolic.svg' },");
  lines.push("    { id: 'favorites', label: 'Favoris', icon: MENU_CAT_ICON_BASE + 'xsi-user-favorites-symbolic.svg' },");
  lines.push("    { id: 'recent',    label: 'Fichiers récents', icon: MENU_CAT_ICON_BASE + 'xsi-folder-recent-symbolic.svg' },");
  lines.push('];');
  lines.push('');
  lines.push('const MENU_SHORTCUTS = {');
  lines.push('    desktop: {');
  lines.push("        dataLink: 'nemo',");
  lines.push("        directory: './apps/system/Dossier_personnel/Bureau',");
  lines.push('    },');
  lines.push('    downloads: {');
  lines.push("        dataLink: 'nemo',");
  lines.push("        directory: './apps/system/Dossier_personnel/Téléchargements',");
  lines.push('    },');
  lines.push('};');
  lines.push('');
  lines.push('const MENU_APPS = [');
  apps.forEach((app) => {
    const csPart = app.csPanel ? `, csPanel: '${esc(app.csPanel)}'` : '';
    const favPart = app.favoriteRank >= 0 ? `, favorite: true, favoriteRank: ${app.favoriteRank}` : '';
    lines.push(`    { catId: '${esc(app.catId)}', icon: '${esc(app.icon)}', name: '${esc(app.name)}', desc: '${esc(app.desc)}', dataLink: ${app.dataLink}${csPart}${favPart} },`);
  });
  lines.push('];');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const main = () => {
  const write = process.argv.includes('--write');
  const apps = buildMenuApps();
  const content = renderFile(apps);
  if (write) {
    fs.writeFileSync(OUT, content);
    console.log(`✓ ${OUT.replace(`${ROOT}/`, '')} (${apps.length} apps grille VM)`);
  } else {
    process.stdout.write(content);
  }
};

main();
