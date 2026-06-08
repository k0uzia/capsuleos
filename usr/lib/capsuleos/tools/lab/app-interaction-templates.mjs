/**
 * Checklists d'interactions par slot — base pour collect + run-app-parity-pass.
 */

/** @type {Record<string, { label: string, vmDoc?: string, checks: object[] }>} */
export const SLOT_TEMPLATES = {
  nemo: {
    label: 'Fichiers (Nemo)',
    vmDoc: 'linux-mint-nemo-vm.md',
    checks: [
      { id: 'win-open', dimension: 'int', type: 'eval', expect: 'window visible + nav delegation' },
      { id: 'sidebar-places', dimension: 'nav', type: 'click', selector: '#voletnemo a[data-link="Documents"]' },
      { id: 'sidebar-bookmark', dimension: 'nav', type: 'click', selector: '#voletnemo a[data-nemo-bookmark="true"]' },
      { id: 'toolbar-back', dimension: 'nav', type: 'click', selector: '#precedent' },
      { id: 'view-icons-list', dimension: 'int', type: 'click', selector: '.nemo-app__toolbar-group--view a img[src*="view-grid"]' },
      { id: 'search-toggle', dimension: 'int', type: 'click', selector: '#nemo-search' },
      { id: 'path-breadcrumb', dimension: 'nav', type: 'eval', expect: 'toggle path mode + crumb nav' },
      { id: 'footer-sidebar-modes', dimension: 'nav', type: 'eval', expect: 'places/tree/F9 toggle' },
      { id: 'context-menu', dimension: 'ctx', type: 'contextmenu', selector: '.nemoElement' },
      { id: 'open-text-file', dimension: 'data', type: 'eval', expect: 'double-click txt opens xed' },
    ],
  },
  firefox: {
    label: 'Firefox',
    vmDoc: 'linux-mint-firefox-vm.md',
    checks: [
      { id: 'chrome-layout', dimension: 'vis', type: 'eval', expect: 'header before tabs, Proton chrome' },
      { id: 'new-tab', dimension: 'int', type: 'click', selector: '[data-browser-action="new-tab"]' },
      { id: 'address-nav', dimension: 'nav', type: 'click', selector: '[data-browser-newtab-link]' },
      { id: 'bookmarks-bar', dimension: 'nav', type: 'click', selector: '[data-browser-action="toggle-bookmarks"]' },
      { id: 'app-menu', dimension: 'nav', type: 'click', selector: '.capsule-browser__btn--icon-menu' },
    ],
  },
  text_editor: {
    label: 'Éditeur de texte (xed)',
    checks: [
      { id: 'win-open', dimension: 'int', type: 'eval', expect: 'xedInit + toolbar' },
      { id: 'menu-fichier', dimension: 'nav', type: 'click', selector: '.xed-menu__trigger' },
      { id: 'menu-edition', dimension: 'nav', type: 'eval', expect: 'menu Édition ouvrable' },
      { id: 'menu-affichage', dimension: 'nav', type: 'eval', expect: 'menu Affichage + toggle barre' },
      { id: 'find-dialog', dimension: 'ctx', type: 'eval', expect: 'dialogue Rechercher' },
      { id: 'replace-dialog', dimension: 'ctx', type: 'eval', expect: 'dialogue Remplacer' },
      { id: 'kb-paste', dimension: 'kb', type: 'keyboard', expect: 'Ctrl+C/V' },
      { id: 'statusbar', dimension: 'vis', type: 'eval', expect: 'position + char count' },
    ],
  },
  calculator: {
    label: 'Calculatrice',
    checks: [
      { id: 'win-open', dimension: 'int', type: 'eval', expect: 'calcInit' },
      { id: 'basic-arithmetic', dimension: 'int', type: 'click', expect: '2+3=5' },
      { id: 'mode-switch', dimension: 'nav', type: 'click', selector: '#gnome-calc-mode' },
      { id: 'backspace', dimension: 'int', type: 'click', selector: '[data-calc="backspace"]' },
      { id: 'kb-digits', dimension: 'kb', type: 'keyboard', expect: 'digit keys' },
    ],
  },
  file_roller: {
    label: 'Gestionnaire d\'archives',
    vmDoc: 'linux-mint-file-roller-vm.md',
    checks: [
      { id: 'empty-state', dimension: 'data', type: 'eval', expect: 'empty archive manager' },
      { id: 'open-demo', dimension: 'int', type: 'click', selector: '[data-fr-menu="open-demo"]' },
      { id: 'hamburger-menu', dimension: 'nav', type: 'click', selector: '[data-fr-action="menu"]' },
      { id: 'window-drag', dimension: 'vis', type: 'drag', selector: '#windowHeader' },
    ],
  },
  update_manager: {
    label: 'Gestionnaire de mises à jour',
    vmDoc: 'linux-mint-update-manager-vm.md',
    checks: [
      { id: 'welcome-screen', dimension: 'data', type: 'eval', expect: 'welcome visible on first open' },
      { id: 'welcome-dismiss', dimension: 'int', type: 'click', selector: '[data-um-welcome="finish"]' },
      { id: 'menubar-file', dimension: 'nav', type: 'click', selector: '[data-um-menu="file"]' },
      { id: 'refresh-list', dimension: 'int', type: 'click', selector: '[data-um-action="refresh"]' },
    ],
  },
  mintinstall: {
    label: 'Logithèque',
    checks: [
      { id: 'search', dimension: 'int', type: 'fill', selector: '#mi-search' },
      { id: 'categories', dimension: 'nav', type: 'click', selector: '[data-mi-cat="internet"]' },
      { id: 'hamburger-menu', dimension: 'ctx', type: 'click', selector: '[data-mi-action="menu"]' },
      { id: 'install', dimension: 'int', type: 'click', selector: '[data-mi-install]' },
    ],
  },
  themes: {
    label: 'Paramètres système (cinnamon-settings)',
    checks: [
      { id: 'sidebar-panels', dimension: 'nav', type: 'eval', expect: 'panel list + search' },
      { id: 'panel-search', dimension: 'nav', type: 'fill', selector: '#cs-search' },
      { id: 'panel-switch', dimension: 'int', type: 'click', selector: '[data-cs-nav]' },
      { id: 'panel-toggle', dimension: 'int', type: 'eval', expect: 'cs-switch toggle' },
    ],
  },
};

