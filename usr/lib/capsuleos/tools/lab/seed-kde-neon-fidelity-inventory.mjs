#!/usr/bin/env node
/**
 * P-A KDE Cred* — seed inventaire scénarios depuis interactions v4 + kickoff VM.
 *
 *   node usr/lib/capsuleos/tools/lab/seed-kde-neon-fidelity-inventory.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeSummary } from './app-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY_ID = 'linux-kde-neon';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write'), json: args.includes('--json') };
};

const scenario = (id, app, persona, steps, smokePlan, extra = {}) => ({
  id,
  app,
  persona,
  steps,
  smokePlan,
  vmCapture: null,
  capsuleCapture: null,
  predicates: { CredV: true, CredC: true, CredS: false },
  pi_credibility: null,
  phase: 'P-D',
  ...extra,
});

const buildScenarios = () => {
  const list = [];

  list.push(
    scenario(
      'panel-launcher-kickoff',
      'panel',
      'utilisateur bureau — ouvrir le menu applications',
      [
        'Cliquer le lanceur Plasma (icône menu) dans le panel',
        'Vérifier popup Kickoff visible (#mainMenu)',
        'Fermer ou laisser ouvert pour navigation',
      ],
      {
        actions: [
          { type: 'click', selector: '.taskbar-pins__launcher[data-link="mainMenu"], footer nav a[data-link="mainMenu"]' },
          { type: 'wait', ms: 400 },
        ],
        assertions: [{ type: 'selectorVisible', selector: '#mainMenu' }],
      },
    ),
    scenario(
      'panel-pin-dolphin',
      'panel',
      'utilisateur bureau — Dolphin depuis pin panel',
      [
        'Cliquer le pin Dolphin dans le panel',
        'Fenêtre Dolphin visible avec barre latérale places',
      ],
      {
        actions: [
          { type: 'openSlot', slot: 'nemo' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'nemo' },
          { type: 'selectorMin', selector: 'div[data-link="nemo"] a[data-item-name]', min: 3 },
        ],
      },
    ),
    scenario(
      'panel-pin-discover',
      'panel',
      'utilisateur bureau — Discover depuis pin panel',
      [
        'Cliquer le pin Discover dans le panel',
        'Fenêtre Discover avec cartes accueil Kirigami',
      ],
      {
        actions: [
          { type: 'openSlot', slot: 'update_manager' },
          { type: 'wait', ms: 600 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'update_manager' },
          { type: 'selectorMin', selector: '[data-discover-home-mount] .kde-discover-card', min: 1 },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'kickoff-search-filter',
      'kickoff',
      'utilisateur bureau — recherche application Kickoff',
      [
        'Ouvrir Kickoff',
        'Saisir « dolphin » dans la recherche',
        'Liste filtrée affiche Dolphin',
      ],
      {
        prep: [{ type: 'openKickoff' }],
        actions: [
          { type: 'fill', selector: '#menu-search', value: 'dolphin' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelectorAll("#mainMenu .menu-app-item:not([hidden])").length >= 1' },
        ],
      },
    ),
    scenario(
      'kickoff-category-dev',
      'kickoff',
      'utilisateur bureau — catégorie Développement',
      [
        'Ouvrir Kickoff',
        'Cliquer catégorie Développement',
        'Grille apps mise à jour (Kate, etc.)',
      ],
      {
        prep: [{ type: 'openKickoff' }],
        actions: [
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="dev"]' },
          { type: 'wait', ms: 250 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"text_editor\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'kickoff-launch-firefox',
      'kickoff',
      'utilisateur web — lancer Firefox depuis favoris',
      [
        'Ouvrir Kickoff',
        'Cliquer Firefox dans favoris ou grille',
        'Fenêtre Firefox Proton visible',
      ],
      {
        prep: [{ type: 'openKickoff' }],
        actions: [
          { type: 'click', selector: '#mainMenu .menu-app-item[data-menu-app-link="firefox"]' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'firefox' },
          { type: 'selectorVisible', selector: '#firefox [data-firefox-app]' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'tray-notifications',
      'tray',
      'utilisateur bureau — popover notifications',
      ['Cliquer icône notifications tray', 'Popover notifications Plasma visible'],
      {
        actions: [
          { type: 'click', selector: '#tray-btn-notifications' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [{ type: 'selectorVisible', selector: '.kde-tray-popover-notifications, #kde-tray-popover-notifications' }],
      },
    ),
    scenario(
      'tray-volume',
      'tray',
      'utilisateur bureau — réglage volume tray',
      ['Cliquer icône volume', 'Popover slider volume visible'],
      {
        actions: [
          { type: 'click', selector: '#tray-sound-btn' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [{ type: 'selectorVisible', selector: '#volume-popover:not([hidden])' }],
      },
    ),
    scenario(
      'tray-expand-kdeconnect',
      'tray',
      'utilisateur bureau — tiroir tray étendu',
      ['Cliquer expand tray', 'Grille incluant KDE Connect'],
      {
        actions: [
          { type: 'click', selector: '#tray-btn-expand' },
          { type: 'wait', ms: 350 },
        ],
        assertions: [
          { type: 'selectorVisible', selector: '#kde-tray-popover-expand:not([hidden])' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'dolphin-sidebar-places',
      'nemo',
      'utilisateur fichiers — navigation places Dolphin',
      [
        'Ouvrir Dolphin',
        'Cliquer Documents dans la barre latérale',
        'Chemin et liste mis à jour',
      ],
      {
        prep: [{ type: 'openSlot', slot: 'nemo' }],
        actions: [
          { type: 'click', selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"], div[data-link="nemo"] a[data-item-name="Documents"]' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'childCountMin', selector: 'div[data-link="nemo"] .dolphin-file-list, div[data-link="nemo"] .nemo-file-list', min: 0 },
        ],
      },
    ),
    scenario(
      'dolphin-hamburger-menu',
      'nemo',
      'utilisateur fichiers — menu hamburger Dolphin',
      ['Ouvrir Dolphin', 'Cliquer menu hamburger', 'Flyout visible avec icônes'],
      {
        prep: [{ type: 'openSlot', slot: 'nemo' }],
        actions: [
          { type: 'click', selector: '#dolphin-main-menu' },
          { type: 'wait', ms: 250 },
        ],
        assertions: [{ type: 'selectorVisible', selector: '#dolphin-hamburger-menu:not([hidden])' }],
      },
    ),
    scenario(
      'dolphin-search-toggle',
      'nemo',
      'utilisateur fichiers — barre recherche Dolphin',
      ['Ouvrir Dolphin', 'Activer recherche', 'Champ recherche visible'],
      {
        prep: [{ type: 'openSlot', slot: 'nemo' }],
        actions: [
          { type: 'click', selector: 'div[data-link="nemo"] .dolphin-toolbar__search, div[data-link="nemo"] .dolphin-toolbar__btn--search' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'selectorVisible', selector: 'div[data-link="nemo"] #dolphin-search-bar:not([hidden])' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'firefox-address-bar',
      'firefox',
      'utilisateur web — barre d\'adresse Firefox',
      ['Ouvrir Firefox', 'Barre d\'adresse et contrôles navigation visibles'],
      {
        prep: [{ type: 'openSlot', slot: 'firefox' }],
        actions: [{ type: 'wait', ms: 400 }],
        assertions: [
          { type: 'selectorVisible', selector: 'div[data-link="firefox"] [data-browser-address]' },
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"firefox\\"] [data-firefox-app]") !== null' },
        ],
      },
    ),
    scenario(
      'firefox-new-tab',
      'firefox',
      'utilisateur web — nouvel onglet Firefox',
      ['Ouvrir Firefox', 'Cliquer nouvel onglet', 'Au moins 2 onglets'],
      {
        prep: [{ type: 'openSlot', slot: 'firefox' }],
        actions: [
          { type: 'click', selector: 'div[data-link="firefox"] [data-browser-action="new-tab"]' },
          { type: 'wait', ms: 250 },
        ],
        assertions: [
          { type: 'selectorMin', selector: 'div[data-link="firefox"] [data-browser-tab-id]', min: 2 },
        ],
      },
    ),
    scenario(
      'firefox-bookmarks-toggle',
      'firefox',
      'utilisateur web — barre signets Firefox',
      ['Ouvrir Firefox', 'Basculer barre signets'],
      {
        prep: [{ type: 'openSlot', slot: 'firefox' }],
        actions: [
          { type: 'click', selector: '#firefox [data-browser-bookmarks], #firefox .capsule-browser__btn--bookmarks' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#firefox [data-browser-bookmarks-bar], #firefox .capsule-browser__bookmarks") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'terminal-open-prompt',
      'terminal',
      'utilisateur dev — ouvrir Konsole',
      ['Ouvrir Konsole depuis panel', 'Invite commande visible'],
      {
        prep: [{ type: 'openSlot', slot: 'terminal' }],
        actions: [{ type: 'wait', ms: 300 }],
        assertions: [
          { type: 'slotVisible', slot: 'terminal' },
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"terminal\\"] [data-terminal-output], div[data-link=\\"terminal\\"] [data-terminal-command]") !== null' },
        ],
      },
    ),
    scenario(
      'terminal-new-tab',
      'terminal',
      'utilisateur dev — nouvel onglet Konsole',
      ['Ouvrir Konsole', 'Cliquer nouvel onglet'],
      {
        prep: [{ type: 'openSlot', slot: 'terminal' }],
        actions: [
          { type: 'click', selector: 'div[data-link="terminal"] [data-konsole-action="new-tab"]' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelectorAll("div[data-link=\\"terminal\\"] .capsule-terminal-toolbar__btn").length >= 1' },
        ],
      },
    ),
    scenario(
      'terminal-type-command',
      'terminal',
      'utilisateur dev — saisie commande',
      ['Ouvrir Konsole', 'Saisir echo test', 'Sortie affichée'],
      {
        prep: [{ type: 'openSlot', slot: 'terminal' }],
        actions: [
          { type: 'fill', selector: 'div[data-link="terminal"] [data-terminal-command]', value: 'echo test' },
          { type: 'eval', expr: 'document.querySelector("div[data-link=\\"terminal\\"] [data-terminal-command]")?.form?.requestSubmit()' },
          { type: 'wait', ms: 400 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: '(document.querySelector("div[data-link=\\"terminal\\"] [data-terminal-output]")?.textContent || "").includes("test")' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'discover-home-cards',
      'update_manager',
      'utilisateur logiciels — accueil Discover',
      ['Ouvrir Discover', 'Cartes applications visibles'],
      {
        prep: [{ type: 'openSlot', slot: 'update_manager' }],
        actions: [{ type: 'wait', ms: 500 }],
        assertions: [
          { type: 'selectorMin', selector: '[data-discover-home-mount] .kde-discover-card', min: 3 },
        ],
      },
    ),
    scenario(
      'discover-updates-tab',
      'update_manager',
      'utilisateur logiciels — onglet mises à jour',
      ['Ouvrir Discover', 'Naviguer vers Mises à jour'],
      {
        prep: [{ type: 'openSlot', slot: 'update_manager' }],
        actions: [
          { type: 'click', selector: '[data-discover-nav="updates"], .kde-discover-nav__item[data-view="updates"]' },
          { type: 'wait', ms: 400 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("[data-discover-updates-mount], .kde-discover-updates") !== null' },
        ],
      },
    ),
    scenario(
      'discover-vlc-detail',
      'update_manager',
      'utilisateur logiciels — fiche VLC',
      ['Ouvrir Discover', 'Cliquer carte VLC', 'Détail application visible'],
      {
        prep: [{ type: 'openSlot', slot: 'update_manager' }],
        actions: [
          { type: 'click', selector: '[data-discover-home-mount] .kde-discover-card[data-discover-app="vlc"]' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'selectorVisible', selector: '[data-discover-app-detail]:not([hidden]), .kde-discover-app-detail' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'kdeconnect-open-stub',
      'kdeconnect',
      'utilisateur mobile — ouvrir KDE Connect',
      ['Lancer KDE Connect depuis kickoff', 'Fenêtre stub visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'kdeconnect' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'kdeconnect' },
          { type: 'selectorVisible', selector: '#kdeconnectApp, [data-kdeconnect-app]' },
        ],
      },
    ),
    scenario(
      'kdeconnect-kickoff-entry',
      'kdeconnect',
      'utilisateur mobile — entrée kickoff KDEConnect',
      ['Ouvrir Kickoff', 'Catégorie Internet', 'Entrée KDEConnect présente'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="internet"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"kdeconnect\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'kdeconnect-tray-grid',
      'kdeconnect',
      'utilisateur mobile — KDE Connect dans tray étendu',
      ['Expand tray', 'Icône ou tuile KDE Connect'],
      {
        actions: [
          { type: 'click', selector: '#tray-btn-expand' },
          { type: 'wait', ms: 350 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.body.innerHTML.includes("kdeconnect") || document.body.innerHTML.includes("KDE Connect")' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'spectacle-open-capture',
      'spectacle',
      'utilisateur capture — ouvrir Spectacle',
      ['Lancer Spectacle depuis kickoff', 'Fenêtre capture visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'spectacle' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [{ type: 'slotVisible', slot: 'spectacle' }],
      },
    ),
    scenario(
      'spectacle-kickoff-entry',
      'spectacle',
      'utilisateur capture — entrée kickoff Spectacle',
      ['Ouvrir Kickoff', 'Catégorie Utilitaires', 'Entrée Spectacle présente'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="utilities"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"spectacle\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'spectacle-window-chrome',
      'spectacle',
      'utilisateur capture — chrome fenêtre Spectacle',
      ['Ouvrir Spectacle', 'Barre titre Breeze visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'spectacle' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'spectacle' },
          { type: 'evalTruthy', expr: 'document.querySelector("#spectacle, [data-link=\\"spectacle\\"] #windowHeader, [data-spectacle-app]") !== null' },
        ],
      },
    ),
    scenario(
      'kinfocenter-system-info',
      'kinfocenter',
      'utilisateur système — Centre d\'informations',
      ['Lancer Info-centre kickoff', 'Vue résumé système'],
      {
        actions: [
          { type: 'openSlot', slot: 'kinfocenter' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [{ type: 'slotVisible', slot: 'kinfocenter' }],
      },
    ),
    scenario(
      'kinfocenter-kickoff-entry',
      'kinfocenter',
      'utilisateur système — entrée kickoff Info-centre',
      ['Ouvrir Kickoff', 'Catégorie Système', 'Entrée Centre d\'informations'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="system"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"kinfocenter\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'kinfocenter-window-chrome',
      'kinfocenter',
      'utilisateur système — chrome Info-centre',
      ['Ouvrir Info-centre', 'Contenu stub visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'kinfocenter' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'kinfocenter' },
          { type: 'evalTruthy', expr: 'document.querySelector("#kinfocenter, [data-kinfocenter-app], [data-link=\\"kinfocenter\\"] .window-content") !== null' },
        ],
      },
    ),
    scenario(
      'system-monitor-processes',
      'system_monitor',
      'utilisateur système — Surveillance système',
      ['Lancer System Monitor kickoff', 'Liste processus ou graphiques'],
      {
        actions: [
          { type: 'openSlot', slot: 'system_monitor' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [{ type: 'slotVisible', slot: 'system_monitor' }],
      },
    ),
    scenario(
      'system-monitor-kickoff-entry',
      'system_monitor',
      'utilisateur système — entrée kickoff System Monitor',
      ['Ouvrir Kickoff', 'Catégorie Système', 'Entrée Surveillance du système'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="system"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"system_monitor\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'system-monitor-window-chrome',
      'system_monitor',
      'utilisateur système — chrome System Monitor',
      ['Ouvrir System Monitor', 'Vue processus ou graph CPU'],
      {
        actions: [
          { type: 'openSlot', slot: 'system_monitor' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'system_monitor' },
          { type: 'evalTruthy', expr: 'document.querySelector("#system_monitor, [data-system-monitor-app], [data-link=\\"system_monitor\\"]") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'text_editor-open-kate',
      'text_editor',
      'utilisateur dev — ouvrir Kate',
      ['Ouvrir Kate depuis kickoff', 'Zone édition visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'text_editor' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'text_editor' },
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"text_editor\\"] #xedApp, div[data-link=\\"text_editor\\"] .xed-app") !== null' },
        ],
      },
    ),
    scenario(
      'text_editor-menubar',
      'text_editor',
      'utilisateur dev — barre menus Kate/Xed',
      ['Ouvrir Kate', 'Barre de menus visible'],
      {
        prep: [{ type: 'openSlot', slot: 'text_editor' }],
        actions: [{ type: 'wait', ms: 400 }],
        assertions: [
          { type: 'selectorVisible', selector: 'div[data-link="text_editor"] .xed-app__menubar' },
        ],
      },
    ),
    scenario(
      'text_editor-kickoff-entry',
      'text_editor',
      'utilisateur dev — entrée kickoff Kate',
      ['Ouvrir Kickoff', 'Catégorie Développement', 'Entrée Kate présente'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="dev"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"text_editor\\"]") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'gwenview-open-gallery',
      'visionneur_images',
      'utilisateur média — ouvrir Gwenview',
      ['Lancer Gwenview', 'Vue galerie vide ou image'],
      {
        actions: [
          { type: 'openSlot', slot: 'visionneur_images' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'visionneur_images' },
          { type: 'selectorVisible', selector: '#gwenviewApp, [data-gwenview-app]' },
        ],
      },
    ),
    scenario(
      'gwenview-zoom-in',
      'visionneur_images',
      'utilisateur média — zoom Gwenview',
      ['Ouvrir Gwenview', 'Cliquer zoom avant', 'Indicateur zoom mis à jour'],
      {
        prep: [{ type: 'openSlot', slot: 'visionneur_images' }],
        actions: [
          { type: 'click', selector: '[data-gwenview-action="zoom-in"]' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: '(document.querySelector("#gwenview-zoom")?.textContent || "").includes("%")' },
        ],
      },
    ),
    scenario(
      'gwenview-kickoff-entry',
      'visionneur_images',
      'utilisateur média — entrée kickoff Gwenview',
      ['Ouvrir Kickoff', 'Catégorie Graphisme', 'Entrée Gwenview'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="graph"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"visionneur_images\\"]") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'okular-open-pdf',
      'visionneur_pdf',
      'utilisateur bureautique — ouvrir Okular',
      ['Lancer Okular', 'Barre outils PDF visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'visionneur_pdf' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'visionneur_pdf' },
          { type: 'selectorVisible', selector: '#okularApp, [data-okular-app]' },
        ],
      },
    ),
    scenario(
      'okular-sidebar-toggle',
      'visionneur_pdf',
      'utilisateur bureautique — miniatures Okular',
      ['Ouvrir Okular', 'Basculer panneau miniatures'],
      {
        prep: [{ type: 'openSlot', slot: 'visionneur_pdf' }],
        actions: [
          { type: 'click', selector: '[data-okular-action="sidebar"]' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#okular-sidebar[hidden]") !== null || document.querySelector("[data-okular-action=\\"sidebar\\"][aria-pressed=\\"false\\"]") !== null' },
        ],
      },
    ),
    scenario(
      'okular-kickoff-entry',
      'visionneur_pdf',
      'utilisateur bureautique — entrée kickoff Okular',
      ['Ouvrir Kickoff', 'Catégorie Bureau', 'Entrée Okular'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="bureau"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"visionneur_pdf\\"]") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'vlc-open-player',
      'lecteur_multimedia',
      'utilisateur média — ouvrir VLC',
      ['Lancer VLC', 'Chrome lecteur visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'lecteur_multimedia' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'lecteur_multimedia' },
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"lecteur_multimedia\\"] #lecteurMultimedia, div[data-link=\\"lecteur_multimedia\\"] .celluloid-app") !== null' },
        ],
      },
    ),
    scenario(
      'vlc-playback-controls',
      'lecteur_multimedia',
      'utilisateur média — contrôles VLC',
      ['Ouvrir VLC', 'Barre contrôles lecture visible'],
      {
        prep: [{ type: 'openSlot', slot: 'lecteur_multimedia' }],
        actions: [{ type: 'wait', ms: 500 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"lecteur_multimedia\\"] .celluloid-app__ctl--play, div[data-link=\\"lecteur_multimedia\\"] .celluloid-app__controls") !== null' },
        ],
      },
    ),
    scenario(
      'vlc-kickoff-entry',
      'lecteur_multimedia',
      'utilisateur média — entrée kickoff VLC',
      ['Ouvrir Kickoff', 'Catégorie Multimédia', 'Entrée VLC'],
      {
        prep: [
          { type: 'openKickoff' },
          { type: 'click', selector: '#mainMenu .menu-cat[data-cat-id="sonvideo"]' },
          { type: 'wait', ms: 250 },
        ],
        actions: [{ type: 'wait', ms: 100 }],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#mainMenu .menu-app-item[data-menu-app-link=\\"lecteur_multimedia\\"]") !== null' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'themes-settings-navigation',
      'themes',
      'utilisateur — navigation Paramètres système KDE',
      ['Ouvrir Paramètres', 'Naviguer Espace de travail', 'Panneau visible'],
      {
        actions: [
          { type: 'openSlot', slot: 'themes' },
          { type: 'wait', ms: 600 },
          { type: 'click', selector: '[data-kde-panel="workspace"]:not([disabled])' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'slotVisible', slot: 'themes' },
          { type: 'evalTruthy', expr: '!!document.querySelector(\'[data-kde-panel-content="workspace"]:not([hidden])\')' },
        ],
      },
      { campaign: 'g-coherence' },
    ),
    scenario(
      'themes-global-dark',
      'themes',
      'utilisateur — thème sombre global',
      ['Ouvrir Paramètres', 'Activer thème Sombre', 'html[data-theme=dark]'],
      {
        actions: [
          { type: 'openSlot', slot: 'themes' },
          { type: 'wait', ms: 600 },
          { type: 'click', selector: '[data-kde-theme-option="dark"]' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.documentElement.dataset.theme === "dark"' },
        ],
      },
    ),
    scenario(
      'themes-reduced-motion',
      'themes',
      'utilisateur — réduire animations Paramètres',
      ['Ouvrir Paramètres', 'Accessibilité', 'Activer réduire animations'],
      {
        actions: [
          { type: 'openSlot', slot: 'themes' },
          { type: 'wait', ms: 600 },
          { type: 'click', selector: '[data-kde-panel="accessibility"]:not([disabled])' },
          { type: 'wait', ms: 300 },
          { type: 'click', selector: '[data-kde-setting="kde-reduced-motion"]' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.documentElement.dataset.reducedMotion === "true"' },
        ],
      },
    ),
    scenario(
      'themes-desktop-icons-hide',
      'themes',
      'utilisateur — masquer icônes bureau',
      ['Ouvrir Paramètres', 'Bureau', 'Désactiver icônes bureau'],
      {
        actions: [
          { type: 'openSlot', slot: 'themes' },
          { type: 'wait', ms: 600 },
          { type: 'click', selector: '[data-kde-panel="desktop"]:not([disabled])' },
          { type: 'wait', ms: 300 },
          { type: 'click', selector: '[data-kde-setting="kde-desktop-icons"]' },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.body.dataset.plasmaDesktopIcons === "false"' },
        ],
      },
    ),
  );

  list.push(
    scenario(
      'discover-install-complete',
      'update_manager',
      'utilisateur — installation VLC depuis Discover',
      ['Ouvrir Discover', 'Installer VLC', 'Meta store persistée'],
      {
        prep: [
          { type: 'eval', expr: "sessionStorage.removeItem('capsule-store-installed:linux-kde-neon');" },
        ],
        actions: [
          { type: 'openSlot', slot: 'update_manager' },
          { type: 'wait', ms: 800 },
          { type: 'click', selector: '[data-discover-home-mount] .kde-discover-card[data-discover-app="vlc"]' },
          { type: 'wait', ms: 400 },
          { type: 'click', selector: '[data-discover-app-install="vlc"], [data-discover-install="vlc"], button[data-discover-action="install"]' },
          { type: 'wait', ms: 4000 },
        ],
        assertions: [
          {
            type: 'evalTruthy',
            expr: 'document.querySelector("[data-discover-app-open=\\"lecteur_multimedia\\"], [data-discover-app-open=\\"vlc\\"]") !== null || document.querySelector(".kde-discover-app-detail__action.is-installed") !== null',
          },
        ],
      },
      { campaign: 'g-coherence' },
    ),
    scenario(
      'panel-height-effect',
      'panel',
      'utilisateur — hauteur panneau via Paramètres',
      ['Ouvrir Paramètres', 'Changer hauteur 48px', 'dataset body'],
      {
        actions: [
          { type: 'openSlot', slot: 'themes' },
          { type: 'wait', ms: 600 },
          {
            type: 'eval',
            expr: "var sel=document.querySelector('[data-kde-setting=\"kde-panel-height\"]'); if(sel){sel.value='48';sel.dispatchEvent(new Event('change',{bubbles:true}));}",
          },
          { type: 'wait', ms: 200 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: "document.body.dataset.plasmaPanelHeight === '48'" },
        ],
      },
      { campaign: 'g-coherence' },
    ),
    scenario(
      'dolphin-compact-view',
      'nemo',
      'utilisateur fichiers — vue compacte Dolphin',
      ['Ouvrir Dolphin', 'Basculer vue compacte'],
      {
        prep: [{ type: 'openSlot', slot: 'nemo' }],
        actions: [
          { type: 'eval', expr: 'if(window.setFileExplorerViewMode){window.setFileExplorerViewMode("compact");}' },
          { type: 'wait', ms: 400 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("div[data-link=\\"nemo\\"] .nemo-app__content-grid--compact") !== null' },
        ],
      },
    ),
    scenario(
      'kickoff-launch-dolphin',
      'kickoff',
      'utilisateur bureau — lancer Dolphin depuis kickoff',
      ['Ouvrir Kickoff', 'Cliquer Dolphin', 'Fenêtre fichiers visible'],
      {
        prep: [{ type: 'openKickoff' }],
        actions: [
          { type: 'click', selector: '#mainMenu .menu-app-item[data-menu-app-link="nemo"]' },
          { type: 'wait', ms: 500 },
        ],
        assertions: [{ type: 'slotVisible', slot: 'nemo' }],
      },
    ),
    scenario(
      'tray-network-popover',
      'tray',
      'utilisateur bureau — popover réseau tray',
      ['Cliquer icône réseau', 'Popover connexions visible'],
      {
        actions: [
          { type: 'click', selector: '#tray-btn-network' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("#kde-tray-popover-network:not([hidden])") !== null' },
        ],
      },
    ),
    scenario(
      'firefox-private-window',
      'firefox',
      'utilisateur web — navigation privée Firefox',
      ['Ouvrir Firefox', 'Cliquer navigation privée ou nouvel onglet privé'],
      {
        prep: [{ type: 'openSlot', slot: 'firefox' }],
        actions: [
          { type: 'click', selector: 'div[data-link="firefox"] [data-browser-action="private-window"], div[data-link="firefox"] [data-browser-action="new-tab"]' },
          { type: 'wait', ms: 300 },
        ],
        assertions: [
          { type: 'selectorMin', selector: 'div[data-link="firefox"] [data-browser-tab-id]', min: 1 },
        ],
      },
    ),
    scenario(
      'discover-installed-tab',
      'update_manager',
      'utilisateur logiciels — onglet installées Discover',
      ['Ouvrir Discover', 'Naviguer Installées'],
      {
        prep: [{ type: 'openSlot', slot: 'update_manager' }],
        actions: [
          { type: 'click', selector: '[data-discover-nav="installed"], .kde-discover-nav__item[data-view="installed"]' },
          { type: 'wait', ms: 400 },
        ],
        assertions: [
          { type: 'evalTruthy', expr: 'document.querySelector("[data-discover-installed-mount], .kde-discover-installed") !== null' },
        ],
      },
    ),
  );

  return list;
};

const APP_LABELS = {
  panel: 'Panel Plasma',
  kickoff: 'Kickoff',
  tray: 'Zone de notification',
  nemo: 'Dolphin',
  firefox: 'Firefox',
  terminal: 'Konsole',
  update_manager: 'Discover',
  kdeconnect: 'KDE Connect',
  spectacle: 'Spectacle',
  kinfocenter: 'Centre d\'informations',
  system_monitor: 'Surveillance du système',
  themes: 'Paramètres système',
  text_editor: 'Kate',
  visionneur_images: 'Gwenview',
  visionneur_pdf: 'Okular',
  lecteur_multimedia: 'VLC',
};

const buildInventory = () => {
  const scenarios = buildScenarios();
  const appQueue = [...new Set(scenarios.map((s) => s.app))];
  const apps = appQueue.map((id) => ({
    id,
    label: APP_LABELS[id] || id,
    pi_credibility: null,
  }));

  const inventory = {
    registryId: REGISTRY_ID,
    campaign: 'v5-credibility-pass',
    doc: 'root/docs/ground-truth-kde.md',
    contract: 'etc/capsuleos/contracts/kde-fidelity-scenarios.json',
    previousCampaign: 'v4-deep-parity',
    vm: { host: '<lab-inventory:linux-kde-neon>' },
    appQueue,
    apps,
    scenarios,
    summary: null,
    seededAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inventory.summary = computeSummary(inventory);
  return inventory;
};

const main = () => {
  const opts = parseArgs();
  const inventory = buildInventory();

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
    return;
  }

  process.stdout.write(`\n=== seed-kde-neon-fidelity-inventory ===\n`);
  process.stdout.write(`Apps: ${inventory.apps.length} · scénarios: ${inventory.scenarios.length}\n`);
  process.stdout.write(
    `CredV ${inventory.summary.documented}/${inventory.summary.totalScenarios} · ` +
      `CredC ${inventory.summary.implemented}/${inventory.summary.totalScenarios}\n`,
  );

  if (!opts.write) {
    process.stdout.write('\nAstuce: --write pour persister linux-kde-neon-app-fidelity-scenarios.json\n');
    return;
  }

  const outPath = path.join(ROOT, 'root/docs/inventaires', `${REGISTRY_ID}-app-fidelity-scenarios.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
  process.stdout.write(`\n✓ Écrit ${outPath}\n`);
};

main();
