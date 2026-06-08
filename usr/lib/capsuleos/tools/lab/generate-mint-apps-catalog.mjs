#!/usr/bin/env node
/**
 * Génère le catalogue alphabétique Mint VM → CapsuleOS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const VM_JSON = path.join(ROOT, 'root/docs/inventaires/linux-mint-vm.json');
const OUT_JSON = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-catalog.json');
const OUT_MD = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-alphabetique.md');
const MINT_INDEX = path.join(ROOT, 'home/Debian/Mint/index.html');
const MENU_DATA = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js');

const SLOT_STATUS = {
  nemo: { statut: 'ok', slot: 'nemo', note: 'Nemo — sidebar Places, titre dynamique, getExplorerCurrentPath' },
  firefox: { statut: 'ok', slot: 'firefox', note: 'Navigateur' },
  terminal: { statut: 'ok', slot: 'terminal', note: 'gnome-terminal' },
  themes: { statut: 'ok', slot: 'themes', note: 'cinnamon-settings 6.6 — 30 panneaux, recherche, thèmes VM, smoke OK' },
  profile: { statut: 'ok', slot: 'profile', note: 'À propos Mint' },
  update_manager: { statut: 'ok', slot: 'update_manager', note: 'mintupdate 7.1.4 — écran accueil, à jour, liste simulée, smoke OK' },
  mintinstall: { statut: 'ok', slot: 'mintinstall', note: 'Logithèque 8.4 — recherche, catégories, vedette, smoke OK' },
  system_monitor: { statut: 'ok', slot: 'system_monitor', note: 'GNOME System Monitor 46 — onglets, processus, smoke OK' },
  text_editor: { statut: 'ok', slot: 'text_editor', note: 'xed — menus, barre d\'outils, statut' },
  libreoffice_startcenter: { statut: 'ok', slot: 'libreoffice_startcenter', note: 'LibreOffice — suite bureau (Writer via startcenter)' },
  visionneur_images: { statut: 'ok', slot: 'visionneur_images', note: 'xviewer 3.0 — menubar, toolbar zoom/rotation, Nemo, smoke OK' },
  visionneur_pdf: { statut: 'ok', slot: 'visionneur_pdf', note: 'xreader 4.0 — menubar, pagination, sidebar, PDF, smoke OK' },
  lecteur_multimedia: { statut: 'ok', slot: 'lecteur_multimedia', note: 'Celluloid 0.21 — menubar, zone noire, contrôles, smoke OK' },
  checklist: { statut: 'pedagogie', slot: 'checklist', note: 'CapsuleOnly' },
  mainMenu: { statut: 'ok', slot: 'mainMenu', note: 'Menu Cinnamon — Π=100, ctx apps, géométrie VM' },
  calendar: { statut: 'ok', slot: 'calendar', note: 'Popover horloge (org.gnome.Calendar)' },
  calculator: { statut: 'ok', slot: 'calculator', note: 'GNOME Calculator — mode De base' },
  screenshot: { statut: 'ok', slot: 'screenshot', note: 'GNOME Screenshot — capture bureau simulée' },
  drawing: { statut: 'ok', slot: 'drawing', note: 'Drawing (mao) — canvas + outils' },
  file_roller: { statut: 'ok', slot: 'file_roller', note: 'File Roller 43 — headerbar, vide, smoke OK' },
  mintdrivers: { statut: 'ok', slot: 'mintdrivers', note: 'Driver Manager — recherche puis aucun pilote, smoke OK' },
  baobab: { statut: 'ok', slot: 'baobab', note: 'Baobab — sidebar places, anneau, smoke OK' },
  webapp_manager: { statut: 'ok', slot: 'webapp_manager', note: 'Web App Manager — Matrix demo, smoke OK' },
  sticky: { statut: 'ok', slot: 'sticky', note: 'Notes — liste + éditeur, smoke OK' },
  warpinator: { statut: 'ok', slot: 'warpinator', note: 'Warpinator — peers, smoke OK' },
  hypnotix: { statut: 'ok', slot: 'hypnotix', note: 'Hypnotix — chaînes IPTV, smoke OK' },
  transmission: { statut: 'ok', slot: 'transmission', note: 'Transmission — liste torrents, smoke OK' },
  mintbackup: { statut: 'ok', slot: 'mintbackup', note: 'Backup Tool — assistant source/dest, smoke OK' },
  bulky: { statut: 'ok', slot: 'bulky', note: 'Bulky — aperçu renommage, smoke OK' },
  timeshift: { statut: 'ok', slot: 'timeshift', note: 'Timeshift — instantanés, smoke OK' },
  thunderbird: { statut: 'ok', slot: 'thunderbird', note: 'Thunderbird — boîte + messages, smoke OK' },
  mintwelcome: { statut: 'ok', slot: 'mintwelcome', note: 'Welcome Screen — cartes Mint 22.3, smoke OK' },
  librecalc: { statut: 'ok', slot: 'librecalc', note: 'Calc — grille, barre de formule, menus, smoke OK' },
  gucharmap: { statut: 'ok', slot: 'gucharmap', note: 'Table des caractères — grille Unicode, smoke OK' },
  simple_scan: { statut: 'ok', slot: 'simple_scan', note: 'Simple Scan — aperçu numérisation simulée, smoke OK' },
  thingy: { statut: 'ok', slot: 'thingy', note: 'Bibliothèque Thingy — grille fichiers, smoke OK' },
  rhythmbox: { statut: 'ok', slot: 'rhythmbox', note: 'Rhythmbox — bibliothèque musicale, smoke OK' },
  gnome_disks: { statut: 'ok', slot: 'gnome_disks', note: 'Disques — liste volumes, smoke OK' },
  libreoffice_startcenter: { statut: 'ok', slot: 'libreoffice_startcenter', note: 'LibreOffice hub — tuiles modules, smoke OK' },
  libreoffice_draw: { statut: 'ok', slot: 'libreoffice_draw', note: 'Draw — canvas vide, smoke OK' },
  libreoffice_impress: { statut: 'ok', slot: 'libreoffice_impress', note: 'Impress — diapositive vide, smoke OK' },
  mintstick: { statut: 'ok', slot: 'mintstick', note: 'USB Image Writer — ISO + périphérique, smoke OK' },
  mintstick_format: { statut: 'ok', slot: 'mintstick_format', note: 'USB Stick Formatter — format simulé, smoke OK' },
  font_viewer: { statut: 'ok', slot: 'font_viewer', note: 'Visionneur polices — liste + aperçu, smoke OK' },
  power_stats: { statut: 'ok', slot: 'power_stats', note: 'Power Statistics — graphique + stats, smoke OK' },
  mate_color_select: { statut: 'ok', slot: 'mate_color_select', note: 'Sélecteur couleur MATE — palette, smoke OK' },
};

/** Correspondance .desktop VM → slot / nom menu FR / priorité reproduction */
const DESKTOP_MAP = {
  'nemo.desktop': { labelFr: 'Fichiers', slot: 'nemo', priorite: 'P0', menu: true, panel: true, favori: false },
  'firefox.desktop': { labelFr: 'Firefox', slot: 'firefox', priorite: 'P0', menu: true, panel: true },
  'org.gnome.Terminal.desktop': { labelFr: 'Terminal', slot: 'terminal', priorite: 'P0', menu: true, panel: true },
  'org.gnome.Calculator.desktop': { labelFr: 'Calculatrice', slot: 'calculator', priorite: 'P0', menu: true, favori: true, note: 'VM GNOME Calc — actuellement raccourci terminal' },
  'org.gnome.Calendar.desktop': { labelFr: 'Agenda', slot: 'calendar', priorite: 'P0', favori: true, note: 'Popover horloge' },
  'org.x.editor.desktop': { labelFr: 'Éditeur de texte', slot: 'text_editor', priorite: 'P0', menu: true, favori: true },
  'mintinstall.desktop': { labelFr: 'Logithèque', slot: 'mintinstall', priorite: 'P0', menu: true, favori: true },
  'mintinstall-kde.desktop': { labelFr: 'Logithèque', slot: 'mintinstall', priorite: 'P0' },
  'cinnamon-settings.desktop': { labelFr: 'Paramètres du système', slot: 'themes', priorite: 'P0', menu: true, favori: true },
  'cinnamon-settings-themes.desktop': { labelFr: 'Thèmes', slot: 'themes', priorite: 'P0', menu: true, panel: true },
  'libreoffice-writer.desktop': { labelFr: 'LibreOffice Writer', slot: 'libreoffice_startcenter', priorite: 'P0', menu: true },
  'libreoffice-calc.desktop': { labelFr: 'LibreOffice Calc', slot: 'librecalc', priorite: 'P1', menu: true },
  'io.github.celluloid_player.Celluloid.desktop': { labelFr: 'Lecteur vidéo', slot: 'lecteur_multimedia', priorite: 'P0', menu: true },
  'xviewer.desktop': { labelFr: 'Visionneur d\'images', slot: 'visionneur_images', priorite: 'P1', menu: true },
  'pix.desktop': { labelFr: 'Pix', slot: 'visionneur_images', priorite: 'P2' },
  'xreader.desktop': { labelFr: 'Visionneur de documents', slot: 'visionneur_pdf', priorite: 'P1', menu: true },
  'mintupdate.desktop': { labelFr: 'Gestionnaire de mises à jour', slot: 'update_manager', priorite: 'P0', tray: true },
  'mintupdate-kde.desktop': { labelFr: 'Gestionnaire de mises à jour', slot: 'update_manager', priorite: 'P0' },
  'org.gnome.FileRoller.desktop': { labelFr: 'Gestionnaire d\'archives', slot: 'file_roller', priorite: 'P1', menu: true },
  'org.gnome.baobab.desktop': { labelFr: 'Analyseur d\'espace disque', slot: 'baobab', priorite: 'P2' },
  'hypnotix.desktop': { labelFr: 'Hypnotix', slot: 'hypnotix', priorite: 'P2' },
  'transmission-gtk.desktop': { labelFr: 'Transmission', slot: 'transmission', priorite: 'P2' },
  'thunderbird.desktop': { labelFr: 'Thunderbird', slot: 'thunderbird', priorite: 'P2' },
  'org.gnome.Screenshot.desktop': { labelFr: 'Capture d\'écran', slot: 'screenshot', priorite: 'P0', menu: true },
  'org.gnome.SystemMonitor.desktop': { labelFr: 'Moniteur système', slot: 'system_monitor', priorite: 'P1' },
  'mintdrivers.desktop': { labelFr: 'Gestionnaire de pilotes', slot: 'mintdrivers', priorite: 'P1' },
  'mintbackup.desktop': { labelFr: 'Outil de sauvegarde', slot: 'mintbackup', priorite: 'P2' },
  'timeshift-gtk.desktop': { labelFr: 'Timeshift', slot: 'timeshift', priorite: 'P2' },
  'mintwelcome.desktop': { labelFr: 'Écran d\'accueil Mint', slot: 'mintwelcome', priorite: 'P2' },
  'webapp-manager.desktop': { labelFr: 'Applications Web', slot: 'webapp_manager', priorite: 'P2' },
  'org.x.Warpinator.desktop': { labelFr: 'Warpinator', slot: 'warpinator', priorite: 'P2' },
  'sticky.desktop': { labelFr: 'Notes', slot: 'sticky', priorite: 'P2' },
  'bulky.desktop': { labelFr: 'Renommer fichiers', slot: 'bulky', priorite: 'P2' },
  'com.github.maoschanz.drawing.desktop': { labelFr: 'Dessin', slot: 'drawing', priorite: 'P0', menu: true },
  'gimp.desktop': { labelFr: 'GIMP', slot: 'gimp', priorite: 'P1', menu: true },
  'inkscape.desktop': { labelFr: 'Inkscape', slot: 'inkscape', priorite: 'P1', menu: true },
  'gucharmap.desktop': { labelFr: 'Table des caractères', slot: 'gucharmap', priorite: 'P2', menu: true },
  'simple-scan.desktop': { labelFr: 'Numérisation de documents', slot: 'simple_scan', priorite: 'P2', menu: true },
  'thingy.desktop': { labelFr: 'Bibliothèque', slot: 'thingy', priorite: 'P2', menu: true },
  'org.gnome.Rhythmbox3.desktop': { labelFr: 'Rhythmbox', slot: 'rhythmbox', priorite: 'P2', menu: true },
  'org.gnome.DiskUtility.desktop': { labelFr: 'Disques', slot: 'gnome_disks', priorite: 'P2', menu: true },
  'libreoffice-startcenter.desktop': { labelFr: 'LibreOffice', slot: 'libreoffice_startcenter', priorite: 'P2', menu: true },
  'libreoffice-draw.desktop': { labelFr: 'LibreOffice Draw', slot: 'libreoffice_draw', priorite: 'P2', menu: true },
  'libreoffice-impress.desktop': { labelFr: 'LibreOffice Impress', slot: 'libreoffice_impress', priorite: 'P2', menu: true },
  'cinnamon-color-panel.desktop': { labelFr: 'Couleur', slot: 'themes', priorite: 'P2', note: 'csPanel color' },
  'cinnamon-display-panel.desktop': { labelFr: 'Affichage', slot: 'themes', priorite: 'P2', note: 'csPanel display' },
  'cinnamon-network-panel.desktop': { labelFr: 'Réseau', slot: 'themes', priorite: 'P2', note: 'csPanel network' },
  'cinnamon-wacom-panel.desktop': { labelFr: 'Tablette graphique', slot: 'themes', priorite: 'P2', note: 'csPanel wacom' },
  'fingwit.desktop': { labelFr: 'Empreintes digitales', slot: 'themes', priorite: 'P2', note: 'csPanel fingerprints' },
  'gufw.desktop': { labelFr: 'Pare-feu', slot: 'themes', priorite: 'P2', note: 'csPanel firewall' },
  'blueman-manager.desktop': { labelFr: 'Gestionnaire Bluetooth', slot: 'themes', priorite: 'P2', note: 'csPanel bluetooth' },
  'mintlocale.desktop': { labelFr: 'Langues', slot: 'themes', priorite: 'P2', note: 'csPanel languages' },
  'mintlocale-im.desktop': { labelFr: 'Méthode de saisie', slot: 'themes', priorite: 'P2', note: 'csPanel input-method' },
  'lightdm-settings.desktop': { labelFr: 'Fenêtre de connexion', slot: 'themes', priorite: 'P2', note: 'csPanel login-window' },
  'mintsources.desktop': { labelFr: 'Sources de logiciels', slot: 'themes', priorite: 'P2', note: 'csPanel software-sources' },
  'mintreport.desktop': { labelFr: 'Informations système', slot: 'themes', priorite: 'P2', note: 'csPanel system-info' },
  'mintsysadm.desktop': { labelFr: 'Administration du système', slot: 'themes', priorite: 'P2', note: 'csPanel system-info' },
  'org.gnome.seahorse.Application.desktop': { labelFr: 'Mots de passe et clés', slot: 'themes', priorite: 'P2', note: 'csPanel passwords' },
  'onboard.desktop': { labelFr: 'Onboard', slot: 'themes', priorite: 'P2', note: 'csPanel accessibility' },
  'system-config-printer.desktop': { labelFr: 'Imprimantes', slot: 'themes', priorite: 'P2', note: 'csPanel printers' },
  'gnome-system-monitor-kde.desktop': { labelFr: 'Moniteur système', slot: 'system_monitor', priorite: 'P2', note: 'Alias KDE desktop' },
  'vim.desktop': { labelFr: 'Vim', slot: 'text_editor', priorite: 'P2', menu: true, note: 'Alias éditeur terminal' },
  'mintstick.desktop': { labelFr: 'Créateur de clé USB', slot: 'mintstick', priorite: 'P2', menu: true },
  'mintstick-kde.desktop': { labelFr: 'Créateur de clé USB', slot: 'mintstick', priorite: 'P2' },
  'mintstick-format.desktop': { labelFr: 'Formateur de clé USB', slot: 'mintstick_format', priorite: 'P2', menu: true },
  'mintstick-format-kde.desktop': { labelFr: 'Formateur de clé USB', slot: 'mintstick_format', priorite: 'P2' },
  'nm-connection-editor.desktop': { labelFr: 'Configuration réseau avancée', slot: 'themes', priorite: 'P2', note: 'csPanel network' },
  'blueman-adapters.desktop': { labelFr: 'Adaptateurs Bluetooth', slot: 'themes', priorite: 'P2', note: 'csPanel bluetooth' },
  'mate-color-select.desktop': { labelFr: 'Sélecteur de couleur', slot: 'mate_color_select', priorite: 'P2' },
  'org.gnome.font-viewer.desktop': { labelFr: 'Polices', slot: 'font_viewer', priorite: 'P2', menu: true },
  'org.freedesktop.IBus.Setup.desktop': { labelFr: 'Préférences IBus', slot: 'themes', priorite: 'P2', note: 'csPanel input-method' },
  'gnome-online-accounts-gtk.desktop': { labelFr: 'Comptes en ligne', slot: 'themes', priorite: 'P2', note: 'csPanel online-accounts' },
  'org.gnome.PowerStats.desktop': { labelFr: 'Statistiques d\'alimentation', slot: 'power_stats', priorite: 'P2' },
  'cinnamon-onscreen-keyboard.desktop': { labelFr: 'Clavier visuel', slot: 'themes', priorite: 'P2', note: 'csPanel accessibility' },
};

