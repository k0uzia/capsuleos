#!/usr/bin/env node
/**
 * Smoke crédibilité pédagogique — exécution steps scénario sur façade OS (squelette Playwright).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-scenario.mjs --id linux-mint --scenario nemo-menu-context --dry-run
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node ... --id linux-mint --scenario mintinstall-search
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', scenario: null, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--scenario' && args[i + 1]) opts.scenario = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const loadInventory = (registryId) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const resolveFidelitySlot = (appId) => {
  if (appId === 'pix') {
    return 'visionneur_images';
  }
  return appId;
};

const findScenario = (inventory, scenarioId) => {
  const scenarios = inventory.scenarios || [];
  for (let i = 0; i < scenarios.length; i += 1) {
    if (scenarios[i].id === scenarioId) return scenarios[i];
  }
  return null;
};

const buildPlaywrightPlan = (registryId, scenario, httpBase) => {
  const url = resolveCapsuleOsUrl(registryId, httpBase);
  const slotId = resolveFidelitySlot(scenario.app);
  const selectors = (scenario.selectors && scenario.selectors.capsule) || [];
  const plan = {
    url,
    app: scenario.app,
    openSlot: slotId,
    scenarioId: scenario.id,
    steps: scenario.steps || [],
    actions: [
      { type: 'goto', url },
      { type: 'waitFor', fn: 'openWindowByDataLink' },
      { type: 'openSlot', slot: slotId },
      { type: 'wait', ms: 800 },
    ],
    baseAssertions: [],
    executionBlocks: [],
    assertions: [],
  };

  selectors.forEach((sel) => {
    plan.baseAssertions.push({ type: 'selectorVisible', selector: sel });
  });

  if (scenario.id === 'nemo-open-documents') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      desc: 'sidebar Documents',
    });
    plan.actions.push({ type: 'wait', ms: 250 });
    plan.assertions.push({ type: 'textContains', selector: '.nemo-pathbar, #nemo-path-label', text: 'Documents' });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      className: 'nemo-sidebar__link--active',
    });
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="nemo"] .nemo-file-list',
      min: 1,
    });
  }
  if (scenario.id === 'nemo-menu-context') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Bureau"]',
      desc: 'sidebar Bureau',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.actions.push({
      type: 'contextMenu',
      selector: 'div[data-link="nemo"] .nemoElement',
      x: 420,
      y: 320,
      desc: 'clic droit zone vide',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.assertions.push({ type: 'selectorVisible', selector: 'div[data-link="nemo"] .nemo-app__context-menu:not([hidden])' });
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="nemo"] .nemo-app__context-menu',
      min: 3,
    });
  }
  if (scenario.id === 'nemo-sidebar-favorites') {
    const nav = [
      { link: 'Téléchargements', label: 'Téléchargements' },
      { link: 'Bureau', label: 'Bureau' },
      { link: 'Dossier Personnel', label: 'Dossier personnel' },
    ];
    nav.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'click',
            selector: `div[data-link="nemo"] #voletnemo a[data-link="${step.link}"]`,
            desc: `sidebar ${step.label}`,
          },
          { type: 'wait', ms: 280 },
        ],
        assertions: [{
          type: 'hasClass',
          selector: `div[data-link="nemo"] #voletnemo a[data-link="${step.link}"]`,
          className: 'nemo-sidebar__link--active',
        }],
      });
    });
  }
  if (scenario.id === 'nemo-file-new-folder') {
    plan.dialogHandler = { accept: 'Projet' };
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      desc: 'sidebar Documents',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.actions.push({ type: 'nemoMenu', menu: 'Fichier', item: 'Créer un nouveau dossier' });
    plan.actions.push({ type: 'wait', ms: 400 });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="nemo"] .nemo-file-list a[data-item-name="Projet"]',
    });
  }
  if (scenario.id === 'mintinstall-search') {
    plan.actions.push({ type: 'fill', selector: 'div[data-link="mintinstall"] #mi-search, .mintinstall-search input', value: 'firefox' });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.assertions.push({ type: 'textContains', selector: 'div[data-link="mintinstall"] .mintinstall-results, #mi-search-list', text: 'Firefox' });
  }
  if (scenario.id === 'mintinstall-categories') {
    const cats = [
      { cat: 'internet', expect: 'Firefox' },
      { cat: 'graphics', expect: 'GIMP' },
      { cat: 'accessories', expect: 'Calculatrice' },
    ];
    cats.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'click',
            selector: `div[data-link="mintinstall"] [data-mi-cat="${step.cat}"]`,
            desc: `catégorie ${step.cat}`,
          },
          { type: 'wait', ms: 280 },
        ],
        assertions: [
          {
            type: 'hasClass',
            selector: `div[data-link="mintinstall"] [data-mi-cat="${step.cat}"]`,
            className: 'is-active',
          },
          {
            type: 'textContains',
            selector: 'div[data-link="mintinstall"] #mi-app-list',
            text: step.expect,
          },
        ],
      });
    });
  }
  if (scenario.id === 'themes-panels-nav') {
    const panels = [
      { nav: 'general', title: 'Général' },
      { nav: 'desklets', title: 'Desklets' },
      { nav: 'windows', title: 'Fenêtres' },
    ];
    panels.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'click',
            selector: `div[data-link="themes"] [data-cs-nav="${step.nav}"]`,
            desc: `panneau ${step.title}`,
          },
          { type: 'wait', ms: 320 },
        ],
        assertions: [
          {
            type: 'textContains',
            selector: 'div[data-link="themes"] #cs-panel-title',
            text: step.title,
          },
          {
            type: 'selectorVisible',
            selector: `div[data-link="themes"] [data-cs-panel="${step.nav}"]:not([hidden])`,
          },
        ],
      });
    });
  }
  if (scenario.id === 'themes-wallpaper') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="themes"] [data-cs-nav="backgrounds"]',
      desc: 'panneau Arrière-plans',
    });
    plan.actions.push({ type: 'wait', ms: 450 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="themes"] .cs-backgrounds:not([hidden])',
    });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="themes"] .cs-backgrounds .cs-wallpaper-thumb',
    });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="themes"] .cs-backgrounds .cs-wallpaper-thumb',
      desc: 'sélectionner un fond',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="themes"] .cs-backgrounds .cs-wallpaper-thumb.is-active',
      className: 'is-active',
    });
  }
  if (scenario.id === 'themes-applets') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="themes"] [data-cs-nav="applets"]',
      desc: 'panneau Applets',
    });
    plan.actions.push({ type: 'wait', ms: 320 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="themes"] .cs-applets-list',
    });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="themes"] .cs-applets-list [data-cs-applet="show-desktop"]',
      desc: 'activer applet bureau',
    });
    plan.actions.push({ type: 'wait', ms: 150 });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="themes"] .cs-applets-list [data-cs-applet="show-desktop"]',
      className: 'is-on',
    });
  }
  if (scenario.id === 'firefox-url-bar') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="firefox"] [data-browser-address]',
      desc: 'focus barre adresse',
    });
    plan.actions.push({
      type: 'fill',
      selector: 'div[data-link="firefox"] [data-browser-address]',
      value: 'linuxmint.com',
    });
    plan.actions.push({
      type: 'pressKey',
      key: 'Enter',
      selector: 'div[data-link="firefox"] [data-browser-address]',
      desc: 'valider navigation',
    });
    plan.actions.push({ type: 'wait', ms: 280 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="firefox"] [data-browser-site]:not([hidden])',
    });
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="firefox"] .capsule-browser-site__title',
      text: 'Linux Mint',
    });
    plan.assertions.push({
      type: 'inputValueContains',
      selector: 'div[data-link="firefox"] [data-browser-address]',
      text: 'linuxmint.com',
    });
  }
  if (scenario.id === 'firefox-tabs') {
    plan.executionBlocks.push({
      actions: [
        { type: 'pressKey', key: 'Control+t', desc: 'Ctrl+T nouvel onglet' },
        { type: 'wait', ms: 220 },
      ],
      assertions: [{
        type: 'childCountMin',
        selector: 'div[data-link="firefox"] .firefox-tabbar',
        min: 2,
      }],
    });
    plan.executionBlocks.push({
      actions: [
        {
          type: 'click',
          selector: 'div[data-link="firefox"] .firefox-tab:first-child',
          desc: 'basculer onglet 1',
        },
        { type: 'wait', ms: 150 },
      ],
      assertions: [{
        type: 'hasClass',
        selector: 'div[data-link="firefox"] .firefox-tab:first-child',
        className: 'capsule-browser__tab--active',
      }],
    });
    plan.executionBlocks.push({
      actions: [
        {
          type: 'click',
          selector: 'div[data-link="firefox"] .firefox-tab:last-child [data-browser-tab-close]',
          desc: 'fermer onglet',
        },
        { type: 'wait', ms: 150 },
      ],
      assertions: [{
        type: 'childCountMin',
        selector: 'div[data-link="firefox"] .firefox-tabbar',
        min: 1,
      }],
    });
  }
  if (scenario.id === 'firefox-hamburger-menu') {
    plan.executionBlocks.push({
      actions: [
        {
          type: 'click',
          selector: 'div[data-link="firefox"] .firefox-appmenu-button',
          desc: 'menu hamburger',
        },
        { type: 'wait', ms: 120 },
      ],
      assertions: [
        {
          type: 'selectorVisible',
          selector: 'div[data-link="firefox"] .firefox-appmenu:not([hidden])',
        },
        {
          type: 'childCountMin',
          selector: 'div[data-link="firefox"] .firefox-appmenu',
          min: 4,
        },
      ],
    });
    plan.executionBlocks.push({
      actions: [
        {
          type: 'click',
          selector: 'div[data-link="firefox"] .firefox-appmenu .capsule-browser__menu-item:first-child',
          desc: 'Nouvel onglet via menu',
        },
        { type: 'wait', ms: 180 },
      ],
      assertions: [{
        type: 'childCountMin',
        selector: 'div[data-link="firefox"] .firefox-tabbar',
        min: 2,
      }],
    });
  }
  if (scenario.id === 'mintinstall-app-detail') {
    plan.actions.push({ type: 'fill', selector: 'div[data-link="mintinstall"] #mi-search', value: 'vlc' });
    plan.actions.push({ type: 'wait', ms: 220 });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="mintinstall"] .mi-app__list-item[data-mi-pkg="vlc"] .mi-app__list-body',
      desc: 'ouvrir fiche VLC',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="mintinstall"] .mintinstall-detail:not([hidden])',
    });
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="mintinstall"] #mi-detail-name',
      text: 'VLC',
    });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="mintinstall"] .mintinstall-install-btn',
      desc: 'simuler installation',
    });
    plan.actions.push({ type: 'wait', ms: 150 });
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="mintinstall"] #mi-status',
      text: 'installé',
    });
  }
  if (scenario.id === 'text-editor-open-save') {
    plan.actions.push({
      type: 'fill',
      selector: 'div[data-link="text_editor"] #xed-area',
      value: 'Contenu pédagogique CapsuleOS',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.executionBlocks.push({
      actions: [
        { type: 'xedMenu', menu: 'Fichier', item: 'Enregistrer sous' },
        { type: 'wait', ms: 150 },
      ],
      assertions: [{
        type: 'selectorVisible',
        selector: 'div[data-link="text_editor"] #xed-save-dialog:not([hidden])',
      }],
    });
    plan.executionBlocks.push({
      actions: [
        {
          type: 'fill',
          selector: 'div[data-link="text_editor"] #xed-save-path',
          value: '~/Documents/notes-capsule.txt',
        },
        {
          type: 'click',
          selector: 'div[data-link="text_editor"] #xed-save-dialog [data-xed-dialog="save-apply"]',
          desc: 'valider enregistrement',
        },
        { type: 'wait', ms: 120 },
      ],
      assertions: [{
        type: 'textContains',
        selector: 'div[data-link="text_editor"] #windowTitle',
        text: 'notes-capsule.txt',
      }],
    });
  }
  if (scenario.id === 'text-editor-find') {
    plan.actions.push({
      type: 'fill',
      selector: 'div[data-link="text_editor"] #xed-area',
      value: 'alpha beta gamma beta',
    });
    plan.actions.push({ type: 'wait', ms: 100 });
    plan.actions.push({
      type: 'pressKey',
      key: 'Control+f',
      selector: 'div[data-link="text_editor"] #xed-area',
      desc: 'Ctrl+F barre recherche',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="text_editor"] .xed-searchbar:not([hidden])',
    });
    plan.actions.push({
      type: 'fill',
      selector: 'div[data-link="text_editor"] #xed-searchbar-input',
      value: 'beta',
    });
    plan.actions.push({ type: 'wait', ms: 100 });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="text_editor"] [data-xed-searchbar="next"]',
      desc: 'occurrence suivante',
    });
    plan.actions.push({ type: 'wait', ms: 80 });
    plan.assertions.push({
      type: 'evaluateTruthy',
      fn: 'xedFindSelection',
      args: { term: 'beta' },
    });
  }
  if (scenario.id === 'text-editor-preferences') {
    plan.actions.push({ type: 'xedMenu', menu: 'Édition', item: 'Préférences' });
    plan.actions.push({ type: 'wait', ms: 150 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="text_editor"] .xed-prefs-dialog:not([hidden])',
    });
    const prefTabs = [
      { tab: 'display', panel: 'display', label: 'Affichage' },
      { tab: 'plugins', panel: 'plugins', label: 'Plugins' },
    ];
    prefTabs.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'xedPrefsTab',
            tab: step.tab,
            desc: `onglet ${step.label}`,
          },
          { type: 'wait', ms: 100 },
        ],
        assertions: [{
          type: 'selectorVisible',
          selector: `div[data-link="text_editor"] [data-xed-prefs-panel="${step.panel}"]:not([hidden])`,
        }],
      });
    });
  }
  if (scenario.id === 'update-manager-list') {
    plan.preOpen = { type: 'umPrep' };
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="update_manager"] [data-um-welcome="finish"]',
      desc: 'fermer accueil',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="update_manager"] [data-um-mirror="no"]',
      desc: 'rejeter miroir',
    });
    plan.actions.push({ type: 'wait', ms: 80 });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="update_manager"] .update-manager-refresh',
      desc: 'actualiser liste',
    });
    plan.actions.push({ type: 'wait', ms: 1100 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="update_manager"] .update-manager-list:not([hidden])',
    });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="update_manager"] .update-manager-list tbody input[type="checkbox"]:first-of-type',
      desc: 'décocher première entrée',
    });
    plan.actions.push({ type: 'wait', ms: 100 });
    plan.assertions.push({
      type: 'evaluateTruthy',
      fn: 'umCheckboxToggled',
      args: { checked: false },
    });
  }
  if (scenario.id === 'update-manager-tabs') {
    plan.preOpen = { type: 'umPrep' };
    plan.prepActions = [
      {
        type: 'click',
        selector: 'div[data-link="update_manager"] [data-um-welcome="finish"]',
      },
      { type: 'wait', ms: 100 },
      {
        type: 'click',
        selector: 'div[data-link="update_manager"] [data-um-mirror="no"]',
      },
      { type: 'wait', ms: 80 },
      {
        type: 'click',
        selector: 'div[data-link="update_manager"] .update-manager-refresh',
      },
      { type: 'wait', ms: 1100 },
    ];
    const umTabs = [
      { tab: 'packages', expect: 'paquet binaire' },
      { tab: 'changelog', expect: 'correctifs' },
      { tab: 'info', expect: 'alsa-lib' },
    ];
    umTabs.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'umTab',
            tab: step.tab,
            desc: `onglet ${step.tab}`,
          },
          { type: 'wait', ms: 150 },
        ],
        assertions: [{
          type: 'textContains',
          selector: 'div[data-link="update_manager"] #um-panel',
          text: step.expect,
        }],
      });
    });
  }
  if (scenario.id === 'update-manager-refresh') {
    plan.preOpen = { type: 'umPrep' };
    plan.prepActions = [
      {
        type: 'click',
        selector: 'div[data-link="update_manager"] [data-um-welcome="finish"]',
      },
      { type: 'wait', ms: 100 },
      {
        type: 'click',
        selector: 'div[data-link="update_manager"] [data-um-mirror="no"]',
      },
      { type: 'wait', ms: 80 },
    ];
    plan.executionBlocks.push({
      actions: [
        {
          type: 'click',
          selector: 'div[data-link="update_manager"] .update-manager-refresh',
          desc: 'lancer actualisation',
        },
        { type: 'wait', ms: 150 },
      ],
      assertions: [{
        type: 'evaluateTruthy',
        fn: 'umRefreshBusy',
      }],
    });
    plan.actions.push({ type: 'wait', ms: 900 });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="update_manager"] .update-manager-list:not([hidden])',
    });
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="update_manager"] .update-manager-list tbody',
      min: 3,
    });
  }
  if (scenario.id === 'calculator-basic') {
    plan.prepActions = [{ type: 'calcInit' }];
    plan.actions.push(
      { type: 'calcKeys', keys: ['1', '2', '+', '7', '='] },
      { type: 'wait', ms: 120 },
    );
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="calculator"] #gnome-calc-value',
      text: '19',
    });
  }
  if (scenario.id === 'calculator-scientific') {
    plan.prepActions = [{ type: 'calcInit' }];
    plan.actions.push(
      { type: 'calcMode', mode: 'advanced' },
      { type: 'wait', ms: 120 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="calculator"] .calc-scientific-mode:not([hidden])',
    });
    plan.actions.push(
      { type: 'calcKeys', keys: ['0'] },
      { type: 'calcFn', fn: 'sin' },
      { type: 'wait', ms: 80 },
    );
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="calculator"] #gnome-calc-value',
      text: '0',
    });
  }
  if (scenario.id === 'calculator-history') {
    plan.prepActions = [{ type: 'calcInit' }];
    plan.executionBlocks.push({
      actions: [
        { type: 'calcKeys', keys: ['2', '+', '3', '='] },
        { type: 'wait', ms: 80 },
        { type: 'calcKeys', keys: ['4', '*', '2', '='] },
        { type: 'wait', ms: 80 },
        { type: 'click', selector: 'div[data-link="calculator"] [data-calc="history-toggle"]' },
        { type: 'wait', ms: 120 },
      ],
      assertions: [
        {
          type: 'selectorVisible',
          selector: 'div[data-link="calculator"] .calc-history:not([hidden])',
        },
        {
          type: 'childCountMin',
          selector: 'div[data-link="calculator"] #gnome-calc-history-list',
          min: 2,
        },
      ],
    });
    plan.executionBlocks.push({
      actions: [
        { type: 'calcHistoryPick', idx: 1 },
        { type: 'wait', ms: 80 },
      ],
      assertions: [{
        type: 'textContains',
        selector: 'div[data-link="calculator"] #gnome-calc-value',
        text: '8',
      }],
    });
  }
  if (scenario.id === 'file-roller-open-archive') {
    plan.prepActions = [{ type: 'frInit' }];
    plan.actions.push(
      { type: 'click', selector: 'div[data-link="file_roller"] [data-fr-action="menu"]' },
      { type: 'wait', ms: 120 },
      { type: 'click', selector: 'div[data-link="file_roller"] [data-fr-menu="open-demo"]' },
      { type: 'wait', ms: 200 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="file_roller"] .fr-app__list-wrap:not([hidden])',
    });
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="file_roller"] #fr-list-body',
      text: 'demo.txt',
    });
  }
  if (scenario.id === 'file-roller-extract') {
    plan.prepActions = [{ type: 'frInit' }, { type: 'frOpenDemo' }];
    plan.actions.push(
      { type: 'click', selector: 'div[data-link="file_roller"] [data-fr-action="extract"]' },
      { type: 'wait', ms: 150 },
    );
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="file_roller"] #fr-status',
      text: 'Extraction',
    });
  }
  if (scenario.id === 'file-roller-create') {
    plan.prepActions = [{ type: 'frInit' }];
    plan.actions.push(
      { type: 'frNewArchive', name: 'archive.tar.gz' },
      { type: 'wait', ms: 200 },
    );
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="file_roller"] #fr-app-title',
      text: 'archive.tar.gz',
    });
    plan.actions.push(
      { type: 'click', selector: 'div[data-link="file_roller"] [data-fr-action="add"]' },
      { type: 'wait', ms: 100 },
    );
    plan.dialogHandler = { accept: 'readme.txt' };
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.assertions.push({
      type: 'textContains',
      selector: 'div[data-link="file_roller"] #fr-list-body',
      text: 'readme.txt',
    });
  }
  if (scenario.id === 'terminal-basic-shell') {
    plan.prepActions = [{ type: 'terminalInit' }];
    plan.actions.push(
      { type: 'terminalCommand', command: 'ls' },
      { type: 'wait', ms: 900 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="terminal"] .capsule-terminal-shell',
    });
    plan.assertions.push({
      type: 'evaluateTruthy',
      fn: 'terminalHasOutput',
    });
  }
  if (scenario.id === 'terminal-tabs') {
    plan.prepActions = [{ type: 'terminalInit' }];
    plan.actions.push(
      { type: 'pressKey', key: 'Control+Shift+t', desc: 'Ctrl+Shift+T nouvel onglet' },
      { type: 'wait', ms: 280 },
    );
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="terminal"] .terminal-tabs',
      min: 2,
    });
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="terminal"] .terminal-tabs button:first-child',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="terminal"] .terminal-tabs button:first-child',
      className: 'terminal-tabs__tab--active',
    });
  }
  if (scenario.id === 'terminal-preferences') {
    plan.prepActions = [{ type: 'terminalInit' }];
    plan.actions.push(
      { type: 'terminalMenuOpen', action: 'preferences' },
      { type: 'wait', ms: 200 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="terminal"] .terminal-prefs:not([hidden])',
    });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="terminal"] [data-terminal-prefs-tab="general"]',
    });
  }
  if (scenario.id === 'pix-open-image') {
    plan.prepActions = [{ type: 'xvInit' }, { type: 'xvOpenDemo' }];
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="visionneur_images"] .pix-viewer',
    });
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="visionneur_images"] .pix-toolbar',
    });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="visionneur_images"] .viewer-app__image',
    });
  }
  if (scenario.id === 'pix-slideshow') {
    plan.prepActions = [{ type: 'xvInit' }, { type: 'xvOpenDemo' }];
    plan.actions.push(
      { type: 'xvAction', action: 'slideshow' },
      { type: 'wait', ms: 200 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="visionneur_images"] .pix-slideshow:not([hidden])',
    });
  }
  if (scenario.id === 'pix-export') {
    plan.prepActions = [{ type: 'xvInit' }, { type: 'xvOpenDemo' }];
    plan.actions.push(
      { type: 'xvMenu', menu: 'Fichier', item: 'Enregistrer sous' },
      { type: 'wait', ms: 200 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: 'div[data-link="visionneur_images"] .pix-export-dialog:not([hidden])',
    });
  }
  if (scenario.id === 'sticky-create-note') {
    plan.prepActions = [{ type: 'stickyInit' }];
    plan.actions.push(
      { type: 'click', selector: 'div[data-link="sticky"] [data-stk-action="new"]' },
      { type: 'wait', ms: 120 },
      { type: 'fill', selector: 'div[data-link="sticky"] #stk-editor', value: 'Note crédibilité Mint' },
      { type: 'click', selector: 'div[data-link="sticky"] [data-stk-color="yellow"]' },
      { type: 'wait', ms: 100 },
    );
    plan.assertions.push({
      type: 'inputValueContains',
      selector: 'div[data-link="sticky"] #stk-editor',
      text: 'Note crédibilité',
    });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="sticky"] .stk-app__editor',
      className: 'stk-app__editor--yellow',
    });
  }
  if (scenario.id === 'sticky-delete-note') {
    plan.prepActions = [{ type: 'stickyInit' }];
    plan.actions.push(
      { type: 'click', selector: 'div[data-link="sticky"] [data-stk-action="delete"]' },
      { type: 'wait', ms: 150 },
    );
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="sticky"] #stk-list',
      min: 1,
    });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="sticky"] .sticky-delete-confirm:not([hidden])',
    });
  }
  if (scenario.id === 'sticky-panel-applet') {
    plan.actions.push(
      { type: 'click', selector: '#system-tray [data-stk-applet-trigger]' },
      { type: 'wait', ms: 180 },
    );
    plan.assertions.push({
      type: 'selectorVisible',
      selector: '#system-tray .sticky-applet:not([hidden])',
    });
    plan.assertions.push({
      type: 'childCountMin',
      selector: '#system-tray .sticky-applet__list',
      min: 1,
    });
  }

  return plan;
};

const printDryRun = (plan) => {
  process.stdout.write(`\n=== smoke-app-fidelity-scenario [dry-run] ===\n`);
  process.stdout.write(`URL: ${plan.url}\n`);
  process.stdout.write(`App: ${plan.app} · scénario: ${plan.scenarioId}\n`);
  process.stdout.write('Steps documentés:\n');
  plan.steps.forEach((st, idx) => {
    process.stdout.write(`  ${idx + 1}. ${st}\n`);
  });
  process.stdout.write('Plan Playwright:\n');
  plan.actions.forEach((a, idx) => {
    const detail = a.selector ? ` ${a.selector}` : '';
    const val = a.value ? ` "${a.value}"` : '';
    process.stdout.write(`  ${idx + 1}. ${a.type}${detail}${val}${a.desc ? ` — ${a.desc}` : ''}\n`);
  });
  process.stdout.write('Assertions:\n');
  plan.assertions.forEach((a, idx) => {
    if (a.type === 'selectorVisible') {
      process.stdout.write(`  ${idx + 1}. visible: ${a.selector}\n`);
    } else if (a.type === 'textContains') {
      process.stdout.write(`  ${idx + 1}. contains "${a.text}": ${a.selector}\n`);
    } else if (a.type === 'hasClass') {
      process.stdout.write(`  ${idx + 1}. class "${a.className}": ${a.selector}\n`);
    } else if (a.type === 'childCountMin') {
      process.stdout.write(`  ${idx + 1}. min ${a.min} children: ${a.selector}\n`);
    } else if (a.type === 'selectorPresent') {
      process.stdout.write(`  ${idx + 1}. present: ${a.selector}\n`);
    }
  });
  process.stdout.write('✓ dry-run OK — exécution Playwright requiert CAPSULE_HTTP_BASE\n');
};

const runScenarioActions = async (page, plan) => {
  for (let i = 0; i < plan.actions.length; i += 1) {
    const action = plan.actions[i];
    if (action.type === 'goto' || action.type === 'waitFor' || action.type === 'openSlot') {
      continue;
    }
    if (action.type === 'wait') {
      await page.waitForTimeout(action.ms || 200);
    } else if (action.type === 'click') {
      await page.click(action.selector);
    } else if (action.type === 'fill') {
      await page.fill(action.selector, action.value || '');
    } else if (action.type === 'focus') {
      await page.focus(action.selector);
    } else if (action.type === 'pressKey') {
      if (action.selector) {
        await page.focus(action.selector);
      }
      await page.keyboard.press(action.key || 'Enter');
    } else if (action.type === 'contextMenu') {
      await page.evaluate(({ selector, x, y }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          }));
        }
      }, {
        selector: action.selector,
        x: action.x || 320,
        y: action.y || 280,
      });
    } else if (action.type === 'umTab') {
      await page.evaluate((tab) => {
        const btn = document.querySelector(
          'div[data-link="update_manager"] .update-manager-tabs [data-um-tab="' + tab + '"]',
        );
        if (btn) {
          btn.click();
        }
      }, action.tab);
    } else if (action.type === 'xedPrefsTab') {
      await page.evaluate((tab) => {
        const btn = document.querySelector(
          'div[data-link="text_editor"] [data-xed-prefs-tab="' + tab + '"]',
        );
        if (btn) {
          btn.click();
        }
      }, action.tab);
    } else if (action.type === 'xedMenu') {
      await page.evaluate(({ menu, item }) => {
        const scope = document.querySelector('div[data-link="text_editor"]');
        if (!scope) {
          return;
        }
        if (typeof window.initTextEditorApp === 'function') {
          window.initTextEditorApp();
        }
        const actionMap = {
          'Enregistrer sous': 'save-as',
          'Préférences': 'preferences',
        };
        const actionId = actionMap[item];
        if (actionId) {
          const menus = scope.querySelectorAll('.xed-menu');
          for (let i = 0; i < menus.length; i += 1) {
            const trigger = menus[i].querySelector('.xed-menu__trigger');
            if (!trigger || trigger.textContent.indexOf(menu) < 0) {
              continue;
            }
            trigger.click();
            const target = menus[i].querySelector('[data-xed-action="' + actionId + '"]');
            if (target) {
              target.click();
              return;
            }
          }
        }
        const menus = scope.querySelectorAll('.xed-menu');
        for (let i = 0; i < menus.length; i += 1) {
          const trigger = menus[i].querySelector('.xed-menu__trigger');
          if (!trigger || trigger.textContent.indexOf(menu) < 0) {
            continue;
          }
          trigger.click();
          const dropdown = menus[i].querySelector('.xed-menu__dropdown');
          const items = dropdown ? dropdown.querySelectorAll('.xed-menu__item') : [];
          for (let j = 0; j < items.length; j += 1) {
            const label = items[j].textContent.replace(/\s+/g, ' ').trim();
            if (label.indexOf(item) >= 0) {
              items[j].click();
              return;
            }
          }
        }
      }, { menu: action.menu, item: action.item });
    } else if (action.type === 'nemoMenu') {
      await page.evaluate(({ menu, item }) => {
        const scope = document.querySelector('div[data-link="nemo"]');
        if (!scope) {
          return;
        }
        if (typeof window.resolveFileExplorerMenuAction === 'function') {
          const handled = window.resolveFileExplorerMenuAction(item, { type: 'item', menu: menu }, scope);
          if (handled) {
            return;
          }
        }
        const triggers = scope.querySelectorAll('.nemo-menubar .menuHeader > li > a');
        for (let i = 0; i < triggers.length; i += 1) {
          if (triggers[i].textContent.indexOf(menu) >= 0) {
            triggers[i].click();
            break;
          }
        }
        const links = scope.querySelectorAll('.listeSousMenu a');
        for (let j = 0; j < links.length; j += 1) {
          const label = links[j].textContent.replace(/\s+/g, ' ').trim();
          if (label.indexOf(item) >= 0) {
            links[j].click();
            break;
          }
        }
      }, { menu: action.menu, item: action.item });
    } else if (action.type === 'calcInit') {
      await page.evaluate(() => {
        if (typeof window.initCalculatorApp === 'function') {
          window.initCalculatorApp();
        }
      });
    } else if (action.type === 'calcMode') {
      await page.evaluate((mode) => {
        const opt = document.querySelector(
          'div[data-link="calculator"] [data-calc-mode="' + mode + '"]',
        );
        if (opt) {
          opt.click();
        }
      }, action.mode);
    } else if (action.type === 'calcFn') {
      await page.evaluate((fn) => {
        const btn = document.querySelector(
          'div[data-link="calculator"] [data-fn="' + fn + '"]',
        );
        if (btn) {
          btn.click();
        }
      }, action.fn);
    } else if (action.type === 'calcKeys') {
      await page.evaluate((keys) => {
        const scope = document.querySelector('div[data-link="calculator"]');
        if (!scope) {
          return;
        }
        keys.forEach((key) => {
          let btn = null;
          if (key >= '0' && key <= '9') {
            btn = scope.querySelector('[data-digit="' + key + '"]');
          } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            btn = scope.querySelector('[data-op="' + key + '"]');
          } else if (key === '=') {
            btn = scope.querySelector('[data-calc="equals"]');
          }
          if (btn) {
            btn.click();
          }
        });
      }, action.keys || []);
    } else if (action.type === 'calcHistoryPick') {
      await page.evaluate((idx) => {
        const btn = document.querySelector(
          'div[data-link="calculator"] [data-calc-history-idx="' + idx + '"]',
        );
        if (btn) {
          btn.click();
        }
      }, action.idx);
      await page.evaluate(() => {
        if (typeof window.initFileRollerApp === 'function') {
          window.initFileRollerApp();
        }
      });
    } else if (action.type === 'frOpenDemo') {
      await page.evaluate(() => {
        if (typeof window.openFileRollerDemoArchive === 'function') {
          window.openFileRollerDemoArchive();
        }
      });
    } else if (action.type === 'frNewArchive') {
      await page.evaluate((name) => {
        if (typeof window.openFileRollerNewArchive === 'function') {
          window.openFileRollerNewArchive(name);
        }
      }, action.name || 'archive.zip');
    } else if (action.type === 'terminalInit') {
      await page.evaluate(() => {
        const win = document.querySelector('div[data-link="terminal"]');
        if (win && typeof window.initTerminalForContainer === 'function') {
          window.initTerminalForContainer(win);
        }
      });
    } else if (action.type === 'terminalCommand') {
      await page.evaluate((command) => {
        const input = document.querySelector('div[data-link="terminal"] #command, div[data-link="terminal"] [data-terminal-command]');
        const form = document.querySelector('div[data-link="terminal"] #input, div[data-link="terminal"] [data-terminal-form]');
        if (!input || !form) {
          return;
        }
        input.focus();
        input.value = command;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        input.dispatchEvent(enterEvent);
      }, action.command || '');
    } else if (action.type === 'terminalMenu') {
      await page.evaluate((menuAction) => {
        const item = document.querySelector(
          '[data-terminal-menu-action="' + menuAction + '"]',
        );
        if (item) {
          item.click();
        }
      }, action.action);
    } else if (action.type === 'terminalMenuOpen') {
      await page.evaluate((menuAction) => {
        const win = document.querySelector('div[data-link="terminal"]');
        if (!win) {
          return;
        }
        const menuBtn = win.querySelector('.gnome-terminal-header__button--menu');
        if (menuBtn) {
          menuBtn.click();
        }
        const item = win.querySelector('[data-terminal-menu-action="' + menuAction + '"]');
        if (item) {
          item.click();
        }
      }, action.action);
    } else if (action.type === 'xvInit') {
      await page.evaluate(() => {
        if (typeof window.initVisionneurImagesApp === 'function') {
          window.initVisionneurImagesApp();
        }
      });
    } else if (action.type === 'xvOpenDemo') {
      await page.evaluate(() => {
        if (typeof window.openPixDemoImage === 'function') {
          window.openPixDemoImage();
        }
      });
    } else if (action.type === 'xvAction') {
      await page.evaluate((xvAction) => {
        const btn = document.querySelector(
          'div[data-link="visionneur_images"] [data-xv-action="' + xvAction + '"]',
        );
        if (btn) {
          btn.click();
        }
      }, action.action);
    } else if (action.type === 'xvMenu') {
      await page.evaluate(({ menu, item }) => {
        const scope = document.querySelector('div[data-link="visionneur_images"]');
        if (!scope) {
          return;
        }
        if (menu === 'Fichier') {
          const fileBtn = scope.querySelector('[data-xv-menu="file"]');
          if (fileBtn) {
            fileBtn.click();
          }
        }
        const actionId = item.indexOf('Enregistrer') >= 0 ? 'save-as' : 'open';
        const target = scope.querySelector('[data-xv-menu-action="' + actionId + '"]');
        if (target) {
          target.click();
        }
      }, { menu: action.menu, item: action.item });
    } else if (action.type === 'stickyInit') {
      await page.evaluate(() => {
        if (typeof window.initStickyApp === 'function') {
          window.initStickyApp();
        }
      });
    } else if (action.type === 'evaluate') {
      await page.evaluate(() => {});
    }
  }
};

const runScenarioAssertions = async (page, plan, errors) => {
  for (let i = 0; i < plan.assertions.length; i += 1) {
    const a = plan.assertions[i];
    if (a.type === 'selectorVisible') {
      const el = await page.$(a.selector);
      if (!el) errors.push(`Sélecteur absent: ${a.selector}`);
    } else if (a.type === 'textContains') {
      const el = await page.$(a.selector);
      const text = el ? await el.textContent() : '';
      if (!text || text.indexOf(a.text) < 0) {
        errors.push(`Texte "${a.text}" absent dans ${a.selector}`);
      }
    } else if (a.type === 'inputValueContains') {
      const value = await page.inputValue(a.selector).catch(() => '');
      if (!value || value.indexOf(a.text) < 0) {
        errors.push(`Valeur "${a.text}" absente dans ${a.selector}`);
      }
    } else if (a.type === 'hasClass') {
      const hasClass = await page.evaluate(({ selector, className }) => {
        const node = document.querySelector(selector);
        return !!(node && node.classList && node.classList.contains(className));
      }, { selector: a.selector, className: a.className });
      if (!hasClass) {
        errors.push(`Classe "${a.className}" absente sur ${a.selector}`);
      }
    } else if (a.type === 'childCountMin') {
      const count = await page.evaluate((selector) => {
        const node = document.querySelector(selector);
        if (!node) {
          return 0;
        }
        if (node.hidden) {
          return 0;
        }
        return node.querySelectorAll(
          'a, .nemo-app__list-row, .nemo-app__context-item, .mi-app__list-item, .cs-wallpaper-thumb, .firefox-tab, .capsule-browser__menu-item, tr, .gnome-calc__history-item, .terminal-tabs button, .stk-app__item, .sticky-applet__item, li',
        ).length;
      }, a.selector);
      if (count < (a.min || 1)) {
        errors.push(`Enfants insuffisants (${count} < ${a.min}) dans ${a.selector}`);
      }
    } else if (a.type === 'selectorPresent') {
      const el = await page.$(a.selector);
      if (!el) {
        errors.push(`Élément absent: ${a.selector}`);
      }
    } else if (a.type === 'evaluateTruthy') {
      const ok = await page.evaluate(({ fn, args }) => {
        if (fn === 'xedFindSelection') {
          const area = document.getElementById('xed-area');
          if (!area) {
            return false;
          }
          const sel = area.value.substring(area.selectionStart, area.selectionEnd);
          return sel === (args && args.term);
        }
        if (fn === 'umCheckboxToggled') {
          const cb = document.querySelector(
            'div[data-link="update_manager"] .update-manager-list tbody input[type="checkbox"]',
          );
          if (!cb) {
            return false;
          }
          return cb.checked === (args && args.checked);
        }
        if (fn === 'umRefreshBusy') {
          const app = document.getElementById('updateManagerApp');
          const refreshBtn = document.querySelector(
            'div[data-link="update_manager"] .update-manager-refresh',
          );
          return !!(app && app.dataset.umBusy === 'true' && refreshBtn && refreshBtn.disabled);
        }
        if (fn === 'terminalHasOutput') {
          const output = document.querySelector('div[data-link="terminal"] #output');
          return !!(output && output.textContent && output.textContent.trim().length > 0);
        }
        return false;
      }, { fn: a.fn, args: a.args });
      if (!ok) {
        errors.push(`Assertion evaluateTruthy échouée: ${a.fn}`);
      }
    }
  }
};

const runPlaywright = async (plan) => {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    process.stderr.write('✗ Playwright indisponible\n');
    process.exit(1);
  }

  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];

  if (plan.dialogHandler && plan.dialogHandler.accept) {
    page.on('dialog', async (dialog) => {
      await dialog.accept(plan.dialogHandler.accept);
    });
  }

  try {
    await page.goto(plan.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
      timeout: 30000,
    });
    await page.evaluate((slot) => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink(slot);
      }
    }, plan.openSlot || plan.app);
    await page.waitForTimeout(800);

    if (plan.preOpen && plan.preOpen.type === 'umPrep') {
      await page.evaluate(() => {
        try {
          window.localStorage.removeItem('capsule-mintupdate-welcome-dismissed');
          window.localStorage.removeItem('capsule-mintupdate-mirror-dismissed');
        } catch (e) {
          /* ignore */
        }
        if (typeof window.initUpdateManagerApp === 'function') {
          window.initUpdateManagerApp();
        }
      });
      await page.waitForTimeout(120);
    }

    if (plan.app === 'text_editor') {
      await page.evaluate(() => {
        if (typeof window.initTextEditorApp === 'function') {
          window.initTextEditorApp();
        }
      });
      await page.waitForTimeout(80);
    }

    if (plan.app === 'calculator') {
      await page.evaluate(() => {
        if (typeof window.initCalculatorApp === 'function') {
          window.initCalculatorApp();
        }
      });
      await page.waitForTimeout(80);
    }

    if (plan.app === 'file_roller') {
      await page.evaluate(() => {
        if (typeof window.initFileRollerApp === 'function') {
          window.initFileRollerApp();
        }
      });
      await page.waitForTimeout(80);
    }

    if (plan.app === 'terminal') {
      await page.evaluate(() => {
        if (typeof window.initTerminalForContainer === 'function') {
          const win = document.querySelector('div[data-link="terminal"]');
          if (win) {
            window.initTerminalForContainer(win);
          }
        }
      });
      await page.waitForTimeout(200);
    }

    if (plan.app === 'pix') {
      await page.evaluate(() => {
        if (typeof window.initVisionneurImagesApp === 'function') {
          window.initVisionneurImagesApp();
        }
      });
      await page.waitForSelector('div[data-link="visionneur_images"] .pix-viewer', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(120);
    }

    if (plan.app === 'sticky') {
      await page.evaluate(() => {
        if (typeof window.initStickyApp === 'function') {
          window.initStickyApp();
        }
      });
      await page.waitForTimeout(80);
    }

    if (plan.prepActions && plan.prepActions.length > 0) {
      await runScenarioActions(page, { actions: plan.prepActions });
    }

    await runScenarioAssertions(page, { assertions: plan.baseAssertions }, errors);

    if (plan.executionBlocks.length > 0) {
      for (let bi = 0; bi < plan.executionBlocks.length; bi += 1) {
        await runScenarioActions(page, plan.executionBlocks[bi]);
        await runScenarioAssertions(page, plan.executionBlocks[bi], errors);
      }
    }

    await runScenarioActions(page, plan);
    await runScenarioAssertions(page, plan, errors);
  } catch (err) {
    errors.push(String(err.message || err));
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    errors.forEach((e) => process.stderr.write(`✗ ${e}\n`));
    process.exit(1);
  }
  process.stdout.write(`✓ smoke-app-fidelity-scenario ${plan.scenarioId} OK\n`);
};

const main = async () => {
  const opts = parseArgs();
  if (!opts.scenario) {
    process.stderr.write('Usage: --id <registryId> --scenario <id> [--dry-run]\n');
    process.exit(1);
  }

  const inventory = loadInventory(opts.id);
  const scenario = findScenario(inventory, opts.scenario);
  if (!scenario) {
    process.stderr.write(`Scénario inconnu: ${opts.scenario}\n`);
    process.exit(1);
  }

  const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501';
  const plan = buildPlaywrightPlan(opts.id, scenario, httpBase);

  if (opts.dryRun) {
    printDryRun(plan);
    return;
  }

  if (!process.env.CAPSULE_HTTP_BASE) {
    process.stdout.write('○ CAPSULE_HTTP_BASE non défini — dry-run implicite\n');
    printDryRun(plan);
    return;
  }

  await runPlaywright(plan);
};

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
