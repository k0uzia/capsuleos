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
    vm: { host: 'goupil@192.168.123.52' },
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