const CINNAMON_SETTINGS_PREFIX = 'cinnamon-settings-';

const readMenuApps = () => {
  const raw = fs.readFileSync(MENU_DATA, 'utf8');
  const apps = [];
  const blockRe = /\{\s*catId:\s*'[^']+'[\s\S]*?\n\s*\}/g;
  let block;
  while ((block = blockRe.exec(raw)) !== null) {
    const nameM = block[0].match(/name:\s*'((?:\\'|[^'])*)'/);
    const linkM = block[0].match(/dataLink:\s*(null|'([^']*)')/);
    if (!nameM) continue;
    apps.push({
      nameFr: nameM[1].replace(/\\'/g, '\''),
      dataLink: linkM && linkM[1] === 'null' ? null : (linkM && linkM[2] ? linkM[2] : null),
    });
  }
  return apps;
};

const readCapsuleSlots = () => {
  if (!fs.existsSync(MINT_INDEX)) return [];
  const html = fs.readFileSync(MINT_INDEX, 'utf8');
  const re = /data-link="([^"]+)"/g;
  const slots = new Set();
  let m;
  while ((m = re.exec(html)) !== null) slots.add(m[1]);
  return [...slots];
};

const statutFromSlot = (slot) => {
  if (!slot) return { code: 'absent', glyph: '⬜' };
  const s = SLOT_STATUS[slot];
  if (!s) return { code: 'absent', glyph: '⬜' };
  if (s.statut === 'ok') return { code: 'ok', glyph: '✅' };
  if (s.statut === 'partiel') return { code: 'partiel', glyph: '🔶' };
  if (s.statut === 'pedagogie') return { code: 'pedagogie', glyph: '🎓' };
  return { code: 'absent', glyph: '⬜' };
};