export const SHELL_TEMPLATES = {
  mainMenu: {
    label: 'Menu Cinnamon',
    checks: [
      { id: 'open-menu', dimension: 'nav', type: 'click', selector: 'footer nav a[data-link="mainMenu"]' },
      { id: 'search-apps', dimension: 'int', type: 'fill', selector: '#menu-search' },
    ],
  },
  panel: {
    label: 'Panel + liste fenêtres',
    checks: [
      { id: 'window-list', dimension: 'nav', type: 'eval', expect: 'running apps in list' },
      { id: 'launcher-focus', dimension: 'int', type: 'click', selector: '#taskbar-window-list a' },
    ],
  },
  tray: {
    label: 'Zone notification (tray)',
    checks: [{ id: 'systray-present', dimension: 'vis', type: 'eval', expect: 'tray icons' }],
  },
  clock: {
    label: 'Horloge / calendrier',
    checks: [{ id: 'calendar-popover', dimension: 'ctx', type: 'click', selector: '#date' }],
  },
  desktop: {
    label: 'Bureau + favoris',
    checks: [
      { id: 'shortcuts', dimension: 'int', type: 'eval', expect: 'desktop shortcuts' },
      { id: 'context-menu', dimension: 'ctx', type: 'contextmenu', selector: '#desktop' },
    ],
  },
  theme: {
    label: 'Thème Mint-Y-Dark-Aqua',
    checks: [{ id: 'tokens', dimension: 'vis', type: 'eval', expect: 'accent #1f9ede' }],
  },
};

/** Scores initiaux estimés (smoke existant + docs VM). */
export const BASELINE_DIMENSIONS = {
  nemo: { vis: 92, nav: 88, int: 90, ctx: 45, kb: 50, data: 92 },
  firefox: { vis: 90, nav: 86, int: 88, ctx: 72, kb: 58, data: 85 },
  text_editor: { vis: 82, nav: 78, int: 80, ctx: 70, kb: 75, data: 80 },
  calculator: { vis: 78, nav: 52, int: 75, ctx: 40, kb: 65, data: 70 },
  file_roller: { vis: 88, nav: 80, int: 85, ctx: 68, kb: 40, data: 88 },
  update_manager: { vis: 85, nav: 82, int: 80, ctx: 70, kb: 45, data: 86 },
  mintinstall: { vis: 80, nav: 75, int: 78, ctx: 60, kb: 40, data: 75 },
  themes: { vis: 82, nav: 78, int: 76, ctx: 65, kb: 50, data: 80 },
  terminal: { vis: 85, nav: 70, int: 82, ctx: 55, kb: 75, data: 85 },
  default: { vis: 70, nav: 55, int: 60, ctx: 40, kb: 35, data: 65 },
};

export const SHELL_BASELINE = {
  mainMenu: { vis: 75, nav: 68, int: 70, ctx: 55, kb: 50, data: 80 },
  panel: { vis: 78, nav: 72, int: 74, ctx: 50, kb: 45, data: 82 },
  tray: { vis: 90, nav: 85, int: 88, ctx: 70, kb: 40, data: 85 },
  clock: { vis: 92, nav: 88, int: 90, ctx: 85, kb: 50, data: 88 },
  desktop: { vis: 72, nav: 65, int: 68, ctx: 60, kb: 45, data: 75 },
  theme: { vis: 95, nav: 90, int: 90, ctx: 80, kb: 50, data: 90 },
};
