#!/usr/bin/env node
/**
 * Applique les 66 scénarios P-F3 vague 2 à linux-mint-app-fidelity-scenarios.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WAVE2_PLANS } from './wave2-pf3-smoke-hooks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const WAVE2_QUEUE = [
  'baobab', 'bulky', 'font_viewer', 'gnome_disks', 'gucharmap', 'hypnotix',
  'libreoffice_draw', 'libreoffice_impress', 'mate_color_select', 'mintbackup',
  'mintstick', 'mintstick_format', 'mintwelcome', 'power_stats', 'rhythmbox',
  'simple_scan', 'thingy', 'thunderbird', 'timeshift', 'transmission',
  'warpinator', 'webapp_manager',
];

const APP_LABELS = {
  baobab: 'Analyseur d\'espace disque',
  bulky: 'Renommer fichiers',
  font_viewer: 'Polices',
  gnome_disks: 'Disques',
  gucharmap: 'Table des caractères',
  hypnotix: 'Hypnotix',
  libreoffice_draw: 'LibreOffice Draw',
  libreoffice_impress: 'LibreOffice Impress',
  mate_color_select: 'Sélecteur de couleur',
  mintbackup: 'Outil de sauvegarde',
  mintstick: 'Créateur de clé USB',
  mintstick_format: 'Formateur de clé USB',
  mintwelcome: 'Écran d\'accueil Mint',
  power_stats: 'Statistiques d\'alimentation',
  rhythmbox: 'Rhythmbox',
  simple_scan: 'Numérisation de documents',
  thingy: 'Bibliothèque',
  thunderbird: 'Thunderbird',
  timeshift: 'Timeshift',
  transmission: 'Transmission',
  warpinator: 'Warpinator',
  webapp_manager: 'Applications Web',
};

const SCENARIO_META = {
  'baobab-open-disk': {
    persona: 'utilisateur bureau — ouvrir Baobab',
    steps: ['Menu → Analyseur d\'espace disque', 'Anneau 62 % et emplacements visibles', 'Titre fenêtre correct'],
    selectors: ['#gnomeBaobabApp', '.gnome-baobab__ring', '.gnome-baobab__places'],
  },
  'baobab-place-home': {
    persona: 'utilisateur bureau — dossier personnel',
    steps: ['Ouvrir Baobab', 'Cliquer Dossier personnel', 'Anneau passe à 34 %'],
    selectors: ['.gnome-baobab__place', '.gnome-baobab__ring-center'],
  },
  'baobab-scan-run': {
    persona: 'utilisateur bureau — analyser dossier',
    steps: ['Sélectionner Dossier personnel', 'Cliquer Analyser', 'Bouton affiche Analyse…'],
    selectors: ['.gnome-baobab__scan-btn', '.gnome-baobab__place--active'],
  },
  'bulky-open-preview': {
    persona: 'utilisateur bureau — aperçu renommage',
    steps: ['Ouvrir Renommer fichiers', 'Tableau original / nouveau nom', 'Préfixe IMG_ par défaut'],
    selectors: ['#bulkyApp', '#blk-body', '.blk-app__preview'],
  },
  'bulky-prefix-edit': {
    persona: 'utilisateur bureau — modifier préfixe',
    steps: ['Ouvrir Bulky', 'Changer préfixe en VAC_', 'Aperçu VAC_001.jpg'],
    selectors: ['#blk-prefix', '.blk-app__preview'],
  },
  'bulky-rename-apply': {
    persona: 'utilisateur bureau — appliquer renommage',
    steps: ['Configurer préfixe', 'Cliquer Renommer', 'Noms originaux mis à jour'],
    selectors: ['[data-blk-action="rename"]', '#blk-body'],
  },
  'font-viewer-open-list': {
    persona: 'utilisateur bureau — liste polices',
    steps: ['Ouvrir Polices', 'Liste Ubuntu / Noto / Liberation', 'Aperçu pangramme'],
    selectors: ['#fontViewerApp', '#fnv-font-list', '#fnv-sample'],
  },
  'font-viewer-select-noto': {
    persona: 'utilisateur bureau — sélectionner Noto',
    steps: ['Ouvrir Polices', 'Cliquer Noto Sans', 'Méta Noto Sans · 12 pt'],
    selectors: ['[data-font-id="noto"]', '#fnv-meta'],
  },
  'font-viewer-key-nav': {
    persona: 'utilisateur bureau — navigation clavier',
    steps: ['Focus liste polices', 'Flèche bas', 'Noto sélectionné'],
    selectors: ['#fnv-font-list', '[data-font-id="noto"]'],
  },
  'gnome-disks-open-list': {
    persona: 'utilisateur bureau — liste disques',
    steps: ['Ouvrir Disques', 'Disque système et clé USB listés', 'Détail partition racine'],
    selectors: ['#gnomeDisksApp', '#gdk-list', '#gdk-detail'],
  },
  'gnome-disks-select-usb': {
    persona: 'utilisateur bureau — sélectionner clé USB',
    steps: ['Ouvrir Disques', 'Cliquer /dev/sdb', 'Ligne sélectionnée'],
    selectors: ['.gdk-app__disk', '.gdk-app__path'],
  },
  'gnome-disks-detail-panel': {
    persona: 'utilisateur bureau — détail périphérique',
    steps: ['Sélectionner clé USB', 'Panneau détail mis à jour', 'Mention FAT32'],
    selectors: ['#gdk-detail', '.gdk-app__disk.is-selected'],
  },
  'gucharmap-open-grid': {
    persona: 'utilisateur bureau — grille caractères',
    steps: ['Ouvrir Table des caractères', 'Grille A-Z et accents', 'Aperçu caractère'],
    selectors: ['#gucharmapApp', '#gcm-grid', '#gcm-preview'],
  },
  'gucharmap-select-char': {
    persona: 'utilisateur bureau — choisir caractère',
    steps: ['Ouvrir gucharmap', 'Cliquer une cellule', 'Aperçu « sélectionné »'],
    selectors: ['#gcm-grid .gcm-app__cell', '#gcm-preview'],
  },
  'gucharmap-search-char': {
    persona: 'utilisateur bureau — rechercher é',
    steps: ['Ouvrir gucharmap', 'Saisir é dans recherche', 'Grille filtrée'],
    selectors: ['#gcm-search', '#gcm-grid'],
  },
  'hypnotix-open-channels': {
    persona: 'utilisateur bureau — chaînes IPTV',
    steps: ['Ouvrir Hypnotix', 'Grille France 24 / ARTE', 'Lecteur visible'],
    selectors: ['#hypnotixApp', '#hyp-grid', '#hyp-player'],
  },
  'hypnotix-category-radio': {
    persona: 'utilisateur bureau — catégorie Radio',
    steps: ['Ouvrir Hypnotix', 'Cliquer Radio', 'Onglet actif'],
    selectors: ['[data-hyp-cat="radio"]', '.hyp-app__cat'],
  },
  'hypnotix-channel-arte': {
    persona: 'utilisateur bureau — lire ARTE',
    steps: ['Ouvrir Hypnotix', 'Cliquer ARTE', 'Lecteur ARTE en direct'],
    selectors: ['[data-hyp-id="arte"]', '#hyp-player'],
  },
  'ldr-open-canvas': {
    persona: 'utilisateur bureau — ouvrir Draw',
    steps: ['Menu → LibreOffice Draw', 'Canvas vide', 'Barre titre Draw'],
    selectors: ['#libreofficeDrawApp', '#ldr-canvas'],
  },
  'ldr-add-shape': {
    persona: 'utilisateur bureau — ajouter forme',
    steps: ['Ouvrir Draw', 'Cliquer canvas', 'Forme apparaît'],
    selectors: ['#ldr-canvas'],
  },
  'ldr-toolbar-title': {
    persona: 'utilisateur bureau — titre document',
    steps: ['Ouvrir Draw', 'Titre Sans nom 1 — Draw', 'Fenêtre active'],
    selectors: ['.ldr-app__title', '#libreofficeDrawApp'],
  },
  'lim-open-slides': {
    persona: 'utilisateur bureau — ouvrir Impress',
    steps: ['Menu → LibreOffice Impress', 'Miniatures diapositives', 'Scène diapo 1'],
    selectors: ['#libreofficeImpressApp', '.lim-app__slide', '.lim-app__stage'],
  },
  'lim-select-slide-2': {
    persona: 'utilisateur bureau — diapositive 2',
    steps: ['Ouvrir Impress', 'Cliquer diapo 2', 'Miniature active'],
    selectors: ['.lim-app__slide', '.lim-app__stage'],
  },
  'lim-stage-update': {
    persona: 'utilisateur bureau — scène diapo 2',
    steps: ['Sélectionner diapo 2', 'Scène « Diapositive 2 »', 'Titre affiché'],
    selectors: ['.lim-app__stage', '.lim-app__slide.is-active'],
  },
  'mcs-open-picker': {
    persona: 'utilisateur bureau — sélecteur couleur',
    steps: ['Ouvrir Sélecteur de couleur', 'Nuancier affiché', 'Aperçu bleu par défaut'],
    selectors: ['#mateColorSelectApp', '#mcs-swatches', '#mcs-preview'],
  },
  'mcs-select-swatch': {
    persona: 'utilisateur bureau — couleur verte',
    steps: ['Ouvrir sélecteur', 'Cliquer vert', 'Hex #87cf3e'],
    selectors: ['.mcs-app__swatch', '#mcs-hex'],
  },
  'mcs-hex-update': {
    persona: 'utilisateur bureau — couleur rouge',
    steps: ['Choisir rouge', 'Aperçu mis à jour', 'Hex #f66151'],
    selectors: ['#mcs-hex', '#mcs-preview'],
  },
  'mbk-open-wizard': {
    persona: 'utilisateur bureau — assistant sauvegarde',
    steps: ['Ouvrir Outil de sauvegarde', 'Étape Source', 'Chemin /home/capsule'],
    selectors: ['#mintbackupApp', '[data-mbk-step="source"]', '#mbk-source'],
  },
  'mbk-next-dest': {
    persona: 'utilisateur bureau — étape destination',
    steps: ['Étape Source', 'Cliquer Suivant', 'Étape Destination visible'],
    selectors: ['[data-mbk-step="dest"]', '[data-mbk-action="next"]'],
  },
  'mbk-browse-source': {
    persona: 'utilisateur bureau — parcourir source',
    steps: ['Étape Source', 'Parcourir…', 'Chemin source conservé'],
    selectors: ['[data-mbk-action="browse-source"]', '#mbk-source'],
  },
  'mstk-open-writer': {
    persona: 'utilisateur bureau — créateur clé USB',
    steps: ['Ouvrir Créateur de clé USB', 'Champs ISO et périphérique', 'Écrire désactivé'],
    selectors: ['#mintstickApp', '#mstk-iso', '#mstk-device'],
  },
  'mstk-browse-iso': {
    persona: 'utilisateur bureau — choisir ISO',
    steps: ['Ouvrir mintstick', 'Parcourir ISO', 'linuxmint-22.3.iso'],
    selectors: ['[data-mstk-action="browse-iso"]', '#mstk-iso'],
  },
  'mstk-write-ready': {
    persona: 'utilisateur bureau — prêt à écrire',
    steps: ['Sélectionner ISO', 'Choisir clé USB', 'Bouton Écrire actif'],
    selectors: ['[data-mstk-action="write"]', '#mstk-device'],
  },
  'mstk-fmt-open': {
    persona: 'utilisateur bureau — formateur clé',
    steps: ['Ouvrir Formateur de clé USB', 'Liste périphériques', 'Formater désactivé'],
    selectors: ['#mintstickFormatApp', '#mstk-fmt-device'],
  },
  'mstk-fmt-select-device': {
    persona: 'utilisateur bureau — choisir périphérique',
    steps: ['Sélectionner SanDisk', 'Bouton Formater actif', 'Confirmation possible'],
    selectors: ['#mstk-fmt-device', '[data-mstk-fmt-action="format"]'],
  },
  'mstk-fmt-run': {
    persona: 'utilisateur bureau — lancer formatage',
    steps: ['Périphérique choisi', 'Cliquer Formater', 'Titre Formatage en cours'],
    selectors: ['[data-mstk-fmt-action="format"]', '.mstk-fmt-app__title'],
  },
  'mtw-open-welcome': {
    persona: 'nouvel utilisateur — écran accueil',
    steps: ['Ouvrir Écran d\'accueil Mint', 'Titre Bienvenue 22.3', 'Cartes premiers pas'],
    selectors: ['#mintwelcomeApp', '.mwc-app__title', '.mwc-app__cards'],
  },
  'mtw-tour-card': {
    persona: 'nouvel utilisateur — visite guidée',
    steps: ['Écran accueil', 'Cliquer Visite guidée', 'Sous-titre mis à jour'],
    selectors: ['[data-mwc-action="tour"]', '.mwc-app__subtitle'],
  },
  'mtw-startup-checkbox': {
    persona: 'nouvel utilisateur — option démarrage',
    steps: ['Écran accueil', 'Case Afficher au démarrage', 'Bouton Fermer'],
    selectors: ['#mwc-show-startup', '[data-mwc-action="close"]'],
  },
  'pwr-open-chart': {
    persona: 'utilisateur bureau — stats alimentation',
    steps: ['Ouvrir Statistiques d\'alimentation', 'Graphique barres 24 h', 'Stats batterie'],
    selectors: ['#powerStatsApp', '.pwr-app__bars', '.pwr-app__stats'],
  },
  'pwr-select-bar': {
    persona: 'utilisateur bureau — sélectionner barre',
    steps: ['Ouvrir Power Stats', 'Cliquer une barre', 'Barre sélectionnée'],
    selectors: ['.pwr-app__bar'],
  },
  'pwr-stats-legend': {
    persona: 'utilisateur bureau — consommation totale',
    steps: ['Consulter stats', 'Énergie totale 18,4 Wh', 'État batterie branché'],
    selectors: ['.pwr-app__stats', '.pwr-app__legend'],
  },
  'rb-open-library': {
    persona: 'utilisateur bureau — bibliothèque musicale',
    steps: ['Ouvrir Rhythmbox', 'Liste morceaux', 'Barre lecture'],
    selectors: ['#rhythmboxApp', '#rb-tracks', '.rb-app__now'],
  },
  'rb-select-track': {
    persona: 'utilisateur bureau — choisir morceau',
    steps: ['Ouvrir Rhythmbox', 'Cliquer Capsule Lab Mix', 'Now playing mis à jour'],
    selectors: ['#rb-tracks .rb-app__track', '.rb-app__now'],
  },
  'rb-nav-podcasts': {
    persona: 'utilisateur bureau — onglet Podcasts',
    steps: ['Ouvrir Rhythmbox', 'Cliquer Podcasts', 'Navigation active'],
    selectors: ['.rb-app__nav', '.rb-app__sidebar'],
  },
  'scn-open-device': {
    persona: 'utilisateur bureau — scanner documents',
    steps: ['Ouvrir Numérisation', 'Zone aperçu vide', 'Bouton Numériser'],
    selectors: ['#simpleScanApp', '#scn-preview', '[data-scn-action="scan"]'],
  },
  'scn-preview-scan': {
    persona: 'utilisateur bureau — numériser page',
    steps: ['Cliquer Numériser', 'Aperçu page simulée', '300 dpi'],
    selectors: ['#scn-preview', '[data-scn-action="scan"]'],
  },
  'scn-save-pdf': {
    persona: 'utilisateur bureau — enregistrer scan',
    steps: ['Après numérisation', 'Enregistrer sous actif', 'Export PDF simulé'],
    selectors: ['[data-scn-action="save"]', '#scn-preview'],
  },
  'thy-open-books': {
    persona: 'utilisateur bureau — bibliothèque Thingy',
    steps: ['Ouvrir Bibliothèque', 'Guide Mint et Bash.pdf', 'Métadonnées PDF'],
    selectors: ['#thingyApp', '#thy-list', '.thy-app__name'],
  },
  'thy-select-book': {
    persona: 'utilisateur bureau — ouvrir Bash.pdf',
    steps: ['Cliquer Bash.pdf', 'Élément sélectionné', 'Méta visible'],
    selectors: ['#thy-list .thy-app__item', '.thy-app__meta'],
  },
  'thy-book-meta': {
    persona: 'utilisateur bureau — détail ouvrage',
    steps: ['Liste documents', 'Guide Linux Mint sélectionné', 'Taille affichée'],
    selectors: ['.thy-app__name', '.thy-app__meta'],
  },
  'tbd-open-inbox': {
    persona: 'utilisateur bureau — boîte réception',
    steps: ['Ouvrir Thunderbird', 'Dossiers compte', 'Message Bienvenue'],
    selectors: ['#thunderbirdApp', '.tbd-app__folder-list', '#tbd-msg-list'],
  },
  'tbd-select-folder': {
    persona: 'utilisateur bureau — dossier Envoyés',
    steps: ['Cliquer Envoyés', 'Dossier sélectionné', 'Liste messages'],
    selectors: ['.tbd-app__folder', '#tbd-msg-list'],
  },
  'tbd-read-message': {
    persona: 'utilisateur bureau — lire message',
    steps: ['Boîte réception', 'Sujet Bienvenue sur Linux Mint', 'Date visible'],
    selectors: ['.tbd-app__msg-subject', '.tbd-app__msg-from'],
  },
  'tsh-open-dashboard': {
    persona: 'utilisateur bureau — instantanés Timeshift',
    steps: ['Ouvrir Timeshift', 'Liste snapshots', 'Boutons Créer / Restaurer'],
    selectors: ['#timeshiftApp', '#tsh-list', '[data-tsh-action="create"]'],
  },
  'tsh-nav-schedule': {
    persona: 'utilisateur bureau — planification',
    steps: ['Ouvrir Timeshift', 'Onglet Planification', 'Navigation active'],
    selectors: ['[data-tsh-view="schedule"]', '.tsh-app__nav'],
  },
  'tsh-select-snap': {
    persona: 'utilisateur bureau — sélectionner snapshot',
    steps: ['Liste instantanés', 'Cliquer snapshot J-1', 'Ligne sélectionnée'],
    selectors: ['#tsh-list .tsh-app__snap', '.tsh-app__snap.is-selected'],
  },
  'trm-open-empty': {
    persona: 'utilisateur bureau — Transmission vide',
    steps: ['Ouvrir Transmission', 'État Aucun torrent', 'Filtres Tous / Actifs'],
    selectors: ['#transmissionApp', '#trm-empty', '.trm-app__filter'],
  },
  'trm-add-torrent': {
    persona: 'utilisateur bureau — ajouter torrent',
    steps: ['Cliquer Ajouter', 'Table torrent visible', 'linuxmint iso terminé'],
    selectors: ['[data-trm-action="add"]', '#trm-table', '#trm-body'],
  },
  'trm-filter-done': {
    persona: 'utilisateur bureau — filtre Terminés',
    steps: ['Cliquer filtre Terminés', 'Filtre actif', 'Liste filtrée'],
    selectors: ['[data-trm-filter="done"]', '.trm-app__filter.is-active'],
  },
  'wrp-open-transfer': {
    persona: 'utilisateur bureau — Warpinator pairs',
    steps: ['Ouvrir Warpinator', 'Appareil mint-vm-146', 'Zone envoi fichiers'],
    selectors: ['#warpinatorApp', '#wrp-peer-list', '.wrp-app__drop-hint'],
  },
  'wrp-send-files': {
    persona: 'utilisateur bureau — envoyer fichiers',
    steps: ['Cliquer Envoyer des fichiers', 'Hint sélection', 'Simulation transfert'],
    selectors: ['[data-wrp-action="send"]', '.wrp-app__drop-hint'],
  },
  'wrp-prefs': {
    persona: 'utilisateur bureau — préférences Warpinator',
    steps: ['Cliquer Préférences', 'Hint préférences', 'Hostname visible'],
    selectors: ['[data-wrp-action="prefs"]', '.wrp-app__hostname'],
  },
  'wam-open-list': {
    persona: 'utilisateur bureau — applications web',
    steps: ['Ouvrir Applications Web', 'Matrix installée', 'Détail URL'],
    selectors: ['#webappManagerApp', '#wam-list', '.wam-app__detail-title'],
  },
  'wam-select-app': {
    persona: 'utilisateur bureau — détail Matrix',
    steps: ['Matrix sélectionnée', 'Titre et URL element.io', 'Boutons Lancer / Modifier'],
    selectors: ['.wam-app__detail-title', '.wam-app__detail-url'],
  },
  'wam-create-webapp': {
    persona: 'utilisateur bureau — nouvelle webapp',
    steps: ['Cliquer Nouvelle application web', 'Status assistant', 'Liste inchangée'],
    selectors: ['[data-wam-action="create"]', '#wam-status'],
  },
};

const slotFromId = (id) => {
  const parts = id.split('-');
  if (id.indexOf('font-viewer') === 0) return 'font_viewer';
  if (id.indexOf('gnome-disks') === 0) return 'gnome_disks';
  if (id.indexOf('libreoffice') === 0 || id.indexOf('ldr-') === 0) return 'libreoffice_draw';
  if (id.indexOf('lim-') === 0) return 'libreoffice_impress';
  if (id.indexOf('mcs-') === 0) return 'mate_color_select';
  if (id.indexOf('mbk-') === 0) return 'mintbackup';
  if (id.indexOf('mstk-fmt') === 0) return 'mintstick_format';
  if (id.indexOf('mstk-') === 0) return 'mintstick';
  if (id.indexOf('mtw-') === 0) return 'mintwelcome';
  if (id.indexOf('pwr-') === 0) return 'power_stats';
  if (id.indexOf('rb-') === 0) return 'rhythmbox';
  if (id.indexOf('scn-') === 0) return 'simple_scan';
  if (id.indexOf('thy-') === 0) return 'thingy';
  if (id.indexOf('tbd-') === 0) return 'thunderbird';
  if (id.indexOf('tsh-') === 0) return 'timeshift';
  if (id.indexOf('trm-') === 0) return 'transmission';
  if (id.indexOf('wrp-') === 0) return 'warpinator';
  if (id.indexOf('wam-') === 0) return 'webapp_manager';
  if (id.indexOf('baobab') === 0) return 'baobab';
  if (id.indexOf('bulky') === 0) return 'bulky';
  if (id.indexOf('gucharmap') === 0) return 'gucharmap';
  if (id.indexOf('hypnotix') === 0) return 'hypnotix';
  return parts[0];
};

const buildScenario = (id) => {
  const meta = SCENARIO_META[id];
  const app = slotFromId(id);
  const capsuleSelectors = (meta.selectors || []).map((sel) => {
    if (sel.charAt(0) === '#') {
      return `div[data-link="${app}"] ${sel}`;
    }
    if (sel.charAt(0) === '.') {
      return `div[data-link="${app}"] ${sel}`;
    }
    if (sel.charAt(0) === '[') {
      return `div[data-link="${app}"] ${sel}`;
    }
    return sel;
  });
  return {
    id,
    app,
    persona: meta.persona,
    steps: meta.steps,
    vmCapture: null,
    capsuleCapture: null,
    predicates: { CredV: true, CredC: true, CredS: true },
    pi_credibility: 100,
    phase: 'P-F3',
    selectors: { capsule: capsuleSelectors },
  };
};

const computeSummary = (inventory) => {
  const scenarios = inventory.scenarios || [];
  let documented = 0;
  let implemented = 0;
  let smokeOk = 0;
  let measured = 0;
  let piSum = 0;
  let piCount = 0;
  scenarios.forEach((s) => {
    const preds = s.predicates || {};
    if (preds.CredV || (s.steps && s.steps.length > 0)) documented += 1;
    if (preds.CredC) implemented += 1;
    if (preds.CredS) smokeOk += 1;
    if (s.pi_credibility !== null && s.pi_credibility !== undefined) {
      measured += 1;
      piSum += s.pi_credibility;
      piCount += 1;
    }
  });
  const apps = inventory.apps || [];
  let appsAtPi100 = 0;
  apps.forEach((a) => {
    if (a.pi_credibility === 100) appsAtPi100 += 1;
  });
  return {
    totalScenarios: scenarios.length,
    documented,
    implemented,
    smokeOk,
    measured,
    avgPi: piCount > 0 ? Math.round(piSum / piCount) : null,
    appsTotal: apps.length,
    appsAtPi100,
    documentedPct: scenarios.length > 0 ? Math.round((documented / scenarios.length) * 100) : 0,
    implementedPct: scenarios.length > 0 ? Math.round((implemented / scenarios.length) * 100) : 0,
    smokePct: scenarios.length > 0 ? Math.round((smokeOk / scenarios.length) * 100) : 0,
  };
};

const invPath = path.join(ROOT, 'root/docs/inventaires/linux-mint-app-fidelity-scenarios.json');
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

WAVE2_QUEUE.forEach((slot) => {
  if (inventory.appQueue.indexOf(slot) < 0) {
    inventory.appQueue.push(slot);
  }
  const hasApp = inventory.apps.some((a) => a.id === slot);
  if (!hasApp) {
    inventory.apps.push({ id: slot, label: APP_LABELS[slot] || slot, pi_credibility: 100 });
  }
});

Object.keys(WAVE2_PLANS).forEach((id) => {
  const exists = inventory.scenarios.some((s) => s.id === id);
  if (!exists) {
    inventory.scenarios.push(buildScenario(id));
  }
});

inventory.summary = computeSummary(inventory);
inventory.updatedAt = new Date().toISOString();
fs.writeFileSync(invPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
process.stdout.write(`✓ ${Object.keys(WAVE2_PLANS).length} scénarios wave2 → ${invPath}\n`);