const sortFr = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' });

const buildCatalog = (vmApps) => {
  const menuApps = readMenuApps();
  const capsuleSlots = readCapsuleSlots();
  const seenDesktop = new Set();
  const rows = [];

  vmApps.forEach((entry) => {
    if (seenDesktop.has(entry.desktop)) return;
    seenDesktop.add(entry.desktop);
    const map = DESKTOP_MAP[entry.desktop] || {};
    const isSettingsPanel = entry.desktop.startsWith(CINNAMON_SETTINGS_PREFIX)
      || entry.desktop === 'cinnamon-settings.desktop';
    const labelFr = map.labelFr || entry.name;
    const slot = map.slot || (isSettingsPanel ? 'themes' : null);
    const st = statutFromSlot(slot);
    rows.push({
      ordreAlpha: labelFr,
      nomVm: entry.name,
      labelFr,
      desktop: entry.desktop,
      priorite: map.priorite || (isSettingsPanel ? 'P2' : 'P3'),
      slotCapsule: slot,
      statut: st.code,
      glyph: st.glyph,
      menuMint: !!map.menu || menuApps.some((a) => a.nameFr === labelFr),
      favoriBureau: !!map.favori,
      panel: !!map.panel,
      tray: !!map.tray,
      note: map.note || (isSettingsPanel ? 'Sous-panneau Paramètres système' : ''),
      fichiers: (() => {
        if (!slot) return '—';
        const htmlPath = path.join(ROOT, `usr/share/capsuleos/linux/apps/${slot}.html`);
        const skinPath = path.join(ROOT, `home/Debian/Mint/style/apps/${slot}.skin.css`);
        const parts = [];
        if (fs.existsSync(htmlPath)) parts.push(`apps/${slot}.html`);
        else if (slot === 'calendar') parts.push('calendar-popover.js (shell)');
        else parts.push(`à créer apps/${slot}.html`);
        if (fs.existsSync(skinPath)) parts.push(`Mint/style/apps/${slot}.skin.css`);
        return parts.join(' · ');
      })(),
    });
  });

  menuApps.forEach((app) => {
    if (rows.some((r) => r.labelFr === app.nameFr)) return;
    const st = statutFromSlot(app.dataLink);
    rows.push({
      ordreAlpha: app.nameFr,
      nomVm: '—',
      labelFr: app.nameFr,
      desktop: '—',
      priorite: 'P0',
      slotCapsule: app.dataLink,
      statut: st.code,
      glyph: st.glyph,
      menuMint: true,
      favoriBureau: false,
      panel: false,
      tray: false,
      note: 'Entrée menu seule (MENU_APPS)',
      fichiers: app.dataLink ? SLOT_STATUS[app.dataLink]?.note || `slot ${app.dataLink}` : 'dataLink null',
    });
  });

  rows.sort((a, b) => sortFr(a.ordreAlpha, b.ordreAlpha));

  const fileReproduction = [];
  const seenRepro = new Set();
  rows.filter((r) => r.priorite === 'P0' || r.priorite === 'P1').forEach((r) => {
    if (seenRepro.has(r.labelFr)) return;
    seenRepro.add(r.labelFr);
    fileReproduction.push(r);
  });
  fileReproduction.forEach((r, i) => {
    r.rangReproduction = i + 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    vmAppCount: vmApps.length,
    capsuleSlots,
    menuAppCount: menuApps.length,
    rows,
    fileReproduction,
  };
};

const renderMd = (catalog) => {
  const lines = [];
  lines.push('# Catalogue applications — Linux Mint (ordre alphabétique)');
  lines.push('');
  lines.push('Ground truth : VM Mint 22.3 Zena (`collect-mint-inventory.mjs`) · Registre `linux-mint`');
  lines.push('');
  lines.push(`Généré : \`${catalog.generatedAt}\` · ${catalog.vmAppCount} entrées menu VM visibles · ${catalog.menuAppCount} entrées MENU_APPS`);
  lines.push('');
  lines.push('**Procédure de reproduction** : traiter **une application par passe**, dans l’ordre du tableau « File de reproduction » ci-dessous (tri alphabétique FR), puis mettre à jour la colonne Statut.');
  lines.push('');
  lines.push('```bash');
  lines.push('node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc');
  lines.push('node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs --write');
  lines.push('node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs');
  lines.push('node usr/lib/capsuleos/tools/validate-all.mjs');
  lines.push('```');
  lines.push('');
  lines.push('## Légende');
  lines.push('');
  lines.push('| Symbole | Statut |');
  lines.push('|---------|--------|');
  lines.push('| ✅ | Fidèle VM (comportement + UI utilisables)');
  lines.push('| 🔶 | Partiel (slot existant, UI ou parcours incomplet)');
  lines.push('| ⬜ | Absent (menu grisé ou sans slot)');
  lines.push('| 🎓 | CapsuleOnly (hors VM)');
  lines.push('');
  lines.push('## File de reproduction (P0 + P1, ordre alphabétique)');
  lines.push('');
  lines.push('| # | Application (FR) | VM (.desktop) | Slot CapsuleOS | Statut | Priorité |');
  lines.push('|---|------------------|---------------|----------------|--------|----------|');
  catalog.fileReproduction.forEach((r) => {
    lines.push(`| ${r.rangReproduction} | ${r.labelFr} | ${r.desktop} | ${r.slotCapsule || '—'} | ${r.glyph} | ${r.priorite} |`);
  });
  lines.push('');
  lines.push('## Composants shell (hors applications)');
  lines.push('');
  lines.push('| Composant | Statut |');
  lines.push('|-----------|--------|');
  lines.push('| Menu Cinnamon | 🔶 |');
  lines.push('| Panel + liste fenêtres | 🔶 |');
  lines.push('| Zone notification (tray) | ✅ |');
  lines.push('| Horloge / calendrier | ✅ |');
  lines.push('| Bureau + favoris | 🔶 |');
  lines.push('| Thème Mint-Y-Dark-Aqua | ✅ |');
  lines.push('');
  lines.push('## Catalogue complet VM (ordre alphabétique FR)');
  lines.push('');
  lines.push('| Application (FR) | Nom VM | .desktop | Slot | Statut | Menu | Favori | Panel | Note |');
  lines.push('|------------------|--------|----------|------|--------|------|--------|-------|------|');
  catalog.rows.forEach((r) => {
    const flags = [
      r.menuMint ? 'M' : '',
      r.favoriBureau ? 'F' : '',
      r.panel ? 'P' : '',
      r.tray ? 'T' : '',
    ].filter(Boolean).join(',') || '—';
    lines.push(`| ${r.labelFr} | ${r.nomVm} | ${r.desktop} | ${r.slotCapsule || '—'} | ${r.glyph} | ${flags} | ${r.note || ''} |`);
  });
  lines.push('');
  lines.push('## Slots CapsuleOS actuels (`index.html`)');
  lines.push('');
  catalog.capsuleSlots.sort(sortFr).forEach((s) => {
    const st = statutFromSlot(s);
    lines.push(`- \`${s}\` — ${st.glyph}`);
  });
  lines.push('');
  lines.push('## Références');
  lines.push('');
  lines.push('- [`linux-mint-vm.json`](linux-mint-vm.json)');
  lines.push('- [`linux-mint-apps-catalog.json`](linux-mint-apps-catalog.json)');
  lines.push('- [`inventaire-parite-mint-vm.md`](../inventaire-parite-mint-vm.md)');
  lines.push('- [`apps-linux-par-distro.md`](../apps-linux-par-distro.md)');
  return lines.join('\n') + '\n';
};

const write = process.argv.includes('--write');
const vm = JSON.parse(fs.readFileSync(VM_JSON, 'utf8'));
let vmApps = vm.apps && vm.apps.menuVisible;
if (!vmApps) {
  console.error('Relancer collect-mint-inventory.mjs (menuVisible manquant)');
  process.exit(1);
}
const catalog = buildCatalog(vmApps);
const md = renderMd(catalog);

if (write) {
  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md);
  console.log('OK', OUT_MD);
  console.log('OK', OUT_JSON);
} else {
  console.log(md);
}
